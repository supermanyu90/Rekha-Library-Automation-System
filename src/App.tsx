import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import OnboardingApproval from './components/OnboardingApproval';

type ViewMode = 'hero' | 'login' | 'onboarding' | 'app';

function MainApp() {
  const { user, staff, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('hero');

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

  if (!user || !staff) {
    if (viewMode === 'hero') {
      return <Hero onGetStarted={() => setViewMode('login')} onJoinLibrary={() => setViewMode('onboarding')} />;
    }
    if (viewMode === 'onboarding') {
      return <MemberOnboarding onBack={() => setViewMode('hero')} />;
    }
    return <Login onBack={() => setViewMode('hero')} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'onboarding' && <OnboardingApproval />}
      {activeTab === 'members' && <Members />}
      {activeTab === 'books' && <Books />}
      {activeTab === 'borrow' && <BorrowReturn />}
      {activeTab === 'fines' && <Fines />}
      {activeTab === 'overdue' && <Overdue />}
      {activeTab === 'staff' && <Staff />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
