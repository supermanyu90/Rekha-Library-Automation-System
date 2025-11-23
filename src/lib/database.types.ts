export type MembershipType = 'student' | 'faculty' | 'external';
export type MemberStatus = 'active' | 'inactive' | 'blacklisted';
export type StaffRole = 'admin' | 'librarian' | 'assistant';
export type BorrowStatus = 'issued' | 'returned' | 'overdue';
export type PaymentStatus = 'paid' | 'unpaid';

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: number;
          full_name: string;
          email: string;
          phone: string | null;
          membership_type: MembershipType;
          join_date: string;
          status: MemberStatus;
        };
        Insert: {
          id?: number;
          full_name: string;
          email: string;
          phone?: string | null;
          membership_type?: MembershipType;
          join_date?: string;
          status?: MemberStatus;
        };
        Update: {
          id?: number;
          full_name?: string;
          email?: string;
          phone?: string | null;
          membership_type?: MembershipType;
          join_date?: string;
          status?: MemberStatus;
        };
      };
      staff: {
        Row: {
          id: number;
          name: string;
          role: StaffRole;
          email: string;
          user_id: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          role?: StaffRole;
          email: string;
          user_id?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          role?: StaffRole;
          email?: string;
          user_id?: string | null;
        };
      };
      books: {
        Row: {
          id: number;
          title: string;
          author: string;
          isbn: string | null;
          category: string | null;
          publisher: string | null;
          published_year: number | null;
          total_copies: number;
          available_copies: number;
        };
        Insert: {
          id?: number;
          title: string;
          author: string;
          isbn?: string | null;
          category?: string | null;
          publisher?: string | null;
          published_year?: number | null;
          total_copies?: number;
          available_copies?: number;
        };
        Update: {
          id?: number;
          title?: string;
          author?: string;
          isbn?: string | null;
          category?: string | null;
          publisher?: string | null;
          published_year?: number | null;
          total_copies?: number;
          available_copies?: number;
        };
      };
      borrow_records: {
        Row: {
          id: number;
          member_id: number;
          book_id: number;
          issued_by: number;
          issue_date: string;
          due_date: string;
          return_date: string | null;
          status: BorrowStatus;
        };
        Insert: {
          id?: number;
          member_id: number;
          book_id: number;
          issued_by: number;
          issue_date?: string;
          due_date: string;
          return_date?: string | null;
          status?: BorrowStatus;
        };
        Update: {
          id?: number;
          member_id?: number;
          book_id?: number;
          issued_by?: number;
          issue_date?: string;
          due_date?: string;
          return_date?: string | null;
          status?: BorrowStatus;
        };
      };
      fines: {
        Row: {
          id: number;
          borrow_id: number;
          fine_amount: number;
          paid_status: PaymentStatus;
          assessed_date: string;
        };
        Insert: {
          id?: number;
          borrow_id: number;
          fine_amount: number;
          paid_status?: PaymentStatus;
          assessed_date?: string;
        };
        Update: {
          id?: number;
          borrow_id?: number;
          fine_amount?: number;
          paid_status?: PaymentStatus;
          assessed_date?: string;
        };
      };
    };
  };
}
