import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookCheck, CheckCircle, XCircle, Clock, Filter, Package } from 'lucide-react';

interface IssueRequest {
  id: number;
  member_id: number;
  book_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  request_date: string;
  reviewed_at: string | null;
  review_notes: string | null;
  reviewed_by: number | null;
  members: {
    full_name: string;
    email: string;
    membership_type: string;
  };
  books: {
    title: string;
    author: string;
    available_copies: number;
  };
  staff?: {
    name: string;
  };
}

export default function IssueRequestApproval() {
  const { staff } = useAuth();
  const [requests, setRequests] = useState<IssueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'fulfilled'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<IssueRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const canReview = staff?.role === 'superadmin' || staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('issue_requests')
        .select(`
          *,
          members (full_name, email, membership_type),
          books (title, author, available_copies),
          staff:reviewed_by (name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error) {
      console.error('Error fetching issue requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request: IssueRequest) => {
    setSelectedRequest(request);
    setReviewNotes(request.review_notes || '');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !staff) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('issue_requests')
        .update({
          status: 'approved',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setShowModal(false);
      setSelectedRequest(null);
      setReviewNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !staff) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('issue_requests')
        .update({
          status: 'rejected',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setShowModal(false);
      setSelectedRequest(null);
      setReviewNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleFulfill = async (requestId: number) => {
    if (!staff) return;

    const confirmFulfill = confirm('Mark this request as fulfilled? This will issue the book to the member and update the available copy count.');
    if (!confirmFulfill) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('issue_requests')
        .update({
          status: 'fulfilled',
        })
        .eq('id', requestId);

      if (error) {
        if (error.message.includes('No available copies')) {
          alert('Cannot fulfill request: No available copies of this book. Please check the inventory.');
        } else {
          throw error;
        }
        return;
      }

      alert('Request fulfilled successfully! Book has been issued and inventory updated.');
      fetchRequests();
    } catch (error: any) {
      console.error('Error fulfilling request:', error);
      alert('Failed to fulfill request: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
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

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading issue requests...</div>;
  }

  if (!canReview) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have permission to review issue requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Issue Requests from Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve member requests to issue books
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <BookCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {statusFilter === 'all' ? 'No issue requests found.' : `No ${statusFilter} requests found.`}
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{request.books.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">by {request.books.author}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {request.books.available_copies} copies
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Requested by:</p>
                <p className="text-sm text-gray-900">{request.members.full_name}</p>
                <p className="text-xs text-gray-600">{request.members.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Membership: {request.members.membership_type}
                </p>
              </div>

              {request.review_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Review Notes:</p>
                  <p className="text-sm text-blue-800">{request.review_notes}</p>
                  {request.staff && (
                    <p className="text-xs text-blue-700 mt-2">Reviewed by: {request.staff.name}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Requested: {new Date(request.request_date).toLocaleDateString()}
                  {request.reviewed_at && (
                    <> • Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}</>
                  )}
                </span>
                <div className="flex space-x-2">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleReview(request)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Review Request
                    </button>
                  )}
                  {request.status === 'approved' && (
                    <button
                      onClick={() => handleFulfill(request.id)}
                      disabled={processing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      Mark as Issued
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Review Issue Request</h3>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedRequest.books.title}</h4>
              <p className="text-sm text-gray-600">by {selectedRequest.books.author}</p>
              <p className="text-sm text-gray-500 mt-1">
                Available Copies: {selectedRequest.books.available_copies}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Member:</p>
              <p className="text-sm text-gray-900">{selectedRequest.members.full_name}</p>
              <p className="text-xs text-gray-600">{selectedRequest.members.email}</p>
              <p className="text-xs text-gray-500">Type: {selectedRequest.members.membership_type}</p>
            </div>

            {selectedRequest.books.available_copies === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Warning: This book has no available copies. Consider rejecting this request or waiting for a return.
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes about your decision..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setReviewNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Reject'}</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Approve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
