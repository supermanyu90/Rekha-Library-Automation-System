import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, CheckCircle, Search } from 'lucide-react';

interface Fine {
  id: string;
  fine_amount: string;
  paid_status: string;
  assessed_date: string;
  borrow_records: {
    members: { full_name: string; email: string };
    books: { title: string; author: string };
    due_date: string;
    return_date: string | null;
  };
}

export default function Fines() {
  const { staff } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .select(`
          id,
          fine_amount,
          paid_status,
          assessed_date,
          borrow_records:borrow_id (
            due_date,
            return_date,
            members:member_id (full_name, email),
            books:book_id (title, author)
          )
        `)
        .order('assessed_date', { ascending: false });

      if (error) throw error;
      setFines(data || []);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (fineId: string) => {
    if (!confirm('Mark this fine as paid?')) return;

    try {
      const { error } = await supabase
        .from('fines')
        .update({ paid_status: 'paid' })
        .eq('id', fineId);

      if (error) throw error;
      fetchFines();
      alert('Fine marked as paid!');
    } catch (error) {
      console.error('Error updating fine:', error);
      alert('Error updating fine');
    }
  };

  const filteredFines = fines.filter(fine =>
    fine.borrow_records.members.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fine.borrow_records.books.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFines = fines.reduce((sum, fine) => sum + parseFloat(fine.fine_amount), 0);
  const unpaidFines = fines
    .filter(f => f.paid_status === 'unpaid')
    .reduce((sum, fine) => sum + parseFloat(fine.fine_amount), 0);
  const paidFines = fines
    .filter(f => f.paid_status === 'paid')
    .reduce((sum, fine) => sum + parseFloat(fine.fine_amount), 0);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading fines...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fines Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Total Fines</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalFines.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Unpaid Fines</p>
              <p className="text-2xl font-bold text-red-600">₹{unpaidFines.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Paid Fines</p>
              <p className="text-2xl font-bold text-green-600">₹{paidFines.toFixed(2)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search fines by member or book..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Book</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Overdue</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fine Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Assessed Date</th>
              {canEdit && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredFines.map((fine) => {
              const dueDate = new Date(fine.borrow_records.due_date);
              const returnDate = fine.borrow_records.return_date
                ? new Date(fine.borrow_records.return_date)
                : new Date();
              const daysOverdue = Math.max(0, Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <tr key={fine.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{fine.borrow_records.members.full_name}</div>
                      <div className="text-xs text-gray-500">{fine.borrow_records.members.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{fine.borrow_records.books.title}</div>
                      <div className="text-xs text-gray-500">{fine.borrow_records.books.author}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {dueDate.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      {daysOverdue} days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    ₹{parseFloat(fine.fine_amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      fine.paid_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {fine.paid_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(fine.assessed_date).toLocaleDateString()}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-sm">
                      {fine.paid_status === 'unpaid' && (
                        <button
                          onClick={() => handleMarkPaid(fine.id)}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-800"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
