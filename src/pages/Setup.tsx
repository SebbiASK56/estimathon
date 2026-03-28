import { useState, useEffect, useRef } from "react";
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
  passphrase: string;
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

  const NUM_PROBLEMS = 13;

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
        setTeams(teamsRes.data.map(t => ({ id: t.id, name: t.team_name, passphrase: (t as any).passphrase || "" })));
      }
      
      // Always show 13 problems, pre-filling with saved data
      const savedProblems = problemsRes.data || [];
      const allProblems = Array.from({ length: NUM_PROBLEMS }, (_, i) => {
        const saved = savedProblems.find(p => p.problem_number === i + 1);
        return saved 
          ? { id: saved.id, question: saved.question, answer: saved.correct_answer.toString() }
          : { id: "", question: "", answer: "" };
      });
      setProblems(allProblems);
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
      setTeams([...teams, ...Array(newCount - current).fill(null).map(() => ({ id: "", name: "", passphrase: "" }))]);
    } else {
      setTeams(teams.slice(0, newCount));
    }
  };



  const updateTeamName = (index: number, name: string) => {
    const updated = [...teams];
    updated[index].name = name;
    setTeams(updated);
  };

  const updateTeamPassphrase = (index: number, passphrase: string) => {
    const updated = [...teams];
    updated[index].passphrase = passphrase;
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
    if (teams.some(t => !t.passphrase.trim())) {
      toast({ title: "Please fill all team passphrases", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase.from("teams").delete().gte("team_number", 0);
      if (deleteError) throw deleteError;
      
      const teamRecords = teams.map((team, index) => ({
        team_number: index + 1,
        team_name: team.name.trim(),
        passphrase: team.passphrase.trim(),
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
        <AdminNavigation />
        
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const count = teams.length || 6;
                      setTeams(Array.from({ length: count }, (_, i) => ({
                        id: "",
                        name: `Team ${i + 1}`,
                        passphrase: `${i + 1}`,
                      })));
                    }}
                  >
                    Populate Defaults
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = prompt("Paste CSV (team_name,passphrase per line):");
                      if (!input) return;
                      const lines = input.trim().split("\n").filter(l => l.trim());
                      // Skip header row if it contains "email" or "team"
                      const startIdx = lines[0]?.toLowerCase().includes("email") || lines[0]?.toLowerCase().includes("team") ? 1 : 0;
                      const parsed = lines.slice(startIdx).map(line => {
                        const cols = line.split(",").map(s => s.trim());
                        // Support both "team,phrase" and "email,team,phrase" formats
                        if (cols.length >= 3) {
                          return { id: "", name: cols[1] || "", passphrase: cols[2] || "" };
                        }
                        return { id: "", name: cols[0] || "", passphrase: cols[1] || "" };
                      });
                      if (parsed.length > 0) setTeams(parsed);
                    }}
                  >
                    Import CSV
                  </Button>
                </div>

                {teams.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {teams.map((team, index) => (
                      <div key={index} className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">Team {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            value={team.name}
                            onChange={(e) => updateTeamName(index, e.target.value)}
                            placeholder="Team name"
                            className="flex-1"
                          />
                          <Input
                            value={team.passphrase}
                            onChange={(e) => updateTeamPassphrase(index, e.target.value)}
                            placeholder="Passphrase"
                            className="flex-1"
                          />
                        </div>
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
