import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher';
  created_at: string;
}

export interface Doubt {
  id: string;
  student_id: string;
  title: string;
  description: string;
  is_anonymous: boolean;
  status: 'pending' | 'answered';
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  teacher?: Profile;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  ask_count: number;
  created_at: string;
  updated_at: string;
}
