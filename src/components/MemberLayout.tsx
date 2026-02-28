import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, BookMarked, Clock, Star, BookPlus, BookCheck } from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';

interface MemberLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MemberLayout({ children, activeTab, onTabChange }: MemberLayoutProps) {
  const { member, signOut } = useAuth();

  const tabs = [
    { id: 'catalog', label: 'Browse Books', icon: BookMarked },
    { id: 'issue-requests', label: 'Issue Requests', icon: BookCheck },
    { id: 'reservations', label: 'My Reservations', icon: Clock },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'requests', label: 'Book Requests', icon: BookPlus },
  ];

  return (
    <>
      <ConnectionStatus />
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-[#C9A34E] p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Library Portal</h1>
                <p className="text-xs text-gray-500">MEMBER</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{member?.name}</p>
                <p className="text-xs text-gray-500">{member?.membership_type}</p>
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
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#C9A34E] text-white'
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
