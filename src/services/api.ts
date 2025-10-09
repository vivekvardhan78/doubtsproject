import { supabase, Doubt, FAQ, Profile } from '../lib/supabase';

export const doubtsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('doubts')
      .select(`
        *,
        student:profiles!doubts_student_id_fkey(id, email, full_name, role),
        teacher:profiles!doubts_answered_by_fkey(id, email, full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Doubt[];
  },

  async getMyDoubts(userId: string) {
    const { data, error } = await supabase
      .from('doubts')
      .select(`
        *,
        student:profiles!doubts_student_id_fkey(id, email, full_name, role),
        teacher:profiles!doubts_answered_by_fkey(id, email, full_name, role)
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Doubt[];
  },

  async getPending() {
    const { data, error } = await supabase
      .from('doubts')
      .select(`
        *,
        student:profiles!doubts_student_id_fkey(id, email, full_name, role),
        teacher:profiles!doubts_answered_by_fkey(id, email, full_name, role)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Doubt[];
  },

  async create(doubt: {
    title: string;
    description: string;
    is_anonymous: boolean;
    student_id: string;
  }) {
    const { data, error } = await supabase
      .from('doubts')
      .insert(doubt)
      .select()
      .single();

    if (error) throw error;
    return data as Doubt;
  },

  async answer(doubtId: string, answer: string, teacherId: string) {
    const { data, error } = await supabase
      .from('doubts')
      .update({
        answer,
        answered_by: teacherId,
        answered_at: new Date().toISOString(),
        status: 'answered',
      })
      .eq('id', doubtId)
      .select()
      .single();

    if (error) throw error;
    return data as Doubt;
  },

  async update(doubtId: string, updates: Partial<Doubt>) {
    const { data, error } = await supabase
      .from('doubts')
      .update(updates)
      .eq('id', doubtId)
      .select()
      .single();

    if (error) throw error;
    return data as Doubt;
  },

  async delete(doubtId: string) {
    const { error } = await supabase
      .from('doubts')
      .delete()
      .eq('id', doubtId);

    if (error) throw error;
  },
};

export const faqApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('ask_count', { ascending: false });

    if (error) throw error;
    return data as FAQ[];
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .ilike('question', `%${query}%`)
      .order('ask_count', { ascending: false });

    if (error) throw error;
    return data as FAQ[];
  },

  async checkSimilar(question: string): Promise<{ matched: boolean; faq: FAQ | null }> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-faq`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) {
        return { matched: false, faq: null };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FAQ check error:', error);
      return { matched: false, faq: null };
    }
  },

  async create(faq: { question: string; answer: string }) {
    const { data, error } = await supabase
      .from('faqs')
      .insert(faq)
      .select()
      .single();

    if (error) throw error;
    return data as FAQ;
  },

  async update(id: string, updates: Partial<FAQ>) {
    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FAQ;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
