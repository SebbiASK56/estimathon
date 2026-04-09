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
  const [passphrase, setPassphrase] = useState("");
  const [problemNumber, setProblemNumber] = useState("");
  const [lowerBound, setLowerBound] = useState("");
  const [upperBound, setUpperBound] = useState("");
  const [processing, setProcessing] = useState(false);

  const calculateScore = (lower: number, upper: number, correct: number): number => {
    if (lower > correct || upper < correct) return 0;
    return Math.floor(upper / lower);
  };

  const MIN_BOUND = 1e-15;
  const MAX_BOUND = 1e15;
  const MAX_SUBMISSIONS = 18;

  const submitAnswer = async () => {
    if (!passphrase || !problemNumber || !lowerBound || !upperBound) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    // Check if submissions are open
    const { data: timerData } = await supabase
      .from("timer_state")
      .select("submissions_open")
      .limit(1)
      .single();

    if (timerData && !(timerData as any).submissions_open) {
      toast({ title: "Submissions are closed", variant: "destructive" });
      return;
    }

    const lower = parseFloat(lowerBound);
    const upper = parseFloat(upperBound);

    if (isNaN(lower) || isNaN(upper)) {
      toast({ title: "Bounds must be valid numbers", variant: "destructive" });
      return;
    }

    if (lower < MIN_BOUND || lower > MAX_BOUND || upper < MIN_BOUND || upper > MAX_BOUND) {
      toast({ title: `Bounds must be between 1e-15 and 1e15`, variant: "destructive" });
      return;
    }

    setProcessing(true);

    try {
      const { data: team } = await (supabase
        .from("teams")
        .select("id") as any)
        .eq("passphrase", passphrase.trim())
        .single();

      if (!team) {
        toast({ title: "Invalid passphrase", variant: "destructive" });
        setProcessing(false);
        return;
      }

      // Check submission count
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("team_id", team.id);

      const usedSubmissions = count ?? 0;

      if (usedSubmissions >= MAX_SUBMISSIONS) {
        toast({
          title: "No submissions remaining",
          description: `Your team has used all ${MAX_SUBMISSIONS} submissions.`,
          variant: "destructive",
          duration: 5000,
        });
        setProcessing(false);
        return;
      }

      const { data: problem } = await supabase
        .from("problems")
        .select("id, correct_answer")
        .eq("problem_number", parseInt(problemNumber))
        .single();

      if (!problem) {
        toast({ title: "Invalid problem number", variant: "destructive" });
        setProcessing(false);
        return;
      }

      const score = calculateScore(lower, upper, problem.correct_answer);

      const { error } = await supabase.from("submissions").insert({
        team_id: team.id,
        problem_id: problem.id,
        lower_bound: lower,
        upper_bound: upper,
        score,
      });

      if (error) throw error;

      const remaining = MAX_SUBMISSIONS - usedSubmissions - 1;

      toast({
        title: "Submission recorded!",
        description: `${score === 0 ? "Incorrect" : `Score: ${Math.floor(score)}`} — ${remaining} submission${remaining === 1 ? "" : "s"} remaining`,
        duration: 5000,
      });

      setPassphrase("");
      setProblemNumber("");
      setLowerBound("");
      setUpperBound("");
    } catch (error: any) {
      toast({
        title: "Error submitting answer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <PublicNavigation />

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Submit Answer</h1>

        <Card className="p-6 space-y-6 shadow-md border">
          <div className="space-y-5">
            <div>
              <Label htmlFor="passphrase" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Team Passphrase</Label>
              <Input
                id="passphrase"
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your team's passphrase"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="problem-number" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Problem Number</Label>
              <Input
                id="problem-number"
                type="number"
                value={problemNumber}
                onChange={(e) => setProblemNumber(e.target.value)}
                placeholder="e.g., 1"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lower-bound" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lower Bound</Label>
                <Input
                  id="lower-bound"
                  type="number"
                  step="any"
                  value={lowerBound}
                  onChange={(e) => setLowerBound(e.target.value)}
                  placeholder="e.g., 10"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="upper-bound" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upper Bound</Label>
                <Input
                  id="upper-bound"
                  type="number"
                  step="any"
                  value={upperBound}
                  onChange={(e) => setUpperBound(e.target.value)}
                  placeholder="e.g., 50"
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={submitAnswer}
              className="w-full"
              size="lg"
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
