import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Books from './components/Books';
import BorrowReturn from './components/BorrowReturn';
import Fines from './components/Fines';
import Overdue from './components/Overdue';
import Staff from './components/Staff';

function MainApp() {
  const { user, staff, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
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
