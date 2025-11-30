import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, BookOpen, Star, Clock, BookCheck } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  published_year: number | null;
  total_copies: number;
  available_copies: number;
}

interface BookReview {
  id: number;
  rating: number;
  review_text: string | null;
  member: {
    name: string;
  };
}

export default function MemberBookCatalog() {
  const { member } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [bookReviews, setBookReviews] = useState<BookReview[]>([]);
  const [reserving, setReserving] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      const uniqueCategories = Array.from(new Set(data.map(d => d.category).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBookReviews = async (bookId: number) => {
    try {
      const { data, error } = await supabase
        .from('book_reviews')
        .select(`
          id,
          rating,
          review_text,
          member:members(name)
        `)
        .eq('book_id', bookId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookReviews(data as any || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setBookReviews([]);
    }
  };

  const handleViewDetails = async (book: Book) => {
    setSelectedBook(book);
    setShowDetailsModal(true);
    await fetchBookReviews(book.id);
  };

  const handleReserve = async (bookId: number) => {
    if (!member) return;

    setReserving(true);
    try {
      const { error } = await supabase
        .from('book_reservations')
        .insert({
          member_id: member.id,
          book_id: bookId,
        });

      if (error) throw error;
      alert('Book reserved successfully! You will be notified when it becomes available.');
      setShowDetailsModal(false);
    } catch (error: any) {
      console.error('Error reserving book:', error);
      alert('Failed to reserve book: ' + (error.message || 'Unknown error'));
    } finally {
      setReserving(false);
    }
  };

  const handleIssueRequest = async (bookId: number) => {
    if (!member) return;

    setRequesting(true);
    try {
      const { error } = await supabase
        .from('issue_requests')
        .insert({
          member_id: member.id,
          book_id: bookId,
        });

      if (error) throw error;
      alert('Issue request submitted successfully! Staff will review and process your request.');
      setShowDetailsModal(false);
    } catch (error: any) {
      console.error('Error submitting issue request:', error);
      alert('Failed to submit issue request: ' + (error.message || 'Unknown error'));
    } finally {
      setRequesting(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading books...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Books</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No books found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => handleViewDetails(book)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">{book.author}</p>
                </div>
              </div>

              {book.category && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2">
                  {book.category}
                </span>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {book.available_copies > 0 ? `${book.available_copies} available` : 'Not available'}
                </span>
                <span className="text-gray-500">{book.total_copies} total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailsModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 space-y-2 text-sm">
              <p><strong>Author:</strong> {selectedBook.author}</p>
              {selectedBook.isbn && <p><strong>ISBN:</strong> {selectedBook.isbn}</p>}
              {selectedBook.category && <p><strong>Category:</strong> {selectedBook.category}</p>}
              {selectedBook.publisher && <p><strong>Publisher:</strong> {selectedBook.publisher}</p>}
              {selectedBook.published_year && <p><strong>Year:</strong> {selectedBook.published_year}</p>}
              <p><strong>Available Copies:</strong> <span className={selectedBook.available_copies > 0 ? 'text-green-600' : 'text-red-600'}>{selectedBook.available_copies}</span> / {selectedBook.total_copies}</p>
            </div>

            <div className="mb-4 space-y-3">
              {selectedBook.available_copies > 0 ? (
                <div>
                  <button
                    onClick={() => handleIssueRequest(selectedBook.id)}
                    disabled={requesting}
                    className="w-full flex items-center justify-center space-x-2 bg-[#C9A34E] text-white py-3 rounded-lg hover:bg-[#b8923d] transition disabled:opacity-50"
                  >
                    <BookCheck className="w-4 h-4" />
                    <span>{requesting ? 'Requesting...' : 'Request to Issue This Book'}</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Submit a request to have this book issued to you. Staff will review and approve.
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => handleReserve(selectedBook.id)}
                    disabled={reserving}
                    className="w-full flex items-center justify-center space-x-2 bg-[#C9A34E] text-white py-3 rounded-lg hover:bg-[#b8923d] transition disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{reserving ? 'Reserving...' : 'Reserve This Book'}</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Reserve this book and you'll be notified when it becomes available.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Reviews</span>
              </h4>

              {bookReviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {bookReviews.map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{review.member.name}</span>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-gray-700">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
