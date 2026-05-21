import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import { useNotificationsStore } from "@/store/notifications";
import { useProjectsStore } from "@/store/projects";
import { isRealtimeEnabled, resolveRealtimeUrl } from "@/services/realtime";

const WS_URL = resolveRealtimeUrl();
const REALTIME_ENABLED = isRealtimeEnabled();

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
  useEffect(() => {
    if (!REALTIME_ENABLED) return;
    if (!session?.accessToken) return;

    const socket: Socket = io(WS_URL, {
      auth: { token: session.accessToken }
    });

    socket.on("workspace:members-updated", () => {
      void useProjectsStore.getState().fetchAll();
      void fetchNotifs();
    });
    socket.on("workspace:tasks-updated", () => {
      void useProjectsStore.getState().fetchAll();
      void fetchNotifs();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchNotifs, session?.accessToken]);

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}
