import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, TrendingUp, Award, Clock, Star, BookMarked, UserCheck } from 'lucide-react';

interface BookStats {
  most_issued: { book_title: string; book_author: string; issue_count: number }[];
  most_liked: { book_title: string; book_author: string; avg_rating: number; review_count: number }[];
  most_requested: { book_title: string; author: string; request_count: number }[];
  most_reserved: { book_title: string; book_author: string; reservation_count: number }[];
  total_issued: number;
  currently_issued: number;
  overdue_count: number;
}

interface MemberStats {
  most_active: { member_name: string; member_email: string; borrow_count: number }[];
  total_members: number;
  active_members: number;
  pending_members: number;
}

interface CategoryStats {
  category: string;
  book_count: number;
  total_copies: number;
}

export default function Analytics() {
  const { staff } = useAuth();
  const [bookStats, setBookStats] = useState<BookStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  const canView = staff?.role === 'superadmin' || staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    if (canView) {
      fetchAnalytics();
    }
  }, [canView]);

  const fetchAnalytics = async () => {
    try {
      await Promise.all([
        fetchBookStats(),
        fetchMemberStats(),
        fetchCategoryStats(),
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookStats = async () => {
    try {
      const { data: mostIssued, error: issuedError } = await supabase
        .from('borrow_records')
        .select(`
          book_id,
          books (title, author)
        `)
        .limit(1000);

      if (issuedError) throw issuedError;

      const issuedCounts = (mostIssued || []).reduce((acc: any, record: any) => {
        const bookId = record.book_id;
        const bookTitle = record.books?.title || 'Unknown';
        const bookAuthor = record.books?.author || 'Unknown';
        if (!acc[bookId]) {
          acc[bookId] = { book_title: bookTitle, book_author: bookAuthor, issue_count: 0 };
        }
        acc[bookId].issue_count++;
        return acc;
      }, {});

      const mostIssuedBooks = Object.values(issuedCounts)
        .sort((a: any, b: any) => b.issue_count - a.issue_count)
        .slice(0, 5);

      const { data: reviews, error: reviewError } = await supabase
        .from('book_reviews')
        .select(`
          book_id,
          rating,
          books (title, author)
        `)
        .eq('status', 'approved');

      if (reviewError) throw reviewError;

      const reviewStats = (reviews || []).reduce((acc: any, review: any) => {
        const bookId = review.book_id;
        const bookTitle = review.books?.title || 'Unknown';
        const bookAuthor = review.books?.author || 'Unknown';
        if (!acc[bookId]) {
          acc[bookId] = { book_title: bookTitle, book_author: bookAuthor, total_rating: 0, review_count: 0 };
        }
        acc[bookId].total_rating += review.rating;
        acc[bookId].review_count++;
        return acc;
      }, {});

      const mostLikedBooks = Object.values(reviewStats)
        .map((stat: any) => ({
          book_title: stat.book_title,
          book_author: stat.book_author,
          avg_rating: stat.total_rating / stat.review_count,
          review_count: stat.review_count,
        }))
        .sort((a: any, b: any) => b.avg_rating - a.avg_rating)
        .slice(0, 5);

      const { data: requests, error: requestError } = await supabase
        .from('book_requests')
        .select('book_title, author');

      if (requestError) throw requestError;

      const requestCounts = (requests || []).reduce((acc: any, request: any) => {
        const key = `${request.book_title}|${request.author || 'Unknown'}`;
        if (!acc[key]) {
          acc[key] = { book_title: request.book_title, author: request.author || 'Unknown', request_count: 0 };
        }
        acc[key].request_count++;
        return acc;
      }, {});

      const mostRequestedBooks = Object.values(requestCounts)
        .sort((a: any, b: any) => b.request_count - a.request_count)
        .slice(0, 5);

      const { data: reservations, error: reservationError } = await supabase
        .from('book_reservations')
        .select(`
          book_id,
          books (title, author)
        `);

      if (reservationError) throw reservationError;

      const reservationCounts = (reservations || []).reduce((acc: any, reservation: any) => {
        const bookId = reservation.book_id;
        const bookTitle = reservation.books?.title || 'Unknown';
        const bookAuthor = reservation.books?.author || 'Unknown';
        if (!acc[bookId]) {
          acc[bookId] = { book_title: bookTitle, book_author: bookAuthor, reservation_count: 0 };
        }
        acc[bookId].reservation_count++;
        return acc;
      }, {});

      const mostReservedBooks = Object.values(reservationCounts)
        .sort((a: any, b: any) => b.reservation_count - a.reservation_count)
        .slice(0, 5);

      const { count: totalIssued } = await supabase
        .from('borrow_records')
        .select('*', { count: 'exact', head: true });

      const { count: currentlyIssued } = await supabase
        .from('borrow_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'issued');

      const { count: overdueCount } = await supabase
        .from('borrow_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'overdue');

      setBookStats({
        most_issued: mostIssuedBooks as any,
        most_liked: mostLikedBooks as any,
        most_requested: mostRequestedBooks as any,
        most_reserved: mostReservedBooks as any,
        total_issued: totalIssued || 0,
        currently_issued: currentlyIssued || 0,
        overdue_count: overdueCount || 0,
      });
    } catch (error) {
      console.error('Error fetching book stats:', error);
    }
  };

  const fetchMemberStats = async () => {
    try {
      const { data: borrowRecords, error: borrowError } = await supabase
        .from('borrow_records')
        .select(`
          member_id,
          members (full_name, email)
        `);

      if (borrowError) throw borrowError;

      const memberBorrowCounts = (borrowRecords || []).reduce((acc: any, record: any) => {
        const memberId = record.member_id;
        const memberName = record.members?.full_name || 'Unknown';
        const memberEmail = record.members?.email || 'Unknown';
        if (!acc[memberId]) {
          acc[memberId] = { member_name: memberName, member_email: memberEmail, borrow_count: 0 };
        }
        acc[memberId].borrow_count++;
        return acc;
      }, {});

      const mostActiveMembers = Object.values(memberBorrowCounts)
        .sort((a: any, b: any) => b.borrow_count - a.borrow_count)
        .slice(0, 10);

      const { count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      const { count: activeMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: pendingMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setMemberStats({
        most_active: mostActiveMembers as any,
        total_members: totalMembers || 0,
        active_members: activeMembers || 0,
        pending_members: pendingMembers || 0,
      });
    } catch (error) {
      console.error('Error fetching member stats:', error);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('category, total_copies');

      if (error) throw error;

      const categoryCounts = (data || []).reduce((acc: any, book: any) => {
        const category = book.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { category, book_count: 0, total_copies: 0 };
        }
        acc[category].book_count++;
        acc[category].total_copies += book.total_copies;
        return acc;
      }, {});

      const stats = Object.values(categoryCounts).sort((a: any, b: any) => b.book_count - a.book_count);
      setCategoryStats(stats as CategoryStats[]);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading analytics...</div>;
  }

  if (!canView) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have permission to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Library Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{bookStats?.total_issued || 0}</p>
          <p className="text-sm text-gray-600">Total Books Issued</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{bookStats?.currently_issued || 0}</p>
          <p className="text-sm text-gray-600">Currently Issued</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{bookStats?.overdue_count || 0}</p>
          <p className="text-sm text-gray-600">Overdue Books</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{memberStats?.active_members || 0}</p>
          <p className="text-sm text-gray-600">Active Members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Most Issued Books</h3>
          </div>
          {bookStats?.most_issued && bookStats.most_issued.length > 0 ? (
            <div className="space-y-3">
              {bookStats.most_issued.map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{book.book_title}</p>
                    <p className="text-sm text-gray-600">{book.book_author}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {book.issue_count} issues
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Most Liked Books</h3>
          </div>
          {bookStats?.most_liked && bookStats.most_liked.length > 0 ? (
            <div className="space-y-3">
              {bookStats.most_liked.map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{book.book_title}</p>
                    <p className="text-sm text-gray-600">{book.book_author}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-gray-900">{book.avg_rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{book.review_count} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Most Requested Books</h3>
          </div>
          {bookStats?.most_requested && bookStats.most_requested.length > 0 ? (
            <div className="space-y-3">
              {bookStats.most_requested.map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{book.book_title}</p>
                    <p className="text-sm text-gray-600">{book.author}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {book.request_count} requests
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BookMarked className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Most Reserved Books</h3>
          </div>
          {bookStats?.most_reserved && bookStats.most_reserved.length > 0 ? (
            <div className="space-y-3">
              {bookStats.most_reserved.map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{book.book_title}</p>
                    <p className="text-sm text-gray-600">{book.book_author}</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {book.reservation_count} reservations
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <UserCheck className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Most Active Members</h3>
          </div>
          {memberStats?.most_active && memberStats.most_active.length > 0 ? (
            <div className="space-y-3">
              {memberStats.most_active.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.member_name}</p>
                    <p className="text-sm text-gray-600">{member.member_email}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {member.borrow_count} books
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Books by Category</h3>
          </div>
          {categoryStats && categoryStats.length > 0 ? (
            <div className="space-y-3">
              {categoryStats.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm text-gray-600">{category.total_copies} total copies</p>
                  </div>
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                    {category.book_count} titles
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{memberStats?.total_members || 0}</p>
            <p className="text-sm text-gray-600">Total Members</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{memberStats?.active_members || 0}</p>
            <p className="text-sm text-gray-600">Active Members</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{memberStats?.pending_members || 0}</p>
            <p className="text-sm text-gray-600">Pending Approvals</p>
          </div>
        </div>
      </div>
    </div>
  );
}
