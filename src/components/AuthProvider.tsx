import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useNotificationsStore } from "@/store/notifications";

/**
 * Hydrates the session from storage on first mount and pulls notifications
 * once authenticated. Wrap the app with this once at the top level.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore(s => s.hydrate);
  const clearSession = useAuthStore(s => s.clearSession);
  const initialized = useAuthStore(s => s.initialized);
  const session = useAuthStore(s => s.session);
  const fetchNotifs = useNotificationsStore(s => s.fetch);
  const clearNotifs = useNotificationsStore(s => s.clear);

  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => {
    window.addEventListener("intellmeet:session-expired", clearSession);
    return () => window.removeEventListener("intellmeet:session-expired", clearSession);
  }, [clearSession]);
  useEffect(() => {
    if (!session) {
      clearNotifs();
      return;
    }

    void fetchNotifs();
    const interval = window.setInterval(() => {
      void fetchNotifs();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [session, fetchNotifs, clearNotifs]);

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}
