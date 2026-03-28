import { Link, useLocation } from "react-router-dom";

export const PublicNavigation = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/submit", label: "Submit" },
    { to: "/scoreboard", label: "Scoreboard" },
  ];

  return (
    <nav className="flex items-center gap-6 mb-8">
      <Link to="/" className="font-bold text-xl tracking-tight text-foreground">
        Estimathon
      </Link>
      <div className="flex gap-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-sm font-semibold uppercase tracking-wide transition-colors ${
              location.pathname === link.to
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
