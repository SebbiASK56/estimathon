import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import { PublicNavigation } from "@/components/PublicNavigation";

const Scan = () => {
  const { toast } = useToast();
  const [teamNumber, setTeamNumber] = useState("");
  const [problemNumber, setProblemNumber] = useState("");
  const [lowerBound, setLowerBound] = useState("");
  const [upperBound, setUpperBound] = useState("");
  const [processing, setProcessing] = useState(false);

  const calculateScore = (lower: number, upper: number, correct: number): number => {
    if (lower > correct || upper < correct) return 0;
    return Math.floor(upper / lower);
  };

  const submitAnswer = async () => {
    if (!teamNumber || !problemNumber || !lowerBound || !upperBound) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setProcessing(true);

    try {
      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .eq("team_number", parseInt(teamNumber))
        .single();

      const { data: problems } = await supabase
        .from("problems")
        .select("id, correct_answer")
        .eq("problem_number", parseInt(problemNumber))
        .single();

      if (!teams || !problems) {
        toast({ title: "Invalid team or problem number", variant: "destructive" });
        setProcessing(false);
        return;
      }

      const lower = parseFloat(lowerBound);
      const upper = parseFloat(upperBound);
      const score = calculateScore(lower, upper, problems.correct_answer);

      const { error } = await supabase.from("submissions").insert({
        team_id: teams.id,
        problem_id: problems.id,
        lower_bound: lower,
        upper_bound: upper,
        score,
      });

      if (error) throw error;

      toast({ 
        title: "Submission recorded!", 
        description: score === 0 ? "Incorrect" : `Score: ${Math.floor(score)}`,
        duration: 3000,
      });

      setTeamNumber("");
      setProblemNumber("");
      setLowerBound("");
      setUpperBound("");
    } catch (error: any) {
      toast({ 
        title: "Error submitting answer", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <PublicNavigation />
        
        <h1 className="text-3xl md:text-4xl font-bold">Submit Answer</h1>

        <Card className="p-6 space-y-6">
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
              <Label htmlFor="problem-number">Problem Number</Label>
              <Input
                id="problem-number"
                type="number"
                value={problemNumber}
                onChange={(e) => setProblemNumber(e.target.value)}
                placeholder="e.g., 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lower-bound">Lower Bound</Label>
                <Input
                  id="lower-bound"
                  type="number"
                  step="any"
                  value={lowerBound}
                  onChange={(e) => setLowerBound(e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <Label htmlFor="upper-bound">Upper Bound</Label>
                <Input
                  id="upper-bound"
                  type="number"
                  step="any"
                  value={upperBound}
                  onChange={(e) => setUpperBound(e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <Button 
              onClick={submitAnswer} 
              className="w-full"
              disabled={processing}
            >
              {processing ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Answer
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Scan;
