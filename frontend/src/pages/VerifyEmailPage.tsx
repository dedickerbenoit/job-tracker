import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Mail, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { t } from "@/lib/i18n";

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Poll for email verification every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success(t.auth.emailVerification.resent);
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      // 429 or other error — handled by interceptor
    } finally {
      setResending(false);
    }
  }, [resending, cooldown]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t.auth.emailVerification.title}
        </h1>
        <p className="text-muted-foreground max-w-md">
          {t.auth.emailVerification.description}
        </p>
        {user?.email && <p className="font-medium">{user.email}</p>}
        <p className="text-sm text-muted-foreground">
          {t.auth.emailVerification.checkSpam}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          variant="outline"
        >
          {resending
            ? t.auth.emailVerification.resending
            : cooldown > 0
              ? t.auth.emailVerification.resendCooldown(cooldown)
              : t.auth.emailVerification.resend}
        </Button>

        <Button
          variant="ghost"
          className="gap-2"
          render={<Link to="/dashboard/account" />}
        >
          <Settings className="h-4 w-4" />
          {t.rgpd.myAccount}
        </Button>

        <Button variant="ghost" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          {t.auth.emailVerification.logout}
        </Button>
      </div>
    </div>
  );
}
