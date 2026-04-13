import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JobRow {
  id: string;
  role: string;
  required_skills: string[];
  salary_min: number;
  salary_max: number;
  category: string;
}

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*').order('role');
      if (error) throw error;
      return data as JobRow[];
    },
  });
}
