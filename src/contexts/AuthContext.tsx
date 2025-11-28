import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { StaffRole } from '../lib/database.types';

interface StaffMember {
  id: number;
  name: string;
  role: StaffRole;
  email: string;
}

interface Member {
  id: number;
  name: string;
  email: string;
  membership_type: 'student' | 'faculty' | 'public';
  phone: string | null;
  address: string | null;
}

interface AuthContextType {
  user: User | null;
  staff: StaffMember | null;
  member: Member | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setStaff(null);
          setMember(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, role, email')
        .eq('user_id', userId)
        .maybeSingle();

      if (staffError) throw staffError;

      if (staffData) {
        setStaff(staffData);
        setMember(null);
      } else {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, name, email, membership_type, phone, address')
          .eq('user_id', userId)
          .maybeSingle();

        if (memberError) throw memberError;
        setMember(memberData);
        setStaff(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setStaff(null);
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setStaff(null);
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ user, staff, member, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
