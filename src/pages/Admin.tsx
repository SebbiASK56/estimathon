import { useState, useEffect, useRef } from "react";
import { usePassword } from "@/contexts/PasswordContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Settings, ClipboardList, Play, Pause, RotateCcw, ShieldCheck, ShieldOff, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SetTimerInput = ({ onSet, disabled }: { onSet: (seconds: number) => void; disabled: boolean }) => {
  const [mins, setMins] = useState("");
  const [secs, setSecs] = useState("");

  const handleSet = () => {
    const totalSeconds = (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);
    if (totalSeconds > 0) {
      onSet(totalSeconds);
      setMins("");
      setSecs("");
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <Input
        type="number"
        placeholder="MM"
        value={mins}
        onChange={(e) => setMins(e.target.value)}
        className="w-16 text-center"
        min={0}
        disabled={disabled}
      />
      <span className="text-muted-foreground font-bold">:</span>
      <Input
        type="number"
        placeholder="SS"
        value={secs}
        onChange={(e) => setSecs(e.target.value)}
        className="w-16 text-center"
        min={0}
        max={59}
        disabled={disabled}
      />
      <Button onClick={handleSet} size="sm" variant="outline" disabled={disabled || (!mins && !secs)}>
        Set
      </Button>
    </div>
  );
};

const Admin = () => {
  const { isAuthenticated, login } = usePassword();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerLoaded, setTimerLoaded] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(true);
  const timerSnapshotRef = useRef<{ timeLeft: number; lastUpdatedAt: number; isRunning: boolean } | null>(null);

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

      timerSnapshotRef.current = { timeLeft: savedTimeLeft, lastUpdatedAt: lastUpdated, isRunning: wasRunning };
      setIsRunning(wasRunning);

      if (wasRunning) {
        const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
        setTimeLeft(Math.max(0, savedTimeLeft - elapsed));
      } else {
        setTimeLeft(savedTimeLeft);
      }
      setSubmissionsOpen(data.submissions_open ?? true);
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
    const now = Date.now();
    timerSnapshotRef.current = { timeLeft, lastUpdatedAt: now, isRunning: true };
    setIsRunning(true);
    await updateTimerState(true, timeLeft);
  };

  const handlePause = async () => {
    timerSnapshotRef.current = { timeLeft, lastUpdatedAt: Date.now(), isRunning: false };
    setIsRunning(false);
    await updateTimerState(false, timeLeft);
  };

  const handleReset = async () => {
    timerSnapshotRef.current = { timeLeft: 30 * 60, lastUpdatedAt: Date.now(), isRunning: false };
    setIsRunning(false);
    setTimeLeft(30 * 60);
    await updateTimerState(false, 30 * 60);
  };

  const handleSetTime = async (seconds: number) => {
    timerSnapshotRef.current = { timeLeft: seconds, lastUpdatedAt: Date.now(), isRunning };
    setTimeLeft(seconds);
    await updateTimerState(isRunning, seconds);
  };

  const toggleSubmissions = async () => {
    const newVal = !submissionsOpen;
    setSubmissionsOpen(newVal);
    await supabase
      .from("timer_state")
      .update({ submissions_open: newVal } as any)
      .not("id", "is", null);
  };

  useEffect(() => {
    if (isAuthenticated) fetchTimerState();
  }, [isAuthenticated]);

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
            <SetTimerInput onSet={handleSetTime} disabled={isRunning} />
          </Card>
        )}

        {timerLoaded && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Submissions</h2>
            <div className="flex items-center justify-center gap-3">
              {submissionsOpen ? (
                <Button onClick={toggleSubmissions} size="lg" variant="destructive" className="rounded-full px-8">
                  <ShieldOff className="w-5 h-5 mr-2" />
                  Close Submissions
                </Button>
              ) : (
                <Button onClick={toggleSubmissions} size="lg" className="rounded-full px-8">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Open Submissions
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Submissions are currently <span className="font-semibold">{submissionsOpen ? "open" : "closed"}</span>
            </p>
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
