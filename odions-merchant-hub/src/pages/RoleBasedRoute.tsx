import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RoleBasedRouteProps {
  children: JSX.Element;
  allowedRoles: ("admin" | "merchant")[];
}

export const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // spinner or loader
  if (!user) return <Navigate to="/login" replace />;
  if (!role || !allowedRoles.includes(role)) return <Navigate to="/not-authorized" replace />;

  return children;
};
