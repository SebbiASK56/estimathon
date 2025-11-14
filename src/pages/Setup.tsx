import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface TeamInput {
  name: string;
}

interface ProblemInput {
  question: string;
  answer: string;
}

const Setup = () => {
  const { toast } = useToast();
  const [numTeams, setNumTeams] = useState<number>(0);
  const [teams, setTeams] = useState<TeamInput[]>([]);
  const [numProblems, setNumProblems] = useState<number>(0);
  const [problems, setProblems] = useState<ProblemInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const generateTeamFields = (count: number) => {
    const newCount = Math.max(0, Math.min(100, count));
    setNumTeams(newCount);
    setTeams(Array(newCount).fill(null).map(() => ({ name: "" })));
  };

  const generateProblemFields = (count: number) => {
    const newCount = Math.max(0, Math.min(100, count));
    setNumProblems(newCount);
    setProblems(Array(newCount).fill(null).map(() => ({ question: "", answer: "" })));
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

  const submitTeams = async () => {
    if (teams.some(t => !t.name.trim())) {
      toast({ title: "Please fill all team names", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const teamRecords = teams.map((team, index) => ({
        team_number: index + 1,
        team_name: team.name.trim(),
      }));

      const { error } = await supabase.from("teams").insert(teamRecords);

      if (error) throw error;

      toast({ title: `Successfully added ${teams.length} teams!` });
      setNumTeams(0);
      setTeams([]);
    } catch (error: any) {
      toast({ 
        title: "Error adding teams", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitProblems = async () => {
    if (problems.some(p => !p.question.trim() || !p.answer.trim())) {
      toast({ title: "Please fill all questions and answers", variant: "destructive" });
      return;
    }

    if (problems.some(p => isNaN(parseFloat(p.answer)))) {
      toast({ title: "All answers must be valid numbers", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const problemRecords = problems.map((problem, index) => ({
        problem_number: index + 1,
        question: problem.question.trim(),
        correct_answer: parseFloat(problem.answer),
      }));

      const { error } = await supabase.from("problems").insert(problemRecords);

      if (error) throw error;

      toast({ title: `Successfully added ${problems.length} problems!` });
      setNumProblems(0);
      setProblems([]);
    } catch (error: any) {
      toast({ 
        title: "Error adding problems", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="secondary" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Competition Setup</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Teams Section */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" />
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
                  value={numTeams || ""}
                  onChange={(e) => generateTeamFields(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 10"
                />
              </div>

              {teams.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {teams.map((team, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-muted-foreground w-12">
                        Team {index + 1}
                      </span>
                      <Input
                        value={team.name}
                        onChange={(e) => updateTeamName(index, e.target.value)}
                        placeholder="Team name"
                      />
                    </div>
                  ))}
                </div>
              )}

              {teams.length > 0 && (
                <Button 
                  onClick={submitTeams} 
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : `Add ${teams.length} Teams`}
                </Button>
              )}
            </div>
          </Card>

          {/* Problems Section */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" />
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
                  value={numProblems || ""}
                  onChange={(e) => generateProblemFields(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 13"
                />
              </div>

              {problems.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {problems.map((problem, index) => (
                    <div key={index} className="space-y-2 p-3 border border-border rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">
                        Problem {index + 1}
                      </div>
                      <Textarea
                        value={problem.question}
                        onChange={(e) => updateProblem(index, 'question', e.target.value)}
                        placeholder="Question..."
                        rows={2}
                      />
                      <Input
                        type="number"
                        step="any"
                        value={problem.answer}
                        onChange={(e) => updateProblem(index, 'answer', e.target.value)}
                        placeholder="Correct answer"
                      />
                    </div>
                  ))}
                </div>
              )}

              {problems.length > 0 && (
                <Button 
                  onClick={submitProblems} 
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : `Add ${problems.length} Problems`}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Setup;
