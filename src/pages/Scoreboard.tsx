import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TeamScore {
  team_id: string;
  team_number: number;
  team_name: string;
  total_score: number;
  submission_count: number;
}

const Scoreboard = () => {
  const [scores, setScores] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    const { data: submissions } = await supabase
      .from("submissions")
      .select(`
        team_id,
        score,
        teams (
          team_number,
          team_name
        )
      `);

    if (submissions) {
      const scoreMap = new Map<string, TeamScore>();

      submissions.forEach((sub: any) => {
        const teamId = sub.team_id;
        if (!scoreMap.has(teamId)) {
          scoreMap.set(teamId, {
            team_id: teamId,
            team_number: sub.teams.team_number,
            team_name: sub.teams.team_name,
            total_score: 0,
            submission_count: 0,
          });
        }
        const team = scoreMap.get(teamId)!;
        team.total_score += sub.score || 0;
        team.submission_count += 1;
      });

      const sortedScores = Array.from(scoreMap.values()).sort(
        (a, b) => b.total_score - a.total_score
      );

      setScores(sortedScores);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();

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
          fetchScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-gold" />;
    if (index === 1) return <Medal className="w-6 h-6 text-silver" />;
    if (index === 2) return <Medal className="w-6 h-6 text-bronze" />;
    return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{index + 1}</span>;
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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Live Scoreboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time competition rankings
          </p>
        </div>

        <div className="space-y-4">
          {scores.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-xl text-muted-foreground">No submissions yet</p>
              <Link to="/setup" className="inline-block mt-4">
                <Button variant="secondary">Set up teams and problems</Button>
              </Link>
            </Card>
          ) : (
            scores.map((team, index) => (
              <Card
                key={team.team_id}
                className={`p-6 transition-all duration-300 hover:scale-[1.02] ${
                  index === 0 ? "border-gold shadow-glow" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        Team {team.team_number}: {team.team_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {team.submission_count} submission{team.submission_count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">
                      {team.total_score.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
