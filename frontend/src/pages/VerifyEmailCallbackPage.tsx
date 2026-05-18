import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { t } from "@/lib/i18n";

type Status = "loading" | "success" | "error";

export default function VerifyEmailCallbackPage() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!id || !hash) {
      setStatus("error");
      return;
    }

    const query = searchParams.toString();

    authApi
      .verifyEmail(Number(id), hash, query)
      .then(async () => {
        setStatus("success");
        await refreshUser();
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      })
      .catch(() => {
        setStatus("error");
      });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      {status === "loading" && (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">
            {t.auth.emailVerification.verifying}
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold tracking-tight">
            {t.auth.emailVerification.verified}
          </h1>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold tracking-tight">
            {t.auth.emailVerification.invalidLink}
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/", { replace: true })}
          >
            {t.notFound.backHome}
          </Button>
        </>
      )}
    </div>
  );
}
