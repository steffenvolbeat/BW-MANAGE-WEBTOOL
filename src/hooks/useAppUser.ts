"use client";
import { useAuth } from "@/components/AuthProvider";

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

/**
 * Liest den aktuell eingeloggten Benutzer aus dem Auth-Kontext.
 * Auf geschützten Seiten ist immer ein User vorhanden (Middleware leitet sonst weiter).
 */
export function useAppUser(): AppUser {
  const { user } = useAuth();
  return {
    id: user?.id ?? "",
    email: user?.email,
    name: user?.name,
    role: user?.role,
  };
}
