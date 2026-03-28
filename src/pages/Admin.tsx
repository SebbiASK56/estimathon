import { useState, useEffect, useRef } from "react";
import { usePassword } from "@/contexts/PasswordContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Settings, ClipboardList, Play, Pause, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const { isAuthenticated, login } = usePassword();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerLoaded, setTimerLoaded] = useState(false);
  const lastUpdatedRef = useRef<string | null>(null);

  const fetchTimerState = async () => {
    const { data } = await supabase
      .from("timer_state")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      const wasRunning = data.is_running;
      const savedTimeLeft = data.time_left;
      const lastUpdated = new Date(data.last_updated_at).getTime();

      if (wasRunning) {
        const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
        setTimeLeft(Math.max(0, savedTimeLeft - elapsed));
        setIsRunning(true);
      } else {
        setTimeLeft(savedTimeLeft);
        setIsRunning(false);
      }
      lastUpdatedRef.current = data.id;
      setTimerLoaded(true);
    }
  };

  const updateTimerState = async (running: boolean, time: number) => {
    await supabase
      .from("timer_state")
      .update({
        is_running: running,
        time_left: time,
        last_updated_at: new Date().toISOString(),
      })
      .not("id", "is", null);
  };

  const handleStart = async () => {
    setIsRunning(true);
    await updateTimerState(true, timeLeft);
  };

  const handlePause = async () => {
    setIsRunning(false);
    await updateTimerState(false, timeLeft);
  };

  const handleReset = async () => {
    setIsRunning(false);
    setTimeLeft(30 * 60);
    await updateTimerState(false, 30 * 60);
  };

  useEffect(() => {
    if (isAuthenticated) fetchTimerState();
  }, [isAuthenticated]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(password);
    if (!success) {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <Lock className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-4xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground">Enter admin password to access</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="text-center text-lg py-6"
              autoFocus
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full py-6 text-lg" disabled={loading || !password}>
              {loading ? "Verifying..." : "Enter"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <Lock className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-5xl font-bold">Admin Panel</h1>
        </div>

        {timerLoaded && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Timer Control</h2>
            <div className="text-5xl font-mono font-bold text-foreground">
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <Button onClick={handleStart} size="lg" className="rounded-full px-8">
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={handlePause} size="lg" variant="secondary" className="rounded-full px-8">
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={handleReset} size="lg" variant="outline" className="rounded-full px-8">
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 pt-4">
          <Link to="/admin/setup" className="block">
            <Button variant="secondary" className="w-full h-auto flex flex-col gap-3 p-6 hover:scale-105 transition-transform">
              <Settings className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">Setup</div>
                <div className="text-sm text-muted-foreground">Manage teams & problems</div>
              </div>
            </Button>
          </Link>
          <Link to="/admin/submissions" className="block">
            <Button variant="secondary" className="w-full h-auto flex flex-col gap-3 p-6 hover:scale-105 transition-transform">
              <ClipboardList className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">Submissions</div>
                <div className="text-sm text-muted-foreground">View & manage submissions</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Admin;
