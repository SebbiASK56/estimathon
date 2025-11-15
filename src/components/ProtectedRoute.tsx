import { Navigate } from "react-router-dom";
import { usePassword } from "@/contexts/PasswordContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = usePassword();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
