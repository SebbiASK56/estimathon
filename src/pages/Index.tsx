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
            Jane Street style estimation competitions with real-time scoring and paper slip scanning
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-8">
          <Link to="/setup" className="block">
            <Button variant="secondary" className="w-full h-auto flex flex-col gap-3 p-6 hover:scale-105 transition-transform">
              <Trophy className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">Setup</div>
                <div className="text-sm text-muted-foreground">Manage teams & problems</div>
              </div>
            </Button>
          </Link>

          <Link to="/scan" className="block">
            <Button variant="secondary" className="w-full h-auto flex flex-col gap-3 p-6 hover:scale-105 transition-transform">
              <Smartphone className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">Scan</div>
                <div className="text-sm text-muted-foreground">Submit paper slips</div>
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
