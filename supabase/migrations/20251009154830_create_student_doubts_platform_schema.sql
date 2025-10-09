/*
  # Student Doubts Platform Database Schema

  ## Overview
  Creates a complete database schema for a student doubts platform where students can post questions
  (anonymously or with their name), teachers can answer them, and an FAQ system automatically 
  learns from repeated questions.

  ## Tables Created

  1. **profiles**
     - Extends auth.users with role-based information
     - `id` (uuid, references auth.users)
     - `email` (text)
     - `full_name` (text)
     - `role` (text: 'student' or 'teacher')
     - `created_at` (timestamp)

  2. **doubts**
     - Stores student questions/doubts
     - `id` (uuid, primary key)
     - `student_id` (uuid, references profiles)
     - `title` (text)
     - `description` (text)
     - `is_anonymous` (boolean)
     - `status` (text: 'pending', 'answered')
     - `answer` (text, nullable)
     - `answered_by` (uuid, nullable, references profiles)
     - `answered_at` (timestamp, nullable)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

  3. **faqs**
     - Stores frequently asked questions
     - `id` (uuid, primary key)
     - `question` (text)
     - `answer` (text)
     - `ask_count` (integer, tracks how many times asked)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

  4. **doubt_similarity_log**
     - Tracks similar questions to identify FAQs
     - `id` (uuid, primary key)
     - `doubt_question` (text)
     - `matched_faq_id` (uuid, nullable, references faqs)
     - `created_at` (timestamp)

  ## Security
  - RLS enabled on all tables
  - Students can view all doubts, create their own, update their own pending doubts
  - Teachers can view all doubts, answer any doubt
  - FAQ table is readable by all authenticated users
  - Profiles are readable by authenticated users
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS doubts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  answer text,
  answered_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all doubts"
  ON doubts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can create doubts"
  ON doubts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'student'
    )
    AND student_id = auth.uid()
  );

CREATE POLICY "Students can update own pending doubts"
  ON doubts FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() 
    AND status = 'pending'
  )
  WITH CHECK (
    student_id = auth.uid()
  );

CREATE POLICY "Teachers can update doubts to answer them"
  ON doubts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
    )
  );

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  ask_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view FAQs"
  ON faqs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage FAQs"
  ON faqs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
    )
  );

CREATE TABLE IF NOT EXISTS doubt_similarity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_question text NOT NULL,
  matched_faq_id uuid REFERENCES faqs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doubt_similarity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage similarity logs"
  ON doubt_similarity_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_doubts_student_id ON doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_status ON doubts(status);
CREATE INDEX IF NOT EXISTS idx_doubts_created_at ON doubts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_ask_count ON faqs(ask_count DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_doubts_updated_at ON doubts;
CREATE TRIGGER update_doubts_updated_at
  BEFORE UPDATE ON doubts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();