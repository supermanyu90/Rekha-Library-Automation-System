import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';

interface MemberOnboardingProps {
  onBack: () => void;
}

export default function MemberOnboarding({ onBack }: MemberOnboardingProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    membership_type: 'student' as 'student' | 'faculty' | 'public',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToInsert = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        membership_type: formData.membership_type,
        reason: formData.reason || null,
        status: 'pending' as const,
      };

      console.log('Submitting form data:', dataToInsert);

      const { data, error: submitError } = await supabase
        .from('onboarding_forms')
        .insert([dataToInsert])
        .select();

      console.log('Supabase response:', { data, error: submitError });

      if (submitError) {
        console.error('Supabase error details:', submitError);
        throw submitError;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      if (err.code === '23505') {
        setError('This email has already been used. Please use a different email or contact support.');
      } else if (err.message) {
        setError(`Failed to submit form: ${err.message}`);
      } else {
        setError('Failed to submit form. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for applying to join our library. Your application is now under review.
            You'll receive your login credentials via email once your application is approved.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#0F1A33] text-white rounded-lg hover:bg-[#0F1A33]/90 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-[#0F1A33] rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Join Our Library</h1>
              <p className="text-gray-600">Fill out the form to request membership</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.membership_type}
                  onChange={(e) => setFormData({ ...formData, membership_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to join our library?
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A34E] focus:border-transparent"
                placeholder="Tell us about your interest in joining..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#C9A34E] text-white rounded-lg hover:bg-[#b8923d] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
