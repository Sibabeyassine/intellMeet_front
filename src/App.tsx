import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GlobalModals } from "@/components/modals/GlobalModals";
import Index from "./pages/Index.tsx";
import MeetingRoom from "./pages/MeetingRoom.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AIMeetings from "./pages/AIMeetings.tsx";
import Projects from "./pages/Projects.tsx";
import Chat from "./pages/Chat.tsx";
import Auth from "./pages/Auth.tsx";
import Settings from "./pages/Settings.tsx";
import Profile from "./pages/Profile.tsx";
import AcceptInvite from "./pages/AcceptInvite.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />
              <Route path="/meeting" element={<Protected><MeetingRoom /></Protected>} />
              <Route path="/meeting/:meetingId" element={<Protected><MeetingRoom /></Protected>} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/meetings" element={<Protected><AIMeetings /></Protected>} />
              <Route path="/projects" element={<Protected><Projects /></Protected>} />
              <Route path="/chat" element={<Protected><Chat /></Protected>} />
              <Route path="/settings" element={<Protected><Settings /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/invite/:token" element={<Protected><AcceptInvite /></Protected>} />
              <Route path="/invite/id/:inviteId" element={<Protected><AcceptInvite /></Protected>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <GlobalModals />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
