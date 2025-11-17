import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { BookOpen, LogIn, UserPlus, LogOut, Users, BookMarked, Star, Upload, Home, Search, Settings, Trash2, Plus, UserCog, FileUp, CheckCircle, XCircle, Clock, Send, Key } from 'lucide-react';
import type { Database } from './lib/database.types';
import { hasPermission, formatDate, getRoleBadgeColor, getStatusBadgeColor } from './lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 120000;
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        signOut();
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'member',
      });
      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

function LoginForm({ onToggle }: { onToggle: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-teal-100 p-3 rounded-full">
            <LogIn className="w-12 h-12 text-teal-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-center text-gray-600 mb-8">Sign in to access your library</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="Enter your password" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 shadow-lg">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600">Don't have an account? <button onClick={onToggle} className="text-teal-600 hover:text-teal-700 font-semibold transition">Sign up</button></p>
        </div>
      </div>
    </div>
  );
}

function SignupForm({ onToggle }: { onToggle: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signUp(email, password, fullName);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-teal-100 p-3 rounded-full">
            <UserPlus className="w-12 h-12 text-teal-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Create Account</h2>
        <p className="text-center text-gray-600 mb-8">Join the future of libraries</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" placeholder="Re-enter your password" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 shadow-lg">{loading ? 'Creating account...' : 'Sign Up'}</button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600">Already have an account? <button onClick={onToggle} className="text-teal-600 hover:text-teal-700 font-semibold transition">Sign in</button></p>
        </div>
      </div>
    </div>
  );
}

