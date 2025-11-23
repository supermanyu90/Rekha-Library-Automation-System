import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://syfgcqwwguzhhpdxjddc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZmdjcXd3Z3V6aGhwZHhqZGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTkzMjgsImV4cCI6MjA3OTQzNTMyOH0.esneMRpkGbstnwlzcYGPN5e08iSKUIDKAodTzIhM_0k';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
