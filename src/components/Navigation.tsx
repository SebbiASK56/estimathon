import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Settings, ScanLine, Trophy, ClipboardList, LogOut } from "lucide-react";
import { usePassword } from "@/contexts/PasswordContext";

export const Navigation = () => {
  const location = useLocation();
  const { logout } = usePassword();
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
    }
  };
  
  return (
    <nav className="flex gap-2 mb-8 flex-wrap">
      <Link to="/">
        <Button 
          variant={isActive("/") ? "default" : "outline"} 
          size="sm"
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </Link>
      <Link to="/setup">
        <Button 
          variant={isActive("/setup") ? "default" : "outline"} 
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Setup
        </Button>
      </Link>
      <Link to="/scan">
        <Button 
          variant={isActive("/scan") ? "default" : "outline"} 
          size="sm"
        >
          <ScanLine className="w-4 h-4 mr-2" />
          Submit
        </Button>
      </Link>
      <Link to="/submissions">
        <Button 
          variant={isActive("/submissions") ? "default" : "outline"} 
          size="sm"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Submissions
        </Button>
      </Link>
      <Link to="/scoreboard">
        <Button 
          variant={isActive("/scoreboard") ? "default" : "outline"} 
          size="sm"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Scoreboard
        </Button>
      </Link>
      <div className="ml-auto">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );
};
