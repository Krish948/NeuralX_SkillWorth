import { useState } from 'react';
import { useAllSkills, useUserSkills, useAddUserSkill, useRemoveUserSkill } from '@/hooks/useUserSkills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Failed to update skill';
}

export default function Skills() {
  const { data: allSkills = [] } = useAllSkills();
  const { data: userSkills = [] } = useUserSkills();
  const addSkill = useAddUserSkill();
  const removeSkill = useRemoveUserSkill();
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [level, setLevel] = useState(3);

  const userSkillIds = userSkills.map(us => us.skill_id);
  const availableSkills = allSkills.filter(s => !userSkillIds.includes(s.id));

  const handleAdd = () => {
    if (!selectedSkillId) return;
    addSkill.mutate({ skillId: selectedSkillId, level }, {
      onSuccess: () => {
        toast.success('Skill added!');
        setSelectedSkillId('');
        setLevel(3);
      },
      onError: (err: unknown) => toast.error(getErrorMessage(err)),
    });
  };

  const handleRemove = (id: string) => {
    removeSkill.mutate(id, { onSuccess: () => toast.success('Skill removed') });
  };

  const levelLabels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
  const categories = [...new Set(allSkills.map(s => s.category))];

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Your Skills</h1>
          <p className="text-muted-foreground mt-1">Add and manage your skill portfolio</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,390px)_minmax(0,1fr)]">
        <Card className="border-border/50 xl:sticky xl:top-24 self-start">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Add a Skill
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <div key={cat}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">{cat}</div>
                      {availableSkills.filter(s => s.category === cat).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Proficiency</span>
                <span className="font-medium text-primary">{levelLabels[level]}</span>
              </div>
              <Slider value={[level]} onValueChange={([v]) => setLevel(v)} min={1} max={5} step={1} />
            </div>
            <Button onClick={handleAdd} disabled={!selectedSkillId || addSkill.isPending} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold">Current Skills</h2>
            <span className="text-sm text-muted-foreground">{userSkills.length} added</span>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {userSkills.map(us => (
              <Card key={us.id} className="border-border/50 group">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{us.skills?.name}</p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{us.skills?.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">Lv.{us.level} – {levelLabels[us.level]}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemove(us.id)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {userSkills.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/70 bg-card/50">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No skills added yet. Start building your portfolio above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
