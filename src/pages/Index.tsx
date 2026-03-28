import { Link } from "react-router-dom";
import { Trophy, Send } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-[280px] h-[280px] rounded-full bg-primary opacity-90" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[220px] h-[220px] rounded-full bg-secondary opacity-90" />
      <div className="absolute bottom-[15%] right-[20%] w-[160px] h-[160px] rounded-full bg-accent opacity-80 hidden md:block" />

      <div className="relative z-10 text-center space-y-12 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-foreground">
            Estimathon
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            A Jane Street–style estimation competition with real-time scoring
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link to="/submit">
            <div className="w-44 h-44 rounded-full bg-secondary flex flex-col items-center justify-center gap-2 text-secondary-foreground hover:scale-105 transition-transform cursor-pointer shadow-lg">
              <Send className="w-8 h-8" />
              <span className="font-bold text-lg uppercase tracking-wide">Submit</span>
            </div>
          </Link>

          <Link to="/scoreboard">
            <div className="w-44 h-44 rounded-full bg-primary flex flex-col items-center justify-center gap-2 text-primary-foreground hover:scale-105 transition-transform cursor-pointer shadow-lg">
              <Trophy className="w-8 h-8" />
              <span className="font-bold text-lg uppercase tracking-wide">Scoreboard</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
