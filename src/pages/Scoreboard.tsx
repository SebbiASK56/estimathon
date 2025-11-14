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
import { Navigation } from "@/components/Navigation";

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
}

const Scoreboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
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
      supabase.from("submissions").select("*"),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (problemsRes.data) setProblems(problemsRes.data);
    if (submissionsRes.data) setSubmissions(submissionsRes.data);
    setLoading(false);
  };

  const getIncorrectCount = (teamId: string, problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return 0;
    
    const teamSubmissions = submissions.filter(
      s => s.team_id === teamId && s.problem_id === problemId
    );
    
    return teamSubmissions.filter(
      s => s.lower_bound > problem.correct_answer || s.upper_bound < problem.correct_answer
    ).length;
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("scoreboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(30 * 60);
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
        <Navigation />
        
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Estimathon
          </h1>
          
          <div className="flex items-center justify-center gap-4">
            <div className="text-6xl font-mono font-bold">
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {!isRunning ? (
              <Button onClick={handleStart} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
            ) : (
              <Button onClick={handlePause} size="lg" variant="secondary">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={handleReset} size="lg" variant="outline">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold border-r border-black w-40">Team Name</TableHead>
                {problems.map((problem) => (
                  <TableHead key={problem.id} className="text-center font-bold border-r border-black w-20">
                    {problem.problem_number}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold w-20">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, index) => (
                <TableRow key={team.id} className={rainbowColors[index % 7]}>
                  <TableCell className="font-medium text-black border-r border-black h-10 py-2">{team.team_name}</TableCell>
                  {problems.map((problem) => {
                    const incorrectCount = getIncorrectCount(team.id, problem.id);
                    return (
                      <TableCell key={problem.id} className="text-center border-r border-black h-10 py-2">
                        <div className="flex items-center justify-center h-full">
                          {incorrectCount > 0 && (
                            <div className="bg-red-600 inline-flex items-center justify-center px-1.5 py-0.5 rounded">
                              {Array.from({ length: incorrectCount }).map((_, i) => (
                                <span key={i} className="text-black font-bold text-base mx-0.5">✕</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold text-black h-10 py-2">81920</TableCell>
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
