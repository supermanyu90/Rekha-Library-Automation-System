export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: number
          isbn: string
          title: string
          author: string
          publisher: string
          year: number
          genre: string
          total_copies: number
          available_copies: number
          created_at: string
        }
        Insert: {
          id?: number
          isbn: string
          title: string
          author: string
          publisher: string
          year: number
          genre: string
          total_copies: number
          available_copies: number
          created_at?: string
        }
        Update: {
          id?: number
          isbn?: string
          title?: string
          author?: string
          publisher?: string
          year?: number
          genre?: string
          total_copies?: number
          available_copies?: number
          created_at?: string
        }
      }
      members: {
        Row: {
          id: number
          full_name: string
          email: string
          phone: string | null
          membership_type: 'student' | 'faculty' | 'public'
          join_date: string
          status: string
          user_id: string | null
        }
        Insert: {
          id?: number
          full_name: string
          email: string
          phone?: string | null
          membership_type: 'student' | 'faculty' | 'public'
          join_date?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          id?: number
          full_name?: string
          email?: string
          phone?: string | null
          membership_type?: 'student' | 'faculty' | 'public'
          join_date?: string
          status?: string
          user_id?: string | null
        }
      }
      staff: {
        Row: {
          id: number
          name: string
          email: string
          role: StaffRole
          hire_date: string
          user_id: string | null
        }
        Insert: {
          id?: number
          name: string
          email: string
          role: StaffRole
          hire_date?: string
          user_id?: string | null
        }
        Update: {
          id?: number
          name?: string
          email?: string
          role?: StaffRole
          hire_date?: string
          user_id?: string | null
        }
      }
      transactions: {
        Row: {
          id: number
          member_id: number
          book_id: number
          borrow_date: string
          due_date: string
          return_date: string | null
          status: 'borrowed' | 'returned' | 'overdue'
          fine_amount: number
          created_at: string
        }
        Insert: {
          id?: number
          member_id: number
          book_id: number
          borrow_date?: string
          due_date: string
          return_date?: string | null
          status?: 'borrowed' | 'returned' | 'overdue'
          fine_amount?: number
          created_at?: string
        }
        Update: {
          id?: number
          member_id?: number
          book_id?: number
          borrow_date?: string
          due_date?: string
          return_date?: string | null
          status?: 'borrowed' | 'returned' | 'overdue'
          fine_amount?: number
          created_at?: string
        }
      }
      book_reservations: {
        Row: {
          id: number
          book_id: number
          member_id: number
          reservation_date: string
          expiry_date: string
          status: string
          notified: boolean
          created_at: string
        }
        Insert: {
          id?: number
          book_id: number
          member_id: number
          reservation_date?: string
          expiry_date: string
          status?: string
          notified?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          book_id?: number
          member_id?: number
          reservation_date?: string
          expiry_date?: string
          status?: string
          notified?: boolean
          created_at?: string
        }
      }
      book_reviews: {
        Row: {
          id: number
          book_id: number
          member_id: number
          rating: number
          review_text: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          book_id: number
          member_id: number
          rating: number
          review_text?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          book_id?: number
          member_id?: number
          rating?: number
          review_text?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_forms: {
        Row: {
          id: number
          full_name: string
          email: string
          phone: string | null
          address: string | null
          membership_type: 'student' | 'faculty' | 'public'
          status: string
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: number | null
        }
        Insert: {
          id?: number
          full_name: string
          email: string
          phone?: string | null
          address?: string | null
          membership_type: 'student' | 'faculty' | 'public'
          status?: string
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: number | null
        }
        Update: {
          id?: number
          full_name?: string
          email?: string
          phone?: string | null
          address?: string | null
          membership_type?: 'student' | 'faculty' | 'public'
          status?: string
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: number | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type StaffRole = 'superadmin' | 'librarian' | 'assistant'
