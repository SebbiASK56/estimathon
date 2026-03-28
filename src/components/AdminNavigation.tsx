import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Settings, ClipboardList } from "lucide-react";

export const AdminNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="flex gap-2 mb-8 flex-wrap">
      <Link to="/admin">
        <Button variant={isActive("/admin") ? "default" : "outline"} size="sm">
          <Lock className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </Link>
      <Link to="/admin/setup">
        <Button variant={isActive("/admin/setup") ? "default" : "outline"} size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Setup
        </Button>
      </Link>
      <Link to="/admin/submissions">
        <Button variant={isActive("/admin/submissions") ? "default" : "outline"} size="sm">
          <ClipboardList className="w-4 h-4 mr-2" />
          Submissions
        </Button>
      </Link>
    </nav>
  );
};
