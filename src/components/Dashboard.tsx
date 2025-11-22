import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Users, BookMarked, DollarSign, TrendingUp } from 'lucide-react';

interface Stats {
  totalMembers: number;
  activeMembers: number;
  totalBooks: number;
  availableBooks: number;
  issuedBooks: number;
  overdueBooks: number;
  totalFines: number;
  unpaidFines: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeMembers: 0,
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    overdueBooks: 0,
    totalFines: 0,
    unpaidFines: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [membersRes, booksRes, borrowRes, finesRes] = await Promise.all([
        supabase.from('members').select('status', { count: 'exact' }),
        supabase.from('books').select('total_copies, available_copies'),
        supabase.from('borrow_records').select('status', { count: 'exact' }),
        supabase.from('fines').select('fine_amount, paid_status'),
      ]);

      const totalMembers = membersRes.count || 0;
      const activeMembers = membersRes.data?.filter(m => m.status === 'active').length || 0;

      const totalBooks = booksRes.data?.reduce((sum, book) => sum + (book.total_copies || 0), 0) || 0;
      const availableBooks = booksRes.data?.reduce((sum, book) => sum + (book.available_copies || 0), 0) || 0;

      const issuedBooks = borrowRes.data?.filter(b => b.status === 'issued').length || 0;
      const overdueBooks = borrowRes.data?.filter(b => b.status === 'overdue').length || 0;

      const totalFines = finesRes.data?.reduce((sum, fine) => sum + parseFloat(fine.fine_amount.toString()), 0) || 0;
      const unpaidFines = finesRes.data?.filter(f => f.paid_status === 'unpaid').reduce((sum, fine) => sum + parseFloat(fine.fine_amount.toString()), 0) || 0;

      setStats({
        totalMembers,
        activeMembers,
        totalBooks,
        availableBooks,
        issuedBooks,
        overdueBooks,
        totalFines,
        unpaidFines,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Members', value: stats.totalMembers, subtext: `${stats.activeMembers} active`, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Books', value: stats.totalBooks, subtext: `${stats.availableBooks} available`, icon: BookMarked, color: 'bg-green-500' },
    { label: 'Books Issued', value: stats.issuedBooks, subtext: `${stats.overdueBooks} overdue`, icon: BookOpen, color: 'bg-orange-500' },
    { label: 'Total Fines', value: `₹${stats.totalFines.toFixed(2)}`, subtext: `₹${stats.unpaidFines.toFixed(2)} unpaid`, icon: DollarSign, color: 'bg-red-500' },
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.subtext}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Books in Circulation</span>
              <span className="font-semibold text-gray-900">{stats.issuedBooks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Available for Loan</span>
              <span className="font-semibold text-gray-900">{stats.availableBooks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Utilization Rate</span>
              <span className="font-semibold text-gray-900">
                {stats.totalBooks > 0 ? ((stats.issuedBooks / stats.totalBooks) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attention Required</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Overdue Books</span>
              <span className="font-semibold text-red-600">{stats.overdueBooks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Unpaid Fines</span>
              <span className="font-semibold text-red-600">₹{stats.unpaidFines.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Action Needed</span>
              <span className="font-semibold text-red-600">
                {stats.overdueBooks > 0 || stats.unpaidFines > 0 ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
