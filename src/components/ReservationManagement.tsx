import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface Reservation {
  id: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  reservation_date: string;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  member: {
    name: string;
    email: string;
    phone: string | null;
  };
  book: {
    id: number;
    title: string;
    author: string;
    available_copies: number;
  };
}

export default function ReservationManagement() {
  const { staff } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled' | 'cancelled'>('pending');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const canManage = staff?.role === 'superadmin' || staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    try {
      let query = supabase
        .from('book_reservations')
        .select(`
          id,
          status,
          reservation_date,
          fulfilled_at,
          cancelled_at,
          notes,
          member:members(name, email, phone),
          book:books(id, title, author, available_copies)
        `)
        .order('reservation_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReservations(data as any || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setNotes(reservation.notes || '');
    setShowModal(true);
  };

  const handleFulfill = async () => {
    if (!selectedReservation || !staff || !canManage) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('book_reservations')
        .update({
          status: 'fulfilled',
          fulfilled_by: staff.id,
          fulfilled_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      alert('Reservation fulfilled successfully!');
      setShowModal(false);
      fetchReservations();
    } catch (error) {
      console.error('Error fulfilling reservation:', error);
      alert('Failed to fulfill reservation');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReservation || !staff || !canManage) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('book_reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      alert('Reservation cancelled');
      setShowModal(false);
      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Failed to cancel reservation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      fulfilled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading reservations...</div>;
  }

  if (!canManage) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have permission to manage reservations.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Book Reservations</h2>
        <div className="flex space-x-2">
          {(['all', 'pending', 'fulfilled', 'cancelled'] as const).map((f) => (
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

      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' ? filter : ''} reservations found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {reservation.book.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      <span>{reservation.status}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Book Author:</strong> {reservation.book.author}</p>
                    <p><strong>Member:</strong> {reservation.member.name} ({reservation.member.email})</p>
                    {reservation.member.phone && (
                      <p><strong>Phone:</strong> {reservation.member.phone}</p>
                    )}
                    <p><strong>Reserved:</strong> {new Date(reservation.reservation_date).toLocaleDateString()}</p>
                    {reservation.fulfilled_at && (
                      <p><strong>Fulfilled:</strong> {new Date(reservation.fulfilled_at).toLocaleDateString()}</p>
                    )}
                    {reservation.cancelled_at && (
                      <p><strong>Cancelled:</strong> {new Date(reservation.cancelled_at).toLocaleDateString()}</p>
                    )}
                    <p className={`${reservation.book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <strong>Available Copies:</strong> {reservation.book.available_copies}
                    </p>
                  </div>
                </div>
                {reservation.status === 'pending' && (
                  <button
                    onClick={() => handleReview(reservation)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Manage
                  </button>
                )}
              </div>
              {reservation.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {reservation.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Manage Reservation</h3>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <p><strong>Book:</strong> {selectedReservation.book.title}</p>
              <p><strong>Author:</strong> {selectedReservation.book.author}</p>
              <p><strong>Member:</strong> {selectedReservation.member.name}</p>
              <p><strong>Email:</strong> {selectedReservation.member.email}</p>
              {selectedReservation.member.phone && (
                <p><strong>Phone:</strong> {selectedReservation.member.phone}</p>
              )}
              <p><strong>Reserved:</strong> {new Date(selectedReservation.reservation_date).toLocaleDateString()}</p>
              <p className={selectedReservation.book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}>
                <strong>Available Copies:</strong> {selectedReservation.book.available_copies}
              </p>
            </div>

            {selectedReservation.book.available_copies === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Warning: No copies are currently available. The book must be returned before fulfilling this reservation.
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this reservation..."
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
                onClick={handleCancel}
                disabled={processing}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Cancel'}</span>
              </button>
              <button
                onClick={handleFulfill}
                disabled={processing}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{processing ? 'Processing...' : 'Fulfill'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
