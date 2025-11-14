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

const Setup = () => {
  const { toast } = useToast();
  const [teamNumber, setTeamNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [problemNumber, setProblemNumber] = useState("");
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  const addTeam = async () => {
    if (!teamNumber || !teamName) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("teams").insert({
      team_number: parseInt(teamNumber),
      team_name: teamName,
    });

    if (error) {
      toast({ title: "Error adding team", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team added successfully!" });
      setTeamNumber("");
      setTeamName("");
    }
  };

  const addProblem = async () => {
    if (!problemNumber || !question || !correctAnswer) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("problems").insert({
      problem_number: parseInt(problemNumber),
      question,
      correct_answer: parseFloat(correctAnswer),
    });

    if (error) {
      toast({ title: "Error adding problem", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Problem added successfully!" });
      setProblemNumber("");
      setQuestion("");
      setCorrectAnswer("");
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
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Add Team</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="team-number">Team Number</Label>
                <Input
                  id="team-number"
                  type="number"
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  placeholder="e.g., 1"
                />
              </div>

              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., The Estimators"
                />
              </div>

              <Button onClick={addTeam} className="w-full">
                Add Team
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Add Problem</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="problem-number">Problem Number</Label>
                <Input
                  id="problem-number"
                  type="number"
                  value={problemNumber}
                  onChange={(e) => setProblemNumber(e.target.value)}
                  placeholder="e.g., 1"
                />
              </div>

              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the estimation question..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="correct-answer">Correct Answer</Label>
                <Input
                  id="correct-answer"
                  type="number"
                  step="any"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="e.g., 42.5"
                />
              </div>

              <Button onClick={addProblem} className="w-full">
                Add Problem
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Setup;
