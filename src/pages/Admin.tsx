import { useState } from "react";
import { usePassword } from "@/contexts/PasswordContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Settings, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

const Admin = () => {
  const { isAuthenticated, login } = usePassword();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
