import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookPlus, Send, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BookRequest {
  id: number;
  book_title: string;
  author: string | null;
  isbn: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

export default function MemberBookRequests() {
  const { member } = useAuth();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    book_title: '',
    author: '',
    isbn: '',
    reason: '',
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      if (!member) return;

      const { data, error } = await supabase
        .from('book_requests')
        .select('*')
        .eq('requester_email', member.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching book requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!member) return;

      const { error } = await supabase
        .from('book_requests')
        .insert([{
          requester_name: member.name,
          requester_email: member.email,
          book_title: formData.book_title,
          author: formData.author || null,
          isbn: formData.isbn || null,
          reason: formData.reason || null,
          status: 'pending',
        }]);

      if (error) throw error;

      setFormData({ book_title: '', author: '', isbn: '', reason: '' });
      setShowForm(false);
      fetchRequests();
    } catch (error) {
      console.error('Error submitting book request:', error);
      alert('Failed to submit book request. Please try again.');
    } finally {
      setSubmitting(false);
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
    return <div className="text-center py-12 text-gray-500">Loading your book requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Requests</h2>
          <p className="text-sm text-gray-600 mt-1">
            Request books that are not currently available in our library
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#C9A34E] text-white rounded-lg hover:bg-[#b8923d] transition"
          >
            <BookPlus className="w-5 h-5" />
            <span>Request New Book</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Book Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.book_title}
                onChange={(e) => setFormData({ ...formData, book_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                placeholder="Enter book title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                  placeholder="Enter author name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                  placeholder="Enter ISBN (optional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Request
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                placeholder="Why do you need this book? (optional)"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ book_title: '', author: '', isbn: '', reason: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-4 py-2 bg-[#C9A34E] text-white rounded-lg hover:bg-[#b8923d] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <BookPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">You haven't submitted any book requests yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              Click the button above to request a new book.
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

              {request.reason && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                </div>
              )}

              {request.review_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Staff Notes:</p>
                  <p className="text-sm text-blue-800">{request.review_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
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
