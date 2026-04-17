import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { CheckCircle, XCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import type { AxiosError } from "axios";

// ── Schemas ──

const loginSchema = z.object({
  email: z
    .string()
    .min(1, t.auth.validation.emailRequired)
    .email(t.auth.validation.emailInvalid),
  password: z.string().min(1, t.auth.validation.passwordRequired),
});

const registerSchema = z
  .object({
    first_name: z.string().min(1, t.auth.validation.firstNameRequired),
    last_name: z.string().min(1, t.auth.validation.lastNameRequired),
    email: z
      .string()
      .min(1, t.auth.validation.emailRequired)
      .email(t.auth.validation.emailInvalid),
    // Single unified message: per-rule feedback is shown live by
    // <PasswordStrengthIndicator/>, so the form error stays concise instead
    // of surfacing one rule at a time through a chain of .regex() validators.
    password: z.string().refine(
      (v) =>
        v.length >= 8 &&
        /[A-Z]/.test(v) &&
        /[a-z]/.test(v) &&
        /[0-9]/.test(v),
      { message: t.auth.validation.passwordComplexity },
    ),
    password_confirmation: z
      .string()
      .min(1, t.auth.validation.passwordRequired),
    accept_terms: z
      .boolean()
      .refine((v) => v === true, { message: t.rgpd.termsRequired }),
    accept_privacy: z
      .boolean()
      .refine((v) => v === true, { message: t.rgpd.privacyRequired }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: t.auth.validation.passwordMismatch,
    path: ["password_confirmation"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

// ── Helper: parse Laravel 422 errors ──

interface LaravelValidationError {
  errors?: Record<string, string[]>;
  message?: string;
}

function parseLaravelErrors(error: unknown): Record<string, string> | null {
  const axiosError = error as AxiosError<LaravelValidationError>;
  if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
    const parsed: Record<string, string> = {};
    for (const [field, messages] of Object.entries(
      axiosError.response.data.errors,
    )) {
      parsed[field] = messages[0];
    }
    return parsed;
  }
  return null;
}

// ── Login Form ──

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginValues) => {
    setLoading(true);
    try {
      await login(data);
    } catch (error) {
      const fieldErrors = parseLaravelErrors(error);
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof LoginValues, { message });
        }
      } else {
        setError("email", { message: t.auth.invalidCredentials });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">{t.auth.email}</Label>
        <Input
          id="login-email"
          type="email"
          {...register("email")}
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password">{t.auth.password}</Label>
        <Input
          id="login-password"
          type="password"
          {...register("password")}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t.auth.loggingIn : t.auth.loginAction}
      </Button>
    </form>
  );
}

// ── Register Form ──

function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const registerUser = useAuthStore((s) => s.register);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const passwordValue = watch("password", "");
  const confirmValue = watch("password_confirmation", "");

  const onSubmit = async (data: RegisterValues) => {
    setLoading(true);
    try {
      await registerUser(data);
    } catch (error) {
      const fieldErrors = parseLaravelErrors(error);
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof RegisterValues, { message });
        }
      } else {
        setError("email", { message: t.auth.registerError });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="register-first-name">{t.auth.firstName}</Label>
          <Input
            id="register-first-name"
            {...register("first_name")}
            placeholder={t.auth.firstNamePlaceholder}
            autoComplete="given-name"
          />
          {errors.first_name && (
            <p className="text-xs text-destructive">
              {errors.first_name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-last-name">{t.auth.lastName}</Label>
          <Input
            id="register-last-name"
            {...register("last_name")}
            placeholder={t.auth.lastNamePlaceholder}
            autoComplete="family-name"
          />
          {errors.last_name && (
            <p className="text-xs text-destructive">
              {errors.last_name.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-email">{t.auth.email}</Label>
        <Input
          id="register-email"
          type="email"
          {...register("email")}
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-password">{t.auth.password}</Label>
        <Input
          id="register-password"
          type="password"
          {...register("password")}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="new-password"
        />
        <PasswordStrengthIndicator password={passwordValue} />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-password-confirm">
          {t.auth.passwordConfirmation}
        </Label>
        <Input
          id="register-password-confirm"
          type="password"
          {...register("password_confirmation")}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="new-password"
        />
        {confirmValue && (
          <p
            className={`flex items-center gap-1.5 text-xs ${
              confirmValue === passwordValue
                ? "text-success"
                : "text-destructive"
            }`}
          >
            {confirmValue === passwordValue ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                {t.auth.validation.passwordMatch}
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                {t.auth.validation.passwordMismatch}
              </>
            )}
          </p>
        )}
        {errors.password_confirmation && (
          <p className="text-xs text-destructive">
            {errors.password_confirmation.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            {...register("accept_terms")}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            {/* stopPropagation prevents the surrounding <label>'s click
                from toggling the checkbox when the user follows the link. */}
            <Link
              to="/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t.rgpd.acceptTerms}
            </Link>
          </span>
        </label>
        {errors.accept_terms && (
          <p className="text-xs text-destructive">
            {errors.accept_terms.message}
          </p>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            {...register("accept_privacy")}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t.rgpd.acceptPrivacy}
            </Link>
          </span>
        </label>
        {errors.accept_privacy && (
          <p className="text-xs text-destructive">
            {errors.accept_privacy.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t.auth.registering : t.auth.registerAction}
      </Button>
    </form>
  );
}

// ── Modal ──

export function AuthModal() {
  const showAuthModal = useAuthStore((s) => s.showAuthModal);
  const authModalTab = useAuthStore((s) => s.authModalTab);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  return (
    <Dialog open={showAuthModal} onOpenChange={(v) => !v && closeAuthModal()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {authModalTab === "login" ? t.auth.login : t.auth.register}
          </DialogTitle>
        </DialogHeader>

        {authModalTab === "login" ? <LoginForm /> : <RegisterForm />}

        <div className="text-center text-sm text-muted-foreground">
          {authModalTab === "login" ? (
            <p>
              {t.auth.noAccount}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => openAuthModal("register")}
              >
                {t.auth.createAccount}
              </button>
            </p>
          ) : (
            <p>
              {t.auth.hasAccount}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => openAuthModal("login")}
              >
                {t.auth.loginLink}
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
