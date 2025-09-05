import { supabase } from '../../../lib/supabase';
import { Profile, Score } from '../../../shared/types/database';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateProfile(userId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, username })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function saveScore(userId: string, score: number, totalQuestions: number): Promise<void> {
  const { error } = await supabase
    .from('scores')
    .insert({ user_id: userId, score, total_questions: totalQuestions });

  if (error) {
    console.error('Error saving score:', error);
    throw error;
  }
}

export async function getTopScores(limit: number = 10): Promise<Score[]> {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      profiles:user_id (
        username
      )
    `)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching scores:', error);
    return [];
  }

  return data;
}
