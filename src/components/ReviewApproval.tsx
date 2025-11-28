import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Star, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  review_text: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  member: {
    name: string;
    email: string;
  };
  book: {
    title: string;
    author: string;
  };
}

export default function ReviewApproval() {
  const { staff } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const canApprove = staff?.role === 'superadmin' || staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('book_reviews')
        .select(`
          id,
          rating,
          review_text,
          status,
          created_at,
          reviewed_by,
          reviewed_at,
          review_notes,
          member:members(name, email),
          book:books(title, author)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReviews(data as any || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (review: Review) => {
    setSelectedReview(review);
    setReviewNotes('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedReview || !staff || !canApprove) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('book_reviews')
        .update({
          status: 'approved',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      alert('Review approved successfully!');
      setShowModal(false);
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReview || !staff || !canApprove) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('book_reviews')
        .update({
          status: 'rejected',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      alert('Review rejected');
      setShowModal(false);
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading reviews...</div>;
  }

  if (!canApprove) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have permission to review book reviews.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Book Reviews</h2>
        <div className="flex space-x-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' ? filter : ''} reviews found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {review.book.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(review.status)}`}>
                      {getStatusIcon(review.status)}
                      <span>{review.status}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Author:</strong> {review.book.author}</p>
                    <p><strong>Reviewer:</strong> {review.member.name} ({review.member.email})</p>
                    <div className="flex items-center space-x-1">
                      <strong>Rating:</strong>
                      <div className="flex items-center ml-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.review_text && (
                      <div className="mt-2 p-3 bg-gray-50 rounded">
                        <p className="text-gray-700">{review.review_text}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.status === 'pending' && (
                  <button
                    onClick={() => handleReview(review)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Review
                  </button>
                )}
              </div>
              {review.review_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Staff Notes:</strong> {review.review_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Review Submission</h3>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Book</p>
                <p className="text-gray-900">{selectedReview.book.title}</p>
                <p className="text-sm text-gray-600">{selectedReview.book.author}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Reviewer</p>
                <p className="text-gray-900">{selectedReview.member.name}</p>
                <p className="text-sm text-gray-600">{selectedReview.member.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Rating</p>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < selectedReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({selectedReview.rating}/5)</span>
                </div>
              </div>
              {selectedReview.review_text && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Review Text</p>
                  <p className="text-gray-700 p-3 bg-white rounded border border-gray-200">
                    {selectedReview.review_text}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this review..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Reject'}</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
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
