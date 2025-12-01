import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface PendingMember {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  membership_type: 'rmd_staff' | 'other_staff' | 'public';
  status: 'pending' | 'active' | 'suspended';
  join_date: string;
  user_id: string | null;
}

export default function MemberApproval() {
  const { staff } = useAuth();
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'active' | 'suspended'>('pending');
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const canApprove = staff?.role === 'superadmin' || staff?.role === 'admin' || staff?.role === 'librarian';

  useEffect(() => {
    fetchMembers();
  }, [filter]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', filter)
        .order('join_date', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (member: PendingMember) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedMember || !canApprove) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', selectedMember.id);

      if (error) throw error;

      alert('Member approved successfully! They can now log in and access library services.');
      setShowModal(false);
      fetchMembers();
    } catch (error) {
      console.error('Error approving member:', error);
      alert('Failed to approve member');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedMember || !canApprove) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ status: 'suspended' })
        .eq('id', selectedMember.id);

      if (error) throw error;

      alert('Member suspended');
      setShowModal(false);
      fetchMembers();
    } catch (error) {
      console.error('Error suspending member:', error);
      alert('Failed to suspend member');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'suspended':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading members...</div>;
  }

  if (!canApprove) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have permission to manage member accounts.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Member Account Approval</h2>
        <div className="flex space-x-2">
          {(['pending', 'active', 'suspended'] as const).map((f) => (
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

      {members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter} members found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{member.full_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusBadge(member.status)}`}>
                      {getStatusIcon(member.status)}
                      <span>{member.status}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Email:</strong> {member.email}</p>
                    {member.phone && <p><strong>Phone:</strong> {member.phone}</p>}
                    <p><strong>Membership Type:</strong> {member.membership_type}</p>
                    <p><strong>Has Auth Account:</strong> {member.user_id ? 'Yes' : 'No'}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Joined: {new Date(member.join_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {member.status === 'pending' && (
                  <button
                    onClick={() => handleReview(member)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Review
                  </button>
                )}
                {member.status === 'active' && (
                  <button
                    onClick={() => handleReview(member)}
                    className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Review Member Account</h3>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedMember.full_name}</p>
              <p><strong>Email:</strong> {selectedMember.email}</p>
              {selectedMember.phone && <p><strong>Phone:</strong> {selectedMember.phone}</p>}
              <p><strong>Membership Type:</strong> {selectedMember.membership_type}</p>
              <p><strong>Current Status:</strong> {selectedMember.status}</p>
              <p><strong>Has Auth Account:</strong> {selectedMember.user_id ? 'Yes' : 'No'}</p>
            </div>

            {selectedMember.status === 'pending' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Approving this member will allow them to log in and access library services including
                  browsing books, making reservations, and writing reviews.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              {selectedMember.status === 'pending' && (
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{processing ? 'Processing...' : 'Approve'}</span>
                </button>
              )}
              {selectedMember.status === 'active' && (
                <button
                  onClick={handleSuspend}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{processing ? 'Processing...' : 'Suspend'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
