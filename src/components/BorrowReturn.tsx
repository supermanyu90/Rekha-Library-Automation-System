import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, RotateCcw, Search } from 'lucide-react';

interface BorrowRecord {
  id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  members: { full_name: string; email: string } | null;
  books: { title: string; author: string } | null;
  staff: { name: string } | null;
}

export default function BorrowReturn() {
  const { staff } = useAuth();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    member_id: '',
    book_id: '',
    due_days: '14',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const canIssue = staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchRecords();
    fetchMembers();
    fetchBooks();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('borrow_records')
        .select(`
          id,
          issue_date,
          due_date,
          return_date,
          status,
          members:member_id (full_name, email),
          books:book_id (title, author),
          staff:issued_by (name)
        `)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, email, status')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, available_copies')
        .gt('available_copies', 0)
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staff) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(issueFormData.due_days));

    try {
      const { error } = await supabase
        .from('borrow_records')
        .insert([{
          member_id: issueFormData.member_id,
          book_id: issueFormData.book_id,
          issued_by: staff.id,
          due_date: dueDate.toISOString(),
          status: 'issued',
        }]);

      if (error) throw error;

      setShowIssueModal(false);
      setIssueFormData({ member_id: '', book_id: '', due_days: '14' });
      fetchRecords();
      fetchBooks();
      alert('Book issued successfully!');
    } catch (error) {
      console.error('Error issuing book:', error);
      alert('Error issuing book. Please check if the book is available.');
    }
  };

  const handleReturn = async (recordId: string) => {
    if (!confirm('Are you sure you want to mark this book as returned? The book inventory will be updated automatically.')) return;

    try {
      const { error } = await supabase
        .from('borrow_records')
        .update({
          return_date: new Date().toISOString(),
          status: 'returned',
        })
        .eq('id', recordId);

      if (error) throw error;

      fetchRecords();
      fetchBooks();
      alert('Book returned successfully! The available copy count has been updated.');
    } catch (error: any) {
      console.error('Error returning book:', error);
      alert('Error returning book: ' + (error.message || 'Unknown error'));
    }
  };

  const filteredRecords = records.filter(record =>
    record.members?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.books?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading records...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Borrow & Return Management</h2>
        {canIssue && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Issue Book</span>
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by member or book..."
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Issued By</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Issue Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Return Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              {canIssue && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{record.members?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{record.members?.email || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{record.books?.title || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{record.books?.author || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.staff?.name || 'Unknown'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(record.issue_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(record.due_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {record.return_date ? new Date(record.return_date).toLocaleDateString() : 'Not returned'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    record.status === 'returned' ? 'bg-green-100 text-green-700' :
                    record.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {record.status}
                  </span>
                </td>
                {canIssue && (
                  <td className="px-4 py-3 text-sm">
                    {record.status !== 'returned' && (
                      <button
                        onClick={() => handleReturn(record.id)}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-800"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Return</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Issue Book</h3>
            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Member</label>
                <select
                  required
                  value={issueFormData.member_id}
                  onChange={(e) => setIssueFormData({ ...issueFormData, member_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Book</label>
                <select
                  required
                  value={issueFormData.book_id}
                  onChange={(e) => setIssueFormData({ ...issueFormData, book_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a book...</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} by {book.author} ({book.available_copies} available)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due in Days</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={issueFormData.due_days}
                  onChange={(e) => setIssueFormData({ ...issueFormData, due_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Due date: {new Date(Date.now() + parseInt(issueFormData.due_days) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Issue Book
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
