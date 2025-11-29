import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Search, Barcode, Upload } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  published_year: number | null;
  total_copies: number;
  available_copies: number;
}

export default function Books() {
  const { staff } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    published_year: '',
    total_copies: '1',
    available_copies: '1',
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = staff?.role === 'superadmin' || staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchBooks();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bookData = {
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn || '',
      genre: formData.category || '',
      publisher: formData.publisher || '',
      year: formData.published_year ? parseInt(formData.published_year) : new Date().getFullYear(),
      total_copies: parseInt(formData.total_copies),
      available_copies: parseInt(formData.available_copies),
    };

    try {
      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editingBook.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('books')
          .insert([bookData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingBook(null);
      setFormData({ title: '', author: '', isbn: '', category: '', publisher: '', published_year: '', total_copies: '1', available_copies: '1' });
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Error saving book');
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category || '',
      publisher: book.publisher || '',
      published_year: book.published_year?.toString() || '',
      total_copies: book.total_copies.toString(),
      available_copies: book.available_copies.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book');
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });

      rows.push(row);
    }

    return rows;
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        alert('CSV file is empty or invalid');
        setUploading(false);
        return;
      }

      const booksToInsert = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNum = i + 2;

        if (!row.title || !row.author) {
          errors.push(`Line ${lineNum}: Missing required fields (title, author)`);
          continue;
        }

        booksToInsert.push({
          title: row.title,
          author: row.author,
          isbn: row.isbn || null,
          category: row.category || null,
          publisher: row.publisher || null,
          published_year: row.published_year ? parseInt(row.published_year) : null,
          total_copies: row.total_copies ? parseInt(row.total_copies) : 1,
          available_copies: row.available_copies ? parseInt(row.available_copies) : (row.total_copies ? parseInt(row.total_copies) : 1),
        });
      }

      if (booksToInsert.length === 0) {
        alert('No valid books found in CSV');
        setUploadResults({ success: 0, failed: rows.length, errors });
        setUploading(false);
        return;
      }

      const { data, error } = await supabase
        .from('books')
        .insert(booksToInsert)
        .select();

      if (error) throw error;

      setUploadResults({
        success: data?.length || 0,
        failed: errors.length,
        errors,
      });

      fetchBooks();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Error uploading CSV file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleCSV = () => {
    const sample = `title,author,isbn,category,publisher,published_year,total_copies,available_copies
The Great Gatsby,F. Scott Fitzgerald,978-0-7432-7356-5,Fiction,Scribner,1925,3,3
To Kill a Mockingbird,Harper Lee,978-0-06-112008-4,Fiction,J.B. Lippincott & Co.,1960,2,2
1984,George Orwell,978-0-452-28423-4,Fiction,Secker & Warburg,1949,5,5`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading books...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Books Catalog</h2>
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>
            <button
              onClick={() => {
                setEditingBook(null);
                setFormData({ title: '', author: '', isbn: '', category: '', publisher: '', published_year: '', total_copies: '1', available_copies: '1' });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Author</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ISBN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Copies</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Available</th>
              {canEdit && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBooks.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{book.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{book.author}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {book.isbn ? (
                    <div className="flex items-center space-x-1">
                      <Barcode className="w-4 h-4 text-gray-400" />
                      <span>{book.isbn}</span>
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {book.category ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {book.category}
                    </span>
                  ) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{book.total_copies}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    book.available_copies === 0 ? 'bg-red-100 text-red-700' :
                    book.available_copies < book.total_copies * 0.3 ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {book.available_copies}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(book)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingBook ? 'Edit Book' : 'Add Book'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN / Barcode</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Published Year</label>
                  <input
                    type="number"
                    value={formData.published_year}
                    onChange={(e) => setFormData({ ...formData, published_year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Copies</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.total_copies}
                    onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Copies</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.available_copies}
                    onChange={(e) => setFormData({ ...formData, available_copies: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingBook ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Upload Books via CSV</h3>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li><strong>Required fields:</strong> title, author</li>
                <li><strong>Optional fields:</strong> isbn, category, publisher, published_year, total_copies, available_copies</li>
                <li>First row must contain column headers</li>
                <li>Use comma (,) as separator</li>
              </ul>
              <button
                onClick={downloadSampleCSV}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Download Sample CSV
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>

            {uploading && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Uploading books...</p>
              </div>
            )}

            {uploadResults && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Upload Results:</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-green-600">Successfully added: {uploadResults.success} books</p>
                  {uploadResults.failed > 0 && (
                    <p className="text-red-600">Failed: {uploadResults.failed} rows</p>
                  )}
                </div>
                {uploadResults.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Errors:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {uploadResults.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResults(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
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
