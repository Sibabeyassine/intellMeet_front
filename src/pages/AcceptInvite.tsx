import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { api } from "@/services";
import { useProjectsStore } from "@/store/projects";

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const fetchAll = useProjectsStore(s => s.fetchAll);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Validation de l'invitation...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien d'invitation invalide.");
      return;
    }

    let alive = true;
    void api.projects.acceptTeamInvite(token)
      .then(async (team) => {
        if (!alive) return;
        await fetchAll();
        setStatus("success");
        setMessage(`Tu as rejoint l'espace ${team.name}.`);
        toast.success("Invitation acceptée");
        window.setTimeout(() => navigate("/projects", { replace: true }), 1200);
      })
      .catch((error) => {
        if (!alive) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Invitation impossible à accepter.");
      });

    return () => { alive = false; };
  }, [fetchAll, navigate, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md space-y-5 p-6 text-center shadow-elev-sm">
        <div className="flex justify-center"><Logo /></div>
        <div className="flex justify-center">
          {status === "loading" ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-10 w-10 text-success" />
          ) : (
            <ShieldAlert className="h-10 w-10 text-destructive" />
          )}
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">
            Invitation d'équipe
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
        <Button asChild variant={status === "success" ? "hero" : "outline"} className="w-full">
          <Link to={status === "success" ? "/projects" : "/dashboard"}>
            {status === "success" ? "Ouvrir l'équipe" : "Retour"}
          </Link>
        </Button>
      </Card>
    </div>
  );
};

export default AcceptInvite;