function HeroSection({ onGetStarted, onLiveDemo }: { onGetStarted: () => void; onLiveDemo: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full py-20">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-500/30">
              <span className="text-cyan-400 text-sm font-semibold">Next-Gen Library System</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Reinventing Library Management Automation
              </span>
              <br />
              <span className="text-white">For RMD</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
              Browse Books, Request for Issue and Review
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Create an Account
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <button
                onClick={onLiveDemo}
                className="px-8 py-4 rounded-lg font-semibold text-cyan-400 border-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all hover:scale-105 backdrop-blur-sm"
              >
                Existing User?Sign-in
              </button>
            </div>

            <div className="flex items-center gap-8 pt-8 justify-center lg:justify-start">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">Industry Best</div>
                <div className="text-sm text-gray-400">Books Cataloged</div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400"></div>
                <div className="text-sm text-gray-400">Active M</div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-3xl opacity-20 blur-xl animate-pulse"></div>

                <div className="relative space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                      <BookOpen className="relative w-32 h-32 text-cyan-400 animate-float" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { icon: '📚', label: 'Smart Cataloging', color: 'from-cyan-500 to-blue-500' },
                      { icon: '👥', label: 'Member Management', color: 'from-blue-500 to-purple-500' },
                      { icon: '📊', label: 'Real-time Analytics', color: 'from-purple-500 to-pink-500' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all hover:scale-105 hover:border-cyan-400/50"
                        style={{ animationDelay: `${idx * 0.2}s` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-xl`}>
                            {item.icon}
                          </div>
                          <span className="text-white font-semibold">{item.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 backdrop-blur-sm animate-pulse"
                        style={{ animationDelay: `${i * 0.3}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
    </div>
  );
}

function AuthScreen() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  if (!showAuth) {
    return (
      <HeroSection
        onGetStarted={() => {
          setIsLogin(false);
          setShowAuth(true);
        }}
        onLiveDemo={() => {
          setIsLogin(true);
          setShowAuth(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <button
        onClick={() => setShowAuth(false)}
        className="absolute top-8 left-8 text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        Back to Home
      </button>

      {isLogin ? <LoginForm onToggle={() => setIsLogin(false)} /> : <SignupForm onToggle={() => setIsLogin(true)} />}
    </div>
  );
}

function MainApp() {
  const { user, profile, loading, signOut } = useAuth();
  const [view, setView] = useState('dashboard');
  const [books, setBooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookRequests, setBookRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportStatus, setCsvImportStatus] = useState<{ success: number; errors: string[] } | null>(null);
  const [newBook, setNewBook] = useState({
    title: '',
    authors: '',
    isbn: '',
    language: 'English',
    description: '',
    categories: '',
    total_copies: 1,
  });
  const [newMember, setNewMember] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [memberCreationStatus, setMemberCreationStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [passwordReset, setPasswordReset] = useState<{ userId: string; newPassword: string } | null>(null);
  const [passwordResetStatus, setPasswordResetStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [returnNotes, setReturnNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchBookRequests();
      if (hasPermission(profile?.role, 'superadmin')) {
        fetchUsers();
      }
    }
  }, [user, profile]);

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*').eq('is_active', true).order('added_at', { ascending: false });
    setBooks(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const fetchBookRequests = async () => {
    const { data } = await supabase
      .from('book_requests')
      .select(`
        *,
        book:books(*),
        user:profiles!book_requests_user_id_fkey(id, full_name, email),
        approver:profiles!book_requests_approved_by_fkey(id, full_name),
        issuer:profiles!book_requests_issued_by_fkey(id, full_name)
      `)
      .order('created_at', { ascending: false });

    setBookRequests(data || []);
  };

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.authors) {
      alert('Please fill in title and authors');
      return;
    }

    const { error } = await supabase.from('books').insert({
      title: newBook.title,
      authors: newBook.authors.split(',').map(a => a.trim()),
      isbn: newBook.isbn || null,
      language: newBook.language,
      description: newBook.description || null,
      categories: newBook.categories ? newBook.categories.split(',').map(c => c.trim()) : [],
      total_copies: newBook.total_copies,
      available_copies: newBook.total_copies,
      added_by: user?.id,
      is_active: true,
    });

    if (error) {
      alert('Failed to add book: ' + error.message);
      return;
    }

    setShowAddBook(false);
    setNewBook({
      title: '',
      authors: '',
      isbn: '',
      language: 'English',
      description: '',
      categories: '',
      total_copies: 1,
    });
    fetchBooks();
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    const { error } = await supabase.from('books').update({ is_active: false }).eq('id', bookId);

    if (error) {
      alert('Failed to delete book: ' + error.message);
      return;
    }

    fetchBooks();
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);

    if (error) {
      alert('Failed to update role: ' + error.message);
      return;
    }

    fetchUsers();
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setCsvImportStatus(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('CSV file is empty or invalid');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['title', 'authors'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        alert(`CSV must have these columns: ${requiredHeaders.join(', ')}\nMissing: ${missingHeaders.join(', ')}`);
        return;
      }

      const errors: string[] = [];
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        if (!row.title || !row.authors) {
          errors.push(`Row ${i}: Missing required fields (title or authors)`);
          continue;
        }

        const bookData = {
          title: row.title,
          subtitle: row.subtitle || null,
          authors: row.authors.split(';').map((a: string) => a.trim()).filter((a: string) => a),
          isbn: row.isbn || null,
          language: row.language || 'English',
          description: row.description || null,
          categories: row.categories ? row.categories.split(';').map((c: string) => c.trim()).filter((c: string) => c) : [],
          total_copies: parseInt(row.total_copies) || 1,
          available_copies: parseInt(row.total_copies) || 1,
          added_by: user?.id,
          is_active: true,
        };

        const { error } = await supabase.from('books').insert(bookData);

        if (error) {
          errors.push(`Row ${i} (${row.title}): ${error.message}`);
        } else {
          successCount++;
        }
      }

      setCsvImportStatus({ success: successCount, errors });
      fetchBooks();
      setCsvFile(null);
    };

    reader.readAsText(csvFile);
  };

  const handleRequestBook = async (bookId: string) => {
    const { error } = await supabase.from('book_requests').insert({
      book_id: bookId,
      user_id: user?.id,
      status: 'pending',
    });

    if (error) {
      alert('Failed to request book: ' + error.message);
      return;
    }

    alert('Book request submitted successfully!');
    fetchBookRequests();
  };

  const handleApproveRequest = async (requestId: string) => {
    const { error } = await supabase.from('book_requests').update({
      status: 'approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    }).eq('id', requestId);

    if (error) {
      alert('Failed to approve request: ' + error.message);
      return;
    }

    fetchBookRequests();
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase.from('book_requests').update({
      status: 'rejected',
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    }).eq('id', requestId);

    if (error) {
      alert('Failed to reject request: ' + error.message);
      return;
    }

    fetchBookRequests();
  };

  const handleIssueBook = async (requestId: string, bookId: string) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const { error: requestError } = await supabase.from('book_requests').update({
      status: 'issued',
      issued_by: user?.id,
      issued_at: new Date().toISOString(),
      due_date: dueDate.toISOString(),
    }).eq('id', requestId);

    if (requestError) {
      alert('Failed to issue book: ' + requestError.message);
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (book && book.available_copies > 0) {
      await supabase.from('books').update({
        available_copies: book.available_copies - 1,
      }).eq('id', bookId);
    }

    fetchBookRequests();
    fetchBooks();
  };

  const handleCreateMember = async () => {
    if (!newMember.email || !newMember.password || !newMember.full_name) {
      setMemberCreationStatus({ success: false, message: 'Please fill in all fields' });
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-member`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMember.email,
          password: newMember.password,
          full_name: newMember.full_name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMemberCreationStatus({
          success: true,
          message: result.message
        });
        setNewMember({ email: '', password: '', full_name: '' });
        setTimeout(() => setMemberCreationStatus(null), 3000);
      } else {
        setMemberCreationStatus({ success: false, message: result.message || 'Failed to create member' });
      }
    } catch (error: any) {
      setMemberCreationStatus({ success: false, message: error.message || 'Failed to create member' });
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordResetStatus({ success: false, message: 'Password must be at least 6 characters' });
      setTimeout(() => setPasswordResetStatus(null), 3000);
      return;
    }

    const { data, error } = await supabase.rpc('reset_user_password', {
      user_id: userId,
      new_password: newPassword
    });

    if (error) {
      setPasswordResetStatus({ success: false, message: error.message });
    } else {
      const result = data as { success: boolean; message: string };
      setPasswordResetStatus(result);
      if (result.success) {
        setPasswordReset(null);
      }
    }

    setTimeout(() => setPasswordResetStatus(null), 3000);
  };

  const handleReturnBook = async (requestId: string, bookId: string, notes: string) => {
    const { error: requestError } = await supabase
      .from('book_requests')
      .update({
        status: 'returned',
        returned_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', requestId);

    if (requestError) {
      alert('Failed to mark book as returned: ' + requestError.message);
      return;
    }

    const { error: bookError } = await supabase.rpc('increment', {
      row_id: bookId,
    });

    if (bookError) {
      const { data: book } = await supabase
        .from('books')
        .select('available_copies')
        .eq('id', bookId)
        .single();

      if (book) {
        await supabase
          .from('books')
          .update({ available_copies: book.available_copies + 1 })
          .eq('id', bookId);
      }
    }

    fetchBookRequests();
    fetchBooks();
    setReturnNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[requestId];
      return newNotes;
    });
  };

  const handleUpdateBook = async () => {
    if (!editingBook) return;

    const { error } = await supabase
      .from('books')
      .update({
        title: editingBook.title,
        authors: editingBook.authors.split(',').map((a: string) => a.trim()),
        isbn: editingBook.isbn || null,
        language: editingBook.language,
        description: editingBook.description || null,
        categories: editingBook.categories ? editingBook.categories.split(',').map((c: string) => c.trim()) : [],
        total_copies: editingBook.total_copies,
      })
      .eq('id', editingBook.id);

    if (error) {
      alert('Failed to update book: ' + error.message);
      return;
    }

    fetchBooks();
    setEditingBook(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Rekha Library...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthScreen />;
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.authors.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-teal-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rekha</h1>
                <p className="text-xs text-gray-600">Library Automation System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(profile.role)}`}>{profile.role.replace('_', ' ')}</span>
              </div>
              <button onClick={() => signOut()} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Sign Out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'books', label: 'Browse Books', icon: BookOpen },
              { id: 'requests', label: 'My Requests', icon: Clock },
              hasPermission(profile.role, 'head_librarian') && { id: 'pending-requests', label: 'Pending Requests', icon: CheckCircle },
              hasPermission(profile.role, 'head_librarian') && { id: 'issue-books', label: 'Issue Books', icon: Send },
              hasPermission(profile.role, 'librarian') && { id: 'issued-books', label: 'Issued Books', icon: BookMarked },
              hasPermission(profile.role, 'head_librarian') && { id: 'create-member', label: 'Create Member', icon: UserPlus },
              hasPermission(profile.role, 'librarian') && { id: 'manage', label: 'Manage Books', icon: Upload },
              hasPermission(profile.role, 'superadmin') && { id: 'users', label: 'Manage Users', icon: UserCog },
            ].filter(Boolean).map((item: any) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${view === item.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {view === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Welcome back, {profile.full_name}!</h2>
                  <p className="text-gray-600 mt-2">Here's your library overview</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-teal-100 text-sm font-medium">Total Books</p>
                        <p className="text-3xl font-bold mt-2">{books.length}</p>
                      </div>
                      <BookOpen className="w-12 h-12 text-teal-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {view === 'books' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Browse Books</h2>
                  <p className="text-gray-600 mt-2">Explore our collection</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title or author..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                </div>
                {filteredBooks.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600">No books found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooks.map(book => (
                      <div key={book.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer">
                        <div className="relative h-48 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-teal-600" />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{book.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1 mb-3">{book.authors.join(', ')}</p>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-semibold ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>{book.available_copies > 0 ? 'Available' : 'Not Available'}</span>
                            <span className="text-sm text-gray-600">{book.available_copies}/{book.total_copies} copies</span>
                          </div>
                          <button onClick={() => handleRequestBook(book.id)} disabled={book.available_copies === 0} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition">Request Book</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {view === 'requests' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">My Requests</h2>
                  <p className="text-gray-600 mt-2">Track your book requests and issued books</p>
                </div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {bookRequests.filter(req => req.user_id === user?.id).length === 0 ? (
                    <div className="p-12 text-center">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-600">No requests yet</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookRequests.filter(req => req.user_id === user?.id).map(request => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{request.book.title}</div>
                              <div className="text-sm text-gray-500">{request.book.authors.join(', ')}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{formatDate(request.request_date)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>{request.status}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{request.due_date ? formatDate(request.due_date) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {view === 'pending-requests' && hasPermission(profile.role, 'head_librarian') && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Pending Requests</h2>
                  <p className="text-gray-600 mt-2">Approve or reject book requests from users</p>
                </div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {bookRequests.filter(req => req.status === 'pending').length === 0 ? (
                    <div className="p-12 text-center">
                      <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-600">No pending requests</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookRequests.filter(req => req.status === 'pending').map(request => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{request.user.full_name}</div>
                              <div className="text-sm text-gray-500">{request.user.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{request.book.title}</div>
                              <div className="text-sm text-gray-500">{request.book.authors.join(', ')}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{formatDate(request.request_date)}</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button onClick={() => handleApproveRequest(request.id)} className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Approve</span>
                                </button>
                                <button onClick={() => handleRejectRequest(request.id)} className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition">
                                  <XCircle className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {view === 'issue-books' && hasPermission(profile.role, 'librarian') && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Issue Books</h2>
                  <p className="text-gray-600 mt-2">Issue approved books to users</p>
                </div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {bookRequests.filter(req => req.status === 'approved').length === 0 ? (
                    <div className="p-12 text-center">
                      <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-600">No approved requests to issue</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookRequests.filter(req => req.status === 'approved').map(request => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{request.user.full_name}</div>
                              <div className="text-sm text-gray-500">{request.user.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{request.book.title}</div>
                              <div className="text-sm text-gray-500">Available: {request.book.available_copies}/{request.book.total_copies}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{formatDate(request.approved_at)}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleIssueBook(request.id, request.book_id)} disabled={request.book.available_copies === 0} className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-3 py-2 rounded-lg transition">
                                <Send className="w-4 h-4" />
                                <span>Issue Book</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {view === 'issued-books' && hasPermission(profile.role, 'librarian') && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Issued Books</h2>
                  <p className="text-gray-600 mt-2">Manage book returns and update book information</p>
                </div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {bookRequests.filter(req => req.status === 'issued').length === 0 ? (
                    <div className="p-12 text-center">
                      <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-600">No books currently issued</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookRequests.filter(req => req.status === 'issued').map(request => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{request.user.full_name}</div>
                              <div className="text-sm text-gray-500">{request.user.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{request.book.title}</div>
                              <div className="text-sm text-gray-500">{request.book.authors.join(', ')}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{formatDate(request.issued_at)}</td>
                            <td className="px-6 py-4">
                              <span className={`text-sm ${new Date(request.due_date) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                                {formatDate(request.due_date)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setEditingBook({
                                      id: request.book.id,
                                      title: request.book.title,
                                      authors: request.book.authors.join(', '),
                                      isbn: request.book.isbn || '',
                                      language: request.book.language || 'English',
                                      description: request.book.description || '',
                                      categories: request.book.categories?.join(', ') || '',
                                      total_copies: request.book.total_copies,
                                    });
                                  }}
                                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                                >
                                  <Settings className="w-4 h-4" />
                                  Update Book
                                </button>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Return notes (optional)"
                                    value={returnNotes[request.id] || ''}
                                    onChange={(e) => setReturnNotes({ ...returnNotes, [request.id]: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  />
                                  <button
                                    onClick={() => handleReturnBook(request.id, request.book_id, returnNotes[request.id] || '')}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition whitespace-nowrap"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Returned
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {view === 'manage' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Manage Books</h2>
                    <p className="text-gray-600 mt-2">Add or remove books from the library</p>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setShowCsvImport(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
                      <FileUp className="w-5 h-5" />
                      <span>Import CSV</span>
                    </button>
                    <button onClick={() => setShowAddBook(true)} className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition">
                      <Plus className="w-5 h-5" />
                      <span>Add Book</span>
                    </button>
                  </div>
                </div>

                {showAddBook && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Book</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <input type="text" value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Book title" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Authors * (comma-separated)</label>
                        <input type="text" value={newBook.authors} onChange={(e) => setNewBook({ ...newBook, authors: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Author 1, Author 2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
                        <input type="text" value={newBook.isbn} onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="978-0000000000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <input type="text" value={newBook.language} onChange={(e) => setNewBook({ ...newBook, language: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categories (comma-separated)</label>
                        <input type="text" value={newBook.categories} onChange={(e) => setNewBook({ ...newBook, categories: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Fiction, Classic" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Copies</label>
                        <input type="number" min="1" value={newBook.total_copies} onChange={(e) => setNewBook({ ...newBook, total_copies: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea value={newBook.description} onChange={(e) => setNewBook({ ...newBook, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Book description"></textarea>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <button onClick={handleAddBook} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition">Add Book</button>
                      <button onClick={() => setShowAddBook(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg transition">Cancel</button>
                    </div>
                  </div>
                )}

                {showCsvImport && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Import Books from CSV</h3>
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li><strong>Required columns:</strong> title, authors</li>
                          <li><strong>Optional columns:</strong> subtitle, isbn, language, description, categories, total_copies</li>
                          <li><strong>Multiple authors:</strong> Separate with semicolon (;) e.g., "Author One;Author Two"</li>
                          <li><strong>Multiple categories:</strong> Separate with semicolon (;) e.g., "Fiction;Classic"</li>
                          <li><strong>Example:</strong> title,authors,isbn,language,categories,total_copies</li>
                        </ul>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                        <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        {csvFile && <p className="text-sm text-gray-600 mt-2">Selected: {csvFile.name}</p>}
                      </div>

                      {csvImportStatus && (
                        <div className={`rounded-lg p-4 ${csvImportStatus.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                          <p className="font-semibold text-green-900 mb-2">Import Complete: {csvImportStatus.success} books added successfully</p>
                          {csvImportStatus.errors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-yellow-900 mb-1">Errors ({csvImportStatus.errors.length}):</p>
                              <ul className="text-sm text-yellow-800 space-y-1 max-h-40 overflow-y-auto">
                                {csvImportStatus.errors.map((error, idx) => (
                                  <li key={idx}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button onClick={handleCsvImport} disabled={!csvFile} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">Import Books</button>
                        <button onClick={() => { setShowCsvImport(false); setCsvFile(null); setCsvImportStatus(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg transition">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authors</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copies</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {books.map(book => (
                        <tr key={book.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{book.title}</div>
                            <div className="text-sm text-gray-500">{book.isbn || 'No ISBN'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book.authors.join(', ')}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book.available_copies}/{book.total_copies}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => handleDeleteBook(book.id)} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition" title="Delete Book">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {view === 'users' && hasPermission(profile.role, 'superadmin') && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Manage Users</h2>
                  <p className="text-gray-600 mt-2">Update user roles and permissions</p>
                </div>

                {passwordResetStatus && (
                  <div className={`p-4 rounded-lg ${passwordResetStatus.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {passwordResetStatus.message}
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{u.full_name}</div>
                            <div className="text-xs text-gray-500">{u.id === profile.id ? '(You)' : ''}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(u.role)}`}>{u.role.replace('_', ' ')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <select value={u.role} onChange={(e) => handleUpdateUserRole(u.id, e.target.value)} disabled={u.id === profile.id} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                              <option value="member">Member</option>
                              <option value="librarian">Librarian</option>
                              <option value="head_librarian">Head Librarian</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Superadmin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            {passwordReset?.userId === u.id ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="password"
                                  placeholder="New password"
                                  value={passwordReset.newPassword}
                                  onChange={(e) => setPasswordReset({ ...passwordReset, newPassword: e.target.value })}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => handleResetPassword(u.id, passwordReset.newPassword)}
                                  className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setPasswordReset(null)}
                                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPasswordReset({ userId: u.id, newPassword: '' })}
                                disabled={u.id === profile.id}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Key className="w-4 h-4" />
                                Reset Password
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'create-member' && hasPermission(profile.role, 'head_librarian') && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Create New Member</h2>
                  <p className="text-gray-600 mt-2">Add a new member to the library system</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl">
                  {memberCreationStatus && (
                    <div className={`mb-6 p-4 rounded-lg ${memberCreationStatus.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                      {memberCreationStatus.message}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={newMember.full_name}
                        onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Enter member's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Enter member's email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={newMember.password}
                        onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Create a password for the member"
                      />
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleCreateMember}
                        className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
                      >
                        Create Member
                      </button>
                      <button
                        onClick={() => {
                          setNewMember({ email: '', password: '', full_name: '' });
                          setMemberCreationStatus(null);
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Update Book Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingBook.title}
                    onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Authors * (comma-separated)</label>
                  <input
                    type="text"
                    value={editingBook.authors}
                    onChange={(e) => setEditingBook({ ...editingBook, authors: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
                  <input
                    type="text"
                    value={editingBook.isbn}
                    onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <input
                    type="text"
                    value={editingBook.language}
                    onChange={(e) => setEditingBook({ ...editingBook, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editingBook.description}
                    onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories (comma-separated)</label>
                  <input
                    type="text"
                    value={editingBook.categories}
                    onChange={(e) => setEditingBook({ ...editingBook, categories: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={editingBook.total_copies}
                    onChange={(e) => setEditingBook({ ...editingBook, total_copies: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateBook}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingBook(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
