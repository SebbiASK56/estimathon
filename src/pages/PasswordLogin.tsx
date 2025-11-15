import { useState } from "react";
import { usePassword } from "@/contexts/PasswordContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PasswordLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = usePassword();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(password);

    if (success) {
      navigate("/");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Lock className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Estimathon</h1>
          <p className="text-muted-foreground">Enter password to access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="text-center text-lg py-6"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full py-6 text-lg"
            disabled={loading || !password}
          >
            {loading ? "Verifying..." : "Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordLogin;
