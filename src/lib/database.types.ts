export type UserRole = 'member' | 'librarian' | 'head_librarian' | 'admin' | 'superadmin';
export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          avatar_url: string | null;
          accessibility_preferences: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          avatar_url?: string | null;
          accessibility_preferences?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          avatar_url?: string | null;
          accessibility_preferences?: Record<string, any>;
          created_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          authors: string[];
          isbn: string | null;
          language: string;
          description: string | null;
          categories: string[];
          cover_image: string | null;
          pdf_file: string | null;
          audiobook_file: string | null;
          total_copies: number;
          available_copies: number;
          added_by: string | null;
          added_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          authors?: string[];
          isbn?: string | null;
          language?: string;
          description?: string | null;
          categories?: string[];
          cover_image?: string | null;
          pdf_file?: string | null;
          audiobook_file?: string | null;
          total_copies?: number;
          available_copies?: number;
          added_by?: string | null;
          added_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          authors?: string[];
          isbn?: string | null;
          language?: string;
          description?: string | null;
          categories?: string[];
          cover_image?: string | null;
          pdf_file?: string | null;
          audiobook_file?: string | null;
          total_copies?: number;
          available_copies?: number;
          added_by?: string | null;
          added_at?: string;
          is_active?: boolean;
        };
      };
      reservations: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          status: ReservationStatus;
          start_date: string | null;
          due_date: string | null;
          processed_by: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id: string;
          status?: ReservationStatus;
          start_date?: string | null;
          due_date?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          user_id?: string;
          status?: ReservationStatus;
          start_date?: string | null;
          due_date?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          rating: number;
          title: string;
          body: string | null;
          moderated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id: string;
          rating: number;
          title: string;
          body?: string | null;
          moderated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          user_id?: string;
          rating?: number;
          title?: string;
          body?: string | null;
          moderated?: boolean;
          created_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          user_id: string;
          requested_title: string;
          reason: string | null;
          status: RequestStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          requested_title: string;
          reason?: string | null;
          status?: RequestStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          requested_title?: string;
          reason?: string | null;
          status?: RequestStatus;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          actor_id: string;
          action_type: string;
          details: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action_type: string;
          details?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          action_type?: string;
          details?: Record<string, any>;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          default_loan_days: number;
          max_reservations_per_user: number;
          allowed_file_types: string[];
          csv_upload_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          default_loan_days?: number;
          max_reservations_per_user?: number;
          allowed_file_types?: string[];
          csv_upload_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          default_loan_days?: number;
          max_reservations_per_user?: number;
          allowed_file_types?: string[];
          csv_upload_enabled?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}
