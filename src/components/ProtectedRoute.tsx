"use client";

/**
 * Kein Auth-System – rendert Children direkt ohne Umleitung.
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
