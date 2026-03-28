import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Smartphone, Monitor } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <Trophy className="w-20 h-20 mx-auto text-primary" />
          <h1 className="text-6xl font-bold tracking-tight">
            Estimathon
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Jane Street style estimation competitions with real-time scoring
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-8 max-w-2xl mx-auto">
          <Link to="/submit" className="block">
            <Button variant="secondary" className="w-full h-auto flex flex-col gap-3 p-6 hover:scale-105 transition-transform">
              <Smartphone className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">Submit</div>
                <div className="text-sm text-muted-foreground">Submit your answers</div>
              </div>
            </Button>
          </Link>

          <Link to="/scoreboard" className="block">
            <Button variant="secondary" className="w-full h-auto flex flex-col gap-3 p-6 hover:scale-105 transition-transform">
              <Monitor className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">Scoreboard</div>
                <div className="text-sm text-muted-foreground">Live rankings</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
