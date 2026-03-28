import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ScanLine, Trophy } from "lucide-react";

export const PublicNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="flex gap-2 mb-8 flex-wrap">
      <Link to="/">
        <Button variant={isActive("/") ? "default" : "outline"} size="sm">
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </Link>
      <Link to="/submit">
        <Button variant={isActive("/submit") ? "default" : "outline"} size="sm">
          <ScanLine className="w-4 h-4 mr-2" />
          Submit
        </Button>
      </Link>
      <Link to="/scoreboard">
        <Button variant={isActive("/scoreboard") ? "default" : "outline"} size="sm">
          <Trophy className="w-4 h-4 mr-2" />
          Scoreboard
        </Button>
      </Link>
    </nav>
  );
};
