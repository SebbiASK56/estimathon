import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const timerSnapshotRef = useRef<{ timeLeft: number; lastUpdatedAt: number; isRunning: boolean } | null>(null);

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

  const fetchTimerState = async () => {
    const { data } = await supabase
      .from("timer_state")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      applyTimerState(data);
    }
  };

  const applyTimerState = (data: any) => {
    const wasRunning = data.is_running;
    const savedTimeLeft = data.time_left;
    const lastUpdated = new Date(data.last_updated_at).getTime();

    timerSnapshotRef.current = { timeLeft: savedTimeLeft, lastUpdatedAt: lastUpdated, isRunning: wasRunning };
    setIsRunning(wasRunning);

    if (wasRunning) {
      const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
      setTimeLeft(Math.max(0, savedTimeLeft - elapsed));
    } else {
      setTimeLeft(savedTimeLeft);
    }
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
    fetchTimerState();

    const submissionsChannel = supabase
      .channel("scoreboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => fetchData()
      )
      .subscribe();

    const timerChannel = supabase
      .channel("timer-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timer_state" },
        (payload: any) => {
          if (payload.new) applyTimerState(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(timerChannel);
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timerSnapshotRef.current) {
      interval = setInterval(() => {
        const snap = timerSnapshotRef.current;
        if (!snap) return;
        const elapsed = Math.floor((Date.now() - snap.lastUpdatedAt) / 1000);
        setTimeLeft(Math.max(0, snap.timeLeft - elapsed));
      }, 250);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning]);

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
        </div>

        <div className="rounded-2xl overflow-auto border border-foreground/30 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted border-b border-foreground/30">
                <TableHead className="font-bold border-r-2 border-foreground w-40">Team Name</TableHead>
                {problems.map((problem, idx) => (
                  <TableHead key={problem.id} className={`text-center font-bold w-20 ${idx === problems.length - 1 ? 'border-r-2 border-foreground' : 'border-r border-foreground/30'}`}>
                    {problem.problem_number}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold border-r border-foreground/30 w-20 leading-tight text-xs">Answers<br/>Left</TableHead>
                <TableHead className="text-center font-bold w-20">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, index) => (
                <TableRow key={team.id} className={`${rainbowColors[index % 7]} border-b border-foreground/30`}>
                  <TableCell className="font-semibold text-foreground border-r-2 border-foreground h-10 py-2">
                    {team.team_number}. {team.team_name}
                  </TableCell>
                  {problems.map((problem) => {
                    const result = getProblemScore(team.id, problem.id);
                    return (
                      <TableCell key={problem.id} className={`text-center h-10 py-2 ${problems.indexOf(problem) === problems.length - 1 ? 'border-r-2 border-foreground' : 'border-r border-foreground/30'}`}>
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
                  <TableCell className="text-center border-r border-foreground/30 font-bold text-foreground h-10 py-2">
                    {18 - submissions.filter(s => s.team_id === team.id).length}
                  </TableCell>
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
