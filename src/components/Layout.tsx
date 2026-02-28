import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, Users, BookMarked, ClipboardList, DollarSign, AlertCircle, BarChart3, User, UserPlus, Clock, Star, UserCheck, TrendingUp, BookPlus, BookCheck } from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { staff, signOut } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['superadmin', 'admin', 'librarian', 'assistant'] },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'approval', label: 'Member Approval', icon: UserCheck, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'onboarding', label: 'Applications', icon: UserPlus, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'members', label: 'Members', icon: Users, roles: ['superadmin', 'admin', 'librarian', 'assistant'] },
    { id: 'books', label: 'Books', icon: BookMarked, roles: ['superadmin', 'admin', 'librarian', 'assistant'] },
    { id: 'book-requests', label: 'Book Requests', icon: BookPlus, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'issue-requests', label: 'Issue Requests', icon: BookCheck, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'borrow', label: 'Borrow/Return', icon: ClipboardList, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'reservations', label: 'Reservations', icon: Clock, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'reviews', label: 'Reviews', icon: Star, roles: ['superadmin', 'admin', 'librarian'] },
    { id: 'fines', label: 'Fines', icon: DollarSign, roles: ['superadmin', 'admin', 'librarian', 'assistant'] },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle, roles: ['superadmin', 'admin', 'librarian', 'assistant'] },
    { id: 'staff', label: 'Staff', icon: User, roles: ['superadmin', 'admin'] },
  ];

  const availableTabs = tabs.filter(tab => staff && tab.roles.includes(staff.role));

  return (
    <>
      <ConnectionStatus />
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Library Management</h1>
                <p className="text-xs text-gray-500">{staff?.role.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{staff?.name}</p>
                <p className="text-xs text-gray-500">{staff?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex space-x-1 p-2 overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {children}
        </div>
      </div>
    </div>
    </>
  );
}
