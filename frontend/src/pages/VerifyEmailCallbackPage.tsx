import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { t } from "@/lib/i18n";

type Status = "loading" | "success" | "error";
type ErrorType = "invalid" | "rate_limited" | "server_error";

export default function VerifyEmailCallbackPage() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [status, setStatus] = useState<Status>("loading");
  const [errorType, setErrorType] = useState<ErrorType>("invalid");
  const [retryCountdown, setRetryCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const query = searchParams.toString();

  const verify = useCallback(() => {
    if (!id || !hash) {
      setStatus("error");
      setErrorType("invalid");
      return;
    }

    setStatus("loading");

    authApi
      .verifyEmail(Number(id), hash, query)
      .then(async () => {
        setStatus("success");
        await refreshUser();
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      })
      .catch((error) => {
        const httpStatus = error.response?.status;
        if (httpStatus === 403) {
          setErrorType("invalid");
          setStatus("error");
        } else if (httpStatus === 429) {
          const retryAfter = parseInt(
            error.response?.headers?.["retry-after"],
            10,
          );
          const delay = retryAfter > 0 ? retryAfter : 60;
          setErrorType("rate_limited");
          setStatus("error");
          setRetryCountdown(delay);
        } else {
          setErrorType("server_error");
          setStatus("error");
        }
      });
  }, [id, hash, query, refreshUser, navigate]);

  // Auto-retry countdown for 429
  useEffect(() => {
    if (retryCountdown <= 0) return;

    timerRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          verify();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [retryCountdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    verify();
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
          {errorType === "rate_limited" ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                {t.auth.emailVerification.rateLimited(retryCountdown)}
              </h1>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                {errorType === "invalid"
                  ? t.auth.emailVerification.invalidLink
                  : t.auth.emailVerification.serverError}
              </h1>
              {errorType === "invalid" ? (
                <Button
                  variant="outline"
                  onClick={() => navigate("/", { replace: true })}
                >
                  {t.notFound.backHome}
                </Button>
              ) : (
                <Button variant="outline" onClick={verify}>
                  {t.auth.emailVerification.retry}
                </Button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
