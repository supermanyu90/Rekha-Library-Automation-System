import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookPlus, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';

interface BookRequest {
  id: number;
  requester_name: string;
  requester_email: string;
  book_title: string;
  author: string | null;
  isbn: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  reviewed_by: number | null;
  staff?: {
    name: string;
  };
}

export default function BookRequestApproval() {
  const { staff } = useAuth();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<BookRequest | null>(null);
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
        .from('book_requests')
        .select(`
          *,
          staff:reviewed_by(name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching book requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request: BookRequest) => {
    setSelectedRequest(request);
    setReviewNotes(request.review_notes || '');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !staff) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('book_requests')
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
        .from('book_requests')
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
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
    return <div className="text-center py-12 text-gray-500">Loading book requests...</div>;
  }

  if (!canReview) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have permission to review book requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Requests from Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve/reject book purchase requests from library members
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
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <BookPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {statusFilter === 'all' ? 'No book requests found.' : `No ${statusFilter} requests found.`}
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{request.book_title}</h3>
                  {request.author && (
                    <p className="text-sm text-gray-600 mt-1">by {request.author}</p>
                  )}
                  {request.isbn && (
                    <p className="text-xs text-gray-500 mt-1">ISBN: {request.isbn}</p>
                  )}
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Requested by:</p>
                <p className="text-sm text-gray-900">{request.requester_name}</p>
                <p className="text-xs text-gray-600">{request.requester_email}</p>
              </div>

              {request.reason && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                </div>
              )}

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
                  Submitted: {new Date(request.created_at).toLocaleDateString()}
                  {request.reviewed_at && (
                    <> • Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}</>
                  )}
                </span>
                {request.status === 'pending' && (
                  <button
                    onClick={() => handleReview(request)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Review Request
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Review Book Request</h3>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedRequest.book_title}</h4>
              {selectedRequest.author && (
                <p className="text-sm text-gray-600">by {selectedRequest.author}</p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Requested by:</p>
              <p className="text-sm text-gray-900">{selectedRequest.requester_name} ({selectedRequest.requester_email})</p>
            </div>

            {selectedRequest.reason && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                <p className="text-sm text-gray-600">{selectedRequest.reason}</p>
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
