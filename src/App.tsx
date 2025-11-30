import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Hero from './components/Hero';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Books from './components/Books';
import BorrowReturn from './components/BorrowReturn';
import Fines from './components/Fines';
import Overdue from './components/Overdue';
import Staff from './components/Staff';
import MemberOnboarding from './components/MemberOnboarding';
import MemberSignup from './components/MemberSignup';
import OnboardingApproval from './components/OnboardingApproval';
import MemberApproval from './components/MemberApproval';
import MemberLayout from './components/MemberLayout';
import MemberBookCatalog from './components/MemberBookCatalog';
import MemberReservations from './components/MemberReservations';
import MemberReviews from './components/MemberReviews';
import MemberBookRequests from './components/MemberBookRequests';
import MemberIssueRequests from './components/MemberIssueRequests';
import ReservationManagement from './components/ReservationManagement';
import ReviewApproval from './components/ReviewApproval';
import Analytics from './components/Analytics';
import BookRequestApproval from './components/BookRequestApproval';
import IssueRequestApproval from './components/IssueRequestApproval';

type ViewMode = 'hero' | 'login' | 'onboarding' | 'signup' | 'app';

function MainApp() {
  const { user, staff, member, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [memberTab, setMemberTab] = useState('catalog');
  const [viewMode, setViewMode] = useState<ViewMode>('hero');

  // Update view mode based on authentication state
  useEffect(() => {
    if (!loading) {
      if (user && (staff || member)) {
        setViewMode('app');
      } else if (!user && viewMode === 'app') {
        setViewMode('hero');
      }
    }
  }, [user, staff, member, loading, viewMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Library Management System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (viewMode === 'hero') {
      return (
        <Hero
          onGetStarted={() => setViewMode('login')}
          onJoinLibrary={() => setViewMode('login')}
          onMemberSignup={() => setViewMode('signup')}
        />
      );
    }
    if (viewMode === 'onboarding') {
      return <MemberOnboarding onBack={() => setViewMode('hero')} />;
    }
    if (viewMode === 'signup') {
      return <MemberSignup onBack={() => setViewMode('hero')} />;
    }
    return <Login onBack={() => setViewMode('hero')} />;
  }

  if (member) {
    return (
      <MemberLayout activeTab={memberTab} onTabChange={setMemberTab}>
        {memberTab === 'catalog' && <MemberBookCatalog />}
        {memberTab === 'issue-requests' && <MemberIssueRequests />}
        {memberTab === 'reservations' && <MemberReservations />}
        {memberTab === 'reviews' && <MemberReviews />}
        {memberTab === 'requests' && <MemberBookRequests />}
      </MemberLayout>
    );
  }

  if (staff) {
    return (
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'onboarding' && <OnboardingApproval />}
        {activeTab === 'approval' && <MemberApproval />}
        {activeTab === 'members' && <Members />}
        {activeTab === 'books' && <Books />}
        {activeTab === 'book-requests' && <BookRequestApproval />}
        {activeTab === 'issue-requests' && <IssueRequestApproval />}
        {activeTab === 'borrow' && <BorrowReturn />}
        {activeTab === 'reservations' && <ReservationManagement />}
        {activeTab === 'reviews' && <ReviewApproval />}
        {activeTab === 'fines' && <Fines />}
        {activeTab === 'overdue' && <Overdue />}
        {activeTab === 'staff' && <Staff />}
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
        <p className="text-gray-600 mb-6">
          Your membership application is currently being reviewed by our staff.
          You will receive access once your account has been approved.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setViewMode('hero');
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
