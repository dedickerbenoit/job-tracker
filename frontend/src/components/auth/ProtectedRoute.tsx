import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

function AuthGate() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  useEffect(() => {
    openAuthModal("login");
  }, [openAuthModal]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <span className="text-3xl font-bold tracking-tight">JobTracker</span>
      <p className="text-muted-foreground">{t.auth.loginToAccess}</p>
      <Button onClick={() => openAuthModal("login")}>
        {t.auth.loginAction}
      </Button>
    </div>
  );
}

export function ProtectedRoute() {
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return <Outlet />;
}
