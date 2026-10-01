import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles, blockedRoles, redirectTo = "/dash" }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (
    (allowedRoles && !allowedRoles.includes(user.role)) ||
    blockedRoles?.includes(user.role)
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
