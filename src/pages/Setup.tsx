import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { AdminNavigation } from "@/components/AdminNavigation";

interface TeamData {
  id: string;
  name: string;
}

interface ProblemData {
  id: string;
  question: string;
  answer: string;
}

const Setup = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsRes, problemsRes] = await Promise.all([
        supabase.from("teams").select("*").order("team_number"),
        supabase.from("problems").select("*").order("problem_number")
      ]);

      if (teamsRes.data) {
        setTeams(teamsRes.data.map(t => ({ id: t.id, name: t.team_name })));
      }
      if (problemsRes.data) {
        setProblems(problemsRes.data.map(p => ({ 
          id: p.id, 
          question: p.question, 
          answer: p.correct_answer.toString() 
        })));
      }
    } catch (error: any) {
      toast({ title: "Error loading data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const adjustTeamsCount = (count: number) => {
    const newCount = Math.max(0, Math.min(100, count));
    const current = teams.length;
    
    if (newCount > current) {
      setTeams([...teams, ...Array(newCount - current).fill(null).map(() => ({ id: "", name: "" }))]);
    } else {
      setTeams(teams.slice(0, newCount));
    }
  };

  const adjustProblemsCount = (count: number) => {
    const newCount = Math.max(0, Math.min(100, count));
    const current = problems.length;
    
    if (newCount > current) {
      setProblems([...problems, ...Array(newCount - current).fill(null).map(() => ({ id: "", question: "", answer: "" }))]);
    } else {
      setProblems(problems.slice(0, newCount));
    }
  };

  const updateTeamName = (index: number, name: string) => {
    const updated = [...teams];
    updated[index].name = name;
    setTeams(updated);
  };

  const updateProblem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...problems];
    updated[index][field] = value;
    setProblems(updated);
  };

  const saveTeams = async () => {
    if (teams.some(t => !t.name.trim())) {
      toast({ title: "Please fill all team names", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase.from("teams").delete().gte("team_number", 0);
      if (deleteError) throw deleteError;
      
      const teamRecords = teams.map((team, index) => ({
        team_number: index + 1,
        team_name: team.name.trim(),
      }));

      const { error } = await supabase.from("teams").insert(teamRecords);
      if (error) throw error;

      toast({ title: "Teams saved successfully!" });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error saving teams", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const saveProblems = async () => {
    if (problems.some(p => !p.answer.trim())) {
      toast({ title: "Please fill all answers", variant: "destructive" });
      return;
    }

    if (problems.some(p => isNaN(parseFloat(p.answer)))) {
      toast({ title: "All answers must be valid numbers", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase.from("problems").delete().gte("problem_number", 0);
      if (deleteError) throw deleteError;
      
      const problemRecords = problems.map((problem, index) => ({
        problem_number: index + 1,
        question: `Problem ${index + 1}`,
        correct_answer: parseFloat(problem.answer),
      }));

      const { error } = await supabase.from("problems").insert(problemRecords);
      if (error) throw error;

      toast({ title: "Problems saved successfully!" });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error saving problems", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetScoreboard = async () => {
    if (!confirm("Are you sure you want to reset the scoreboard? This will delete all submissions and cannot be undone.")) {
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;

      toast({ title: "Scoreboard reset successfully!" });
    } catch (error: any) {
      toast({ title: "Error resetting scoreboard", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Navigation />
        
        <h1 className="text-4xl font-bold">Competition Setup</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Teams Section */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Save className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Teams</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="num-teams">Number of Teams</Label>
                  <Input
                    id="num-teams"
                    type="number"
                    min="0"
                    max="100"
                    value={teams.length}
                    onChange={(e) => adjustTeamsCount(parseInt(e.target.value) || 0)}
                  />
                </div>

                {teams.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {teams.map((team, index) => (
                      <div key={index} className="flex items-center">
                        <Input
                          value={team.name}
                          onChange={(e) => updateTeamName(index, e.target.value)}
                          placeholder="Team name"
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={saveTeams} 
                  className="w-full"
                  disabled={submitting || teams.length === 0}
                >
                  {submitting ? "Saving..." : "Save Teams"}
                </Button>
              </div>
            </Card>

            {/* Problems Section */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Save className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Problems</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="num-problems">Number of Problems</Label>
                  <Input
                    id="num-problems"
                    type="number"
                    min="0"
                    max="100"
                    value={problems.length}
                    onChange={(e) => adjustProblemsCount(parseInt(e.target.value) || 0)}
                  />
                </div>

                {problems.length > 0 && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {problems.map((problem, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-20">
                          Problem {index + 1}
                        </span>
                        <Input
                          type="number"
                          step="any"
                          value={problem.answer}
                          onChange={(e) => updateProblem(index, 'answer', e.target.value)}
                          placeholder="Answer"
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={saveProblems} 
                  className="w-full"
                  disabled={submitting || problems.length === 0}
                >
                  {submitting ? "Saving..." : "Save Problems"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Save className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-bold">Danger Zone</h2>
            </div>
            <p className="text-muted-foreground">
              Reset the scoreboard to clear all submissions. This action cannot be undone.
            </p>
            <Button 
              onClick={resetScoreboard} 
              variant="destructive"
              disabled={submitting}
            >
              {submitting ? "Resetting..." : "Reset Scoreboard"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
