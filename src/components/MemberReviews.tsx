import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Star, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  review_text: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  book: {
    title: string;
    author: string;
  };
}

interface Book {
  id: number;
  title: string;
  author: string;
}

export default function MemberReviews() {
  const { member } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      fetchReviews();
      fetchBooks();
    }
  }, [member, filter]);

  const fetchReviews = async () => {
    if (!member) return;

    try {
      let query = supabase
        .from('book_reviews')
        .select(`
          id,
          rating,
          review_text,
          status,
          created_at,
          book:books(title, author)
        `)
        .eq('member_id', member.id)
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

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author')
        .order('title', { ascending: true });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!member || !selectedBookId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('book_reviews')
        .insert({
          member_id: member.id,
          book_id: selectedBookId,
          rating,
          review_text: reviewText || null,
        });

      if (error) throw error;

      alert('Review submitted successfully! It will be visible after approval.');
      setShowAddModal(false);
      setSelectedBookId(null);
      setRating(5);
      setReviewText('');
      fetchReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Reviews</h2>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  filter === f
                    ? 'bg-[#C9A34E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-[#C9A34E] text-white px-4 py-2 rounded-lg hover:bg-[#b8923d] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' ? filter : ''} reviews found</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-[#C9A34E] hover:underline"
          >
            Write your first review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {review.book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{review.book.author}</p>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(review.status)}`}>
                  {getStatusIcon(review.status)}
                  <span>{review.status}</span>
                </span>
              </div>

              {review.review_text && (
                <p className="text-sm text-gray-700 mb-2 p-3 bg-gray-50 rounded">
                  {review.review_text}
                </p>
              )}

              <p className="text-xs text-gray-500">
                Submitted: {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Book
              </label>
              <select
                value={selectedBookId || ''}
                onChange={(e) => setSelectedBookId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
              >
                <option value="">Choose a book...</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                placeholder="Share your thoughts about this book..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Your review will be visible after staff approval
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedBookId(null);
                  setRating(5);
                  setReviewText('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!selectedBookId || submitting}
                className="flex-1 bg-[#C9A34E] text-white py-2 rounded-lg hover:bg-[#b8923d] transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
