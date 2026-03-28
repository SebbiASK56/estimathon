import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PublicNavigation } from "@/components/PublicNavigation";

interface Team {
  id: string;
  team_name: string;
  team_number: number;
}

interface Problem {
  id: string;
  problem_number: number;
  correct_answer: number;
}

interface Submission {
  team_id: string;
  problem_id: string;
  lower_bound: number;
  upper_bound: number;
  submitted_at: string;
}

const Scoreboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const rainbowColors = [
    "bg-rainbow-red",
    "bg-rainbow-orange",
    "bg-rainbow-yellow",
    "bg-rainbow-green",
    "bg-rainbow-cyan",
    "bg-rainbow-blue",
    "bg-rainbow-purple",
  ];

  const fetchData = async () => {
    const [teamsRes, problemsRes, submissionsRes] = await Promise.all([
      supabase.from("teams").select("*").order("team_number"),
      supabase.from("problems").select("*").order("problem_number"),
      supabase.from("submissions").select("*, submitted_at"),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (problemsRes.data) setProblems(problemsRes.data);
    if (submissionsRes.data) setSubmissions(submissionsRes.data);
    setLoading(false);
  };

  const getProblemScore = (teamId: string, problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return null;

    const teamSubmissions = submissions.filter(
      s => s.team_id === teamId && s.problem_id === problemId
    );

    if (teamSubmissions.length === 0) return null;

    const sortedSubmissions = [...teamSubmissions].sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
    const lastSubmission = sortedSubmissions[0];

    const lowerBound = Number(lastSubmission.lower_bound);
    const upperBound = Number(lastSubmission.upper_bound);
    const correctAnswer = Number(problem.correct_answer);

    const isCorrect = lowerBound <= correctAnswer && upperBound >= correctAnswer;

    if (isCorrect) {
      return Math.floor(upperBound / lowerBound);
    }

    const incorrectCount = teamSubmissions.filter(
      s => Number(s.lower_bound) > correctAnswer || Number(s.upper_bound) < correctAnswer
    ).length;

    return { incorrect: incorrectCount };
  };

  const getTotalScore = (teamId: string) => {
    let sumOfScores = 0;
    let unsolvedCount = 0;

    problems.forEach(problem => {
      const result = getProblemScore(teamId, problem.id);

      if (typeof result === 'number') {
        sumOfScores += result;
      } else {
        unsolvedCount++;
      }
    });

    return (sumOfScores + 10) * Math.pow(2, unsolvedCount);
  };

  const getTeamRanking = (teamId: string) => {
    const teamScores = teams.map(team => ({
      id: team.id,
      score: getTotalScore(team.id)
    })).sort((a, b) => a.score - b.score);

    return teamScores.findIndex(t => t.id === teamId) + 1;
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("scoreboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-muted-foreground">Loading scoreboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PublicNavigation />

        <div className="text-center space-y-6">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-foreground">
            Estimathon
          </h1>

          <div className="text-7xl font-mono font-bold text-foreground">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center justify-center gap-3">
            {!isRunning ? (
              <Button onClick={() => setIsRunning(true)} size="lg" className="rounded-full px-8">
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
            ) : (
              <Button onClick={() => setIsRunning(false)} size="lg" variant="secondary" className="rounded-full px-8">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={() => { setIsRunning(false); setTimeLeft(30 * 60); }} size="lg" variant="outline" className="rounded-full px-8">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="rounded-2xl overflow-auto border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-bold border-r w-40">Team Name</TableHead>
                {problems.map((problem) => (
                  <TableHead key={problem.id} className="text-center font-bold border-r w-20">
                    {problem.problem_number}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold w-20">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, index) => (
                <TableRow key={team.id} className={rainbowColors[index % 7]}>
                  <TableCell className="font-semibold text-foreground border-r h-10 py-2">
                    {team.team_number}. {team.team_name}
                  </TableCell>
                  {problems.map((problem) => {
                    const result = getProblemScore(team.id, problem.id);
                    return (
                      <TableCell key={problem.id} className="text-center border-r h-10 py-2">
                        <div className="flex items-center justify-center h-full">
                          {result !== null && (
                            typeof result === 'number' ? (
                              <span className="text-foreground font-bold text-base">{result}</span>
                            ) : (
                              <div className="bg-destructive/80 inline-flex items-center justify-center px-1.5 py-0.5 rounded">
                                {Array.from({ length: result.incorrect }).map((_, i) => (
                                  <span key={i} className="text-destructive-foreground font-bold text-base mx-0.5">✕</span>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold text-foreground h-10 py-2">
                    {(() => {
                      const score = getTotalScore(team.id);
                      const rank = getTeamRanking(team.id);
                      const rankClasses: Record<number, string> = {
                        1: "bg-gold text-foreground px-3 py-1 rounded-full font-extrabold text-lg shadow-sm",
                        2: "bg-silver text-foreground px-3 py-1 rounded-full font-extrabold text-lg shadow-sm",
                        3: "bg-bronze text-primary-foreground px-3 py-1 rounded-full font-extrabold text-lg shadow-sm",
                      };
                      return (
                        <span className={rankClasses[rank] || ""}>
                          {score}
                        </span>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
