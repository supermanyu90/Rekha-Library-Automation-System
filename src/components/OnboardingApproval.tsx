import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface OnboardingForm {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  membership_type: 'student' | 'faculty' | 'public';
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  member_id: number | null;
  created_at: string;
}

export default function OnboardingApproval() {
  const { staff } = useAuth();
  const [forms, setForms] = useState<OnboardingForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedForm, setSelectedForm] = useState<OnboardingForm | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const canApprove = staff?.role === 'superadmin' || staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchForms();
  }, [filter]);

  const fetchForms = async () => {
    try {
      let query = supabase
        .from('onboarding_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (form: OnboardingForm) => {
    setSelectedForm(form);
    setReviewNotes('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedForm || !canApprove) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-member`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            form_id: selectedForm.id,
            review_notes: reviewNotes,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve application');
      }

      const result = await response.json();

      alert(`Application approved successfully!\n\nMember credentials:\nEmail: ${result.email}\nTemporary Password: ${result.temporary_password}\n\nPlease share these credentials with the member securely.`);
      setShowModal(false);
      fetchForms();
    } catch (error) {
      console.error('Error approving application:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedForm || !staff || !canApprove) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('onboarding_forms')
        .update({
          status: 'rejected',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq('id', selectedForm.id);

      if (error) throw error;

      alert('Application rejected');
      setShowModal(false);
      fetchForms();
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
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
    return <div className="text-center py-12 text-gray-500">Loading applications...</div>;
  }

  if (!canApprove) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have permission to review onboarding applications.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Membership Applications</h2>
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

      {forms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' ? filter : ''} applications found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{form.full_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(form.status)}`}>
                      {getStatusIcon(form.status)}
                      <span>{form.status}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Email:</strong> {form.email}</p>
                    {form.phone && <p><strong>Phone:</strong> {form.phone}</p>}
                    <p><strong>Membership Type:</strong> {form.membership_type}</p>
                    {form.address && <p><strong>Address:</strong> {form.address}</p>}
                    {form.reason && (
                      <p className="mt-2"><strong>Reason:</strong> {form.reason}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Applied: {new Date(form.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {form.status === 'pending' && (
                  <button
                    onClick={() => handleReview(form)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Review
                  </button>
                )}
              </div>
              {form.review_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Review Notes:</strong> {form.review_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Review Application</h3>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedForm.full_name}</p>
              <p><strong>Email:</strong> {selectedForm.email}</p>
              {selectedForm.phone && <p><strong>Phone:</strong> {selectedForm.phone}</p>}
              <p><strong>Membership Type:</strong> {selectedForm.membership_type}</p>
              {selectedForm.address && <p><strong>Address:</strong> {selectedForm.address}</p>}
              {selectedForm.reason && <p><strong>Reason:</strong> {selectedForm.reason}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this application..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
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
