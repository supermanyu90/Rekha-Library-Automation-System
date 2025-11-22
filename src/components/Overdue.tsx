import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';

interface OverdueRecord {
  id: string;
  issue_date: string;
  due_date: string;
  status: string;
  members: { full_name: string; email: string; phone: string | null };
  books: { title: string; author: string };
  staff: { name: string };
  fines: { fine_amount: string; paid_status: string }[];
}

export default function Overdue() {
  const [overdueRecords, setOverdueRecords] = useState<OverdueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOverdueRecords();
  }, []);

  const fetchOverdueRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('borrow_records')
        .select(`
          id,
          issue_date,
          due_date,
          status,
          members:member_id (full_name, email, phone),
          books:book_id (title, author),
          staff:issued_by (name),
          fines (fine_amount, paid_status)
        `)
        .eq('status', 'overdue')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setOverdueRecords(data || []);
    } catch (error) {
      console.error('Error fetching overdue records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOverdue = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_overdue_records');

      if (error) throw error;

      const { data: fineData, error: fineError } = await supabase.rpc('generate_fines_for_overdue');

      if (fineError) throw fineError;

      await fetchOverdueRecords();
      alert(`Updated ${data || 0} overdue records and generated/updated ${fineData || 0} fines`);
    } catch (error) {
      console.error('Error updating overdue records:', error);
      alert('Error updating overdue records');
    } finally {
      setUpdating(false);
    }
  };

  const filteredRecords = overdueRecords.filter(record =>
    record.members.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.books.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOverdueFines = overdueRecords.reduce((sum, record) => {
    const fine = record.fines[0];
    return sum + (fine ? parseFloat(fine.fine_amount) : 0);
  }, 0);

  const unpaidOverdueFines = overdueRecords.reduce((sum, record) => {
    const fine = record.fines[0];
    return sum + (fine && fine.paid_status === 'unpaid' ? parseFloat(fine.fine_amount) : 0);
  }, 0);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading overdue records...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Overdue Books</h2>
        <button
          onClick={handleUpdateOverdue}
          disabled={updating}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
          <span>{updating ? 'Updating...' : 'Update Overdue & Fines'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Total Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueRecords.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Total Overdue Fines</p>
              <p className="text-2xl font-bold text-orange-600">₹{totalOverdueFines.toFixed(2)}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Unpaid Overdue Fines</p>
              <p className="text-2xl font-bold text-yellow-700">₹{unpaidOverdueFines.toFixed(2)}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-700" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search overdue records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">No Overdue Books!</p>
          <p className="text-gray-600">All books are returned on time or still within the due date.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Book</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Issue Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Overdue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fine</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fine Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const dueDate = new Date(record.due_date);
                const today = new Date();
                const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                const fine = record.fines[0];

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{record.members.full_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-xs text-gray-600">{record.members.email}</div>
                      <div className="text-xs text-gray-500">{record.members.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{record.books.title}</div>
                        <div className="text-xs text-gray-500">{record.books.author}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(record.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {dueDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        daysOverdue > 30 ? 'bg-red-100 text-red-700' :
                        daysOverdue > 14 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {daysOverdue} days
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {fine ? `₹${parseFloat(fine.fine_amount).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {fine ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          fine.paid_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {fine.paid_status}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">No fine</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
