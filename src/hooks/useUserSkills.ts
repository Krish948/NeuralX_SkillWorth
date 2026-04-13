import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SkillRow {
  id: string;
  name: string;
  category: string;
}

export interface UserSkillRow {
  id: string;
  user_id: string;
  skill_id: string;
  level: number;
  created_at: string;
  skills: SkillRow;
}

export function useAllSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase.from('skills').select('*').order('name');
      if (error) throw error;
      return data as SkillRow[];
    },
  });
}

export function useUserSkills() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_skills', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_skills')
        .select('*, skills(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as UserSkillRow[];
    },
    enabled: !!user,
  });
}

export function useAddUserSkill() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ skillId, level }: { skillId: string; level: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('user_skills').upsert(
        { user_id: user.id, skill_id: skillId, level },
        { onConflict: 'user_id,skill_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_skills'] }),
  });
}

export function useRemoveUserSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_skills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_skills'] }),
  });
}
