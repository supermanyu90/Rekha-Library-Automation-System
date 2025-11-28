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
  book: {
    title: string;
    author: string;
  };
}

export default function MemberReservations() {
  const { member } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled' | 'cancelled'>('all');

  useEffect(() => {
    if (member) {
      fetchReservations();
    }
  }, [member, filter]);

  const fetchReservations = async () => {
    if (!member) return;

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
          book:books(title, author)
        `)
        .eq('member_id', member.id)
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Reservations</h2>
        <div className="flex space-x-2">
          {(['all', 'pending', 'fulfilled', 'cancelled'] as const).map((f) => (
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
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' ? filter : ''} reservations found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {reservation.book.title}
                  </h3>
                  <p className="text-sm text-gray-600">{reservation.book.author}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(reservation.status)}`}>
                  {getStatusIcon(reservation.status)}
                  <span>{reservation.status}</span>
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Reserved on:</strong>{' '}
                  {new Date(reservation.reservation_date).toLocaleDateString()}
                </p>
                {reservation.fulfilled_at && (
                  <p>
                    <strong>Fulfilled on:</strong>{' '}
                    {new Date(reservation.fulfilled_at).toLocaleDateString()}
                  </p>
                )}
                {reservation.cancelled_at && (
                  <p>
                    <strong>Cancelled on:</strong>{' '}
                    {new Date(reservation.cancelled_at).toLocaleDateString()}
                  </p>
                )}
                {reservation.notes && (
                  <p className="mt-2 p-2 bg-gray-50 rounded">
                    <strong>Notes:</strong> {reservation.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
