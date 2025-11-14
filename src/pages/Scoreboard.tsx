import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Team {
  id: string;
  team_name: string;
  team_number: number;
}

interface Problem {
  id: string;
  problem_number: number;
}

const Scoreboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [teamsRes, problemsRes] = await Promise.all([
      supabase.from("teams").select("*").order("team_number"),
      supabase.from("problems").select("*").order("problem_number"),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (problemsRes.data) setProblems(problemsRes.data);
    setLoading(false);
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
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Live Scoreboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time competition rankings
          </p>
        </div>

        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Team Name</TableHead>
                {problems.map((problem) => (
                  <TableHead key={problem.id} className="text-center font-bold">
                    {problem.problem_number}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.team_name}</TableCell>
                  {problems.map((problem) => (
                    <TableCell key={problem.id} className="text-center">
                      {/* Empty for now - will be filled with submission data */}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold">81920</TableCell>
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
