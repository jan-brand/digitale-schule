import React from "react";

interface PermissionGateProps {
  allowed: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// UX-only visibility helper (doc/UI_UX_SPECIFICATION.md §8:
// "PermissionGate nur für Sichtbarkeit/UX — kein Ersatz für RLS").
// Hiding a button here never substitutes for the server-side check the
// action itself still performs — this just avoids showing an action
// that would predictably be rejected anyway.
export function PermissionGate({ allowed, children, fallback = null }: PermissionGateProps) {
  return <>{allowed ? children : fallback}</>;
}
