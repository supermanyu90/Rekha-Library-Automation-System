import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookCheck, CheckCircle, XCircle, Clock, Package } from 'lucide-react';

interface IssueRequest {
  id: number;
  book_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  request_date: string;
  reviewed_at: string | null;
  review_notes: string | null;
  books: {
    title: string;
    author: string;
  };
}

export default function MemberIssueRequests() {
  const { member } = useAuth();
  const [requests, setRequests] = useState<IssueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      if (!member) return;

      const { data, error } = await supabase
        .from('issue_requests')
        .select(`
          id,
          book_id,
          status,
          request_date,
          reviewed_at,
          review_notes,
          books (title, author)
        `)
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error) {
      console.error('Error fetching issue requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </span>
        );
      case 'fulfilled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <Package className="w-4 h-4 mr-1" />
            Issued
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your request is being reviewed by the staff.';
      case 'approved':
        return 'Your request has been approved. Please visit the library to collect the book.';
      case 'fulfilled':
        return 'This book has been issued to you.';
      case 'rejected':
        return 'Your request was not approved.';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading your issue requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Issue Requests</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your book issue requests and their status
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <BookCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">You haven't submitted any issue requests yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              Browse books and request to issue available books.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{request.books.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">by {request.books.author}</p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">{getStatusMessage(request.status)}</p>
              </div>

              {request.review_notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Staff Notes:</p>
                  <p className="text-sm text-gray-600">{request.review_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
                {request.reviewed_at && (
                  <span>Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
