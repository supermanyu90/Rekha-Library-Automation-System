import { BookOpen, BarChart3, Settings, ArrowRight, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface HeroProps {
  onGetStarted: () => void;
  onJoinLibrary: () => void;
  onMemberSignup: () => void;
}

export default function Hero({ onGetStarted, onJoinLibrary, onMemberSignup }: HeroProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const benefits = [
    {
      icon: BookOpen,
      title: 'Easy Book Tracking',
      description: 'Manage your entire catalog with intuitive search and filters'
    },
    {
      icon: Settings,
      title: 'Automated Borrow & Return',
      description: 'Streamline workflows with smart automation and triggers'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Gain insights with comprehensive dashboards and reports'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-[#0F1A33] via-[#1a2847] to-[#0F1A33]'
        : 'bg-gradient-to-br from-white via-gray-50 to-blue-50'
    }`}>
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-6 right-6 z-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-[#0F1A33]/10 text-[#0F1A33] hover:bg-[#0F1A33]/20'
        }`}
      >
        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-[#C9A34E]' : 'bg-[#0F1A33]'
            }`}>
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-[#0F1A33]'
            }`}>
              Rekha
            </span>
          </div>
        </nav>

        <main className="pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-6">
                <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-[#0F1A33]'
                }`}>
                  Rekha — The Smarter Way to{' '}
                  <span className={`${
                    isDarkMode ? 'text-[#C9A34E]' : 'text-[#C9A34E]'
                  }`}>
                    Manage Your Library
                  </span>
                </h1>

                <p className={`text-xl sm:text-2xl leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  A fast, intuitive, and powerful system to organize books, track borrowing,
                  automate fines, and keep your library running effortlessly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  className="group px-8 py-4 bg-[#C9A34E] text-white rounded-xl font-semibold text-lg
                    hover:bg-[#b8923d] transform hover:scale-105 transition-all duration-300
                    shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>Staff Login</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onMemberSignup}
                  className={`group px-8 py-4 rounded-xl font-semibold text-lg
                    border-2 transform hover:scale-105 transition-all duration-300
                    flex items-center justify-center space-x-2 ${
                      isDarkMode
                        ? 'border-white/30 text-white hover:bg-white/10'
                        : 'border-[#0F1A33]/30 text-[#0F1A33] hover:bg-[#0F1A33]/5'
                    }`}
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Member Sign Up</span>
                </button>
              </div>

              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Already a member?{' '}
                <button
                  onClick={onJoinLibrary}
                  className="text-[#C9A34E] hover:underline font-medium"
                >
                  Log in here
                </button>
              </p>

              <p className={`text-sm flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className="text-[#C9A34E] text-lg">✓</span>
                <span>Exclusively for Risk Management.</span>
              </p>
            </div>

            <div className="relative animate-slideUp">
              <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${
                isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
              }`}>
                <div className="p-8">
                  <div className="space-y-6">
                    <div className={`h-12 rounded-lg ${
                      isDarkMode ? 'bg-white/10' : 'bg-gray-100'
                    }`}></div>

                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className={`h-32 rounded-lg ${
                            isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                          } flex items-center justify-center`}
                        >
                          <BookOpen className={`w-8 h-8 ${
                            isDarkMode ? 'text-[#C9A34E]/40' : 'text-[#0F1A33]/20'
                          }`} />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-16 rounded-lg ${
                            isDarkMode ? 'bg-white/10' : 'bg-gray-100'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`absolute inset-0 bg-gradient-to-tr pointer-events-none ${
                  isDarkMode
                    ? 'from-[#C9A34E]/10 via-transparent to-transparent'
                    : 'from-[#C9A34E]/5 via-transparent to-transparent'
                }`}></div>
              </div>

              <div className={`absolute -z-10 top-8 -right-8 w-72 h-72 rounded-full blur-3xl ${
                isDarkMode ? 'bg-[#C9A34E]/10' : 'bg-[#C9A34E]/20'
              }`}></div>
              <div className={`absolute -z-10 -bottom-8 -left-8 w-72 h-72 rounded-full blur-3xl ${
                isDarkMode ? 'bg-blue-500/10' : 'bg-blue-500/20'
              }`}></div>
            </div>
          </div>
        </main>

        <section className="pb-24">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className={`group p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                      : 'bg-white hover:shadow-xl border border-gray-100'
                  }`}
                  style={{
                    animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6
                    transition-transform duration-300 group-hover:scale-110 ${
                      isDarkMode ? 'bg-[#C9A34E]/20' : 'bg-[#C9A34E]/10'
                    }`}>
                    <Icon className="w-7 h-7 text-[#C9A34E]" />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-[#0F1A33]'
                  }`}>
                    {benefit.title}
                  </h3>
                  <p className={`leading-relaxed ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}
