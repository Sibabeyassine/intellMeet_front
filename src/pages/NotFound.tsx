import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-gradient-mesh px-6">
      <div className="text-center animate-fade-in">
        <p className="font-display text-7xl font-bold text-gradient">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">{t("notFound.title")}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("notFound.description")}</p>
        <Button asChild variant="hero" className="mt-6 gap-2">
          <Link to="/"><Home className="h-4 w-4" /> {t("notFound.back")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
