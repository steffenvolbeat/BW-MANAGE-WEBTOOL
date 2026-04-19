import { useAuth } from "@/components/AuthProvider";

const READ_ONLY_ROLES = ["MANAGER", "VERMITTLER"] as const;

/**
 * Gibt zurück, ob der aktuelle User ein reiner Beobachter ist
 * (MANAGER oder VERMITTLER) und damit keine Schreiboperationen durchführen darf.
 */
export function useReadOnly(): { isReadOnly: boolean } {
  const { user } = useAuth();
  const isReadOnly = user ? (READ_ONLY_ROLES as readonly string[]).includes(user.role) : false;
  return { isReadOnly };
}
