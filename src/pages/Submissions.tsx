import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface Submission {
  id: string;
  team_id: string;
  problem_id: string;
  lower_bound: number;
  upper_bound: number;
  submitted_at: string;
  teams?: { team_number: number; team_name: string };
  problems?: { problem_number: number };
}

const Submissions = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ lower_bound: 0, upper_bound: 0 });
  const [teamFilter, setTeamFilter] = useState<string>("");

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        teams (team_number, team_name),
        problems (problem_number)
      `)
      .order("submitted_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading submissions", description: error.message, variant: "destructive" });
    } else if (data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();

    const channel = supabase
      .channel("submissions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const startEdit = (submission: Submission) => {
    setEditingId(submission.id);
    setEditValues({
      lower_bound: submission.lower_bound,
      upper_bound: submission.upper_bound,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("submissions")
      .update({
        lower_bound: editValues.lower_bound,
        upper_bound: editValues.upper_bound,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating submission", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submission updated successfully!" });
      setEditingId(null);
      fetchSubmissions();
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    try {
      console.log('Attempting to delete submission:', id);
      const { error } = await supabase.from("submissions").delete().eq("id", id);

      if (error) {
        console.error('Delete error:', error);
        toast({ title: "Error deleting submission", description: error.message, variant: "destructive" });
      } else {
        console.log('Delete successful');
        toast({ title: "Submission deleted successfully!" });
        await fetchSubmissions();
      }
    } catch (err) {
      console.error('Unexpected error during delete:', err);
      toast({ 
        title: "Error deleting submission", 
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive" 
      });
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (!teamFilter) return true;
    return submission.teams?.team_number.toString() === teamFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-muted-foreground">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Navigation />

        <h1 className="text-4xl font-bold">Manage Submissions</h1>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by Team:</label>
          <Input
            type="text"
            placeholder="Enter team number..."
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="max-w-xs"
          />
          {teamFilter && (
            <Button variant="outline" onClick={() => setTeamFilter("")}>
              Clear Filter
            </Button>
          )}
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {teamFilter ? `No submissions found for team ${teamFilter}` : "No submissions yet"}
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Team #</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead className="w-24">Problem #</TableHead>
                  <TableHead className="w-32">Lower Bound</TableHead>
                  <TableHead className="w-32">Upper Bound</TableHead>
                  <TableHead className="w-48">Submitted At</TableHead>
                  <TableHead className="w-32 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.teams?.team_number}</TableCell>
                    <TableCell>{submission.teams?.team_name}</TableCell>
                    <TableCell>{submission.problems?.problem_number}</TableCell>
                    <TableCell>
                      {editingId === submission.id ? (
                        <Input
                          type="number"
                          step="any"
                          value={editValues.lower_bound}
                          onChange={(e) =>
                            setEditValues({ ...editValues, lower_bound: parseFloat(e.target.value) })
                          }
                          className="w-full"
                        />
                      ) : (
                        submission.lower_bound
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === submission.id ? (
                        <Input
                          type="number"
                          step="any"
                          value={editValues.upper_bound}
                          onChange={(e) =>
                            setEditValues({ ...editValues, upper_bound: parseFloat(e.target.value) })
                          }
                          className="w-full"
                        />
                      ) : (
                        submission.upper_bound
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(submission.submitted_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        {editingId === submission.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => saveEdit(submission.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(submission)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSubmission(submission.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Submissions;
