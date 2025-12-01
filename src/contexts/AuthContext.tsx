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
  membership_type: 'rmd_staff' | 'other_staff' | 'public';
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
      console.log('Fetching user data for userId:', userId);

      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, role, email')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Staff query result:', { staffData, staffError });

      if (staffError) {
        console.error('Staff query error:', staffError);
        throw staffError;
      }

      if (staffData) {
        console.log('Setting staff data:', staffData);
        setStaff(staffData);
        setMember(null);
        setLoading(false);
        return;
      }

      console.log('No staff data found, checking for member data');

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, email, membership_type, phone, status')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Member query result:', { memberData, memberError });

      if (memberError) {
        console.error('Member query error:', memberError);
        throw memberError;
      }

      if (memberData) {
        if (memberData.status !== 'active') {
          console.log('Member status not active:', memberData.status);
          await supabase.auth.signOut();
          throw new Error('Your account is pending approval. Please wait for a librarian to approve your account.');
        }

        console.log('Setting member data:', memberData);
        setMember({
          id: memberData.id,
          name: memberData.full_name,
          email: memberData.email,
          membership_type: memberData.membership_type,
          phone: memberData.phone,
          address: null,
        });
        setStaff(null);
      } else {
        console.log('No member data found either');
        setStaff(null);
        setMember(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setStaff(null);
      setMember(null);
      throw error;
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
