import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/lib/i18n';
import type { AxiosError } from 'axios';

// ── Schemas ──

const loginSchema = z.object({
  email: z.string().min(1, t.auth.validation.emailRequired).email(t.auth.validation.emailInvalid),
  password: z.string().min(1, t.auth.validation.passwordRequired),
});

const registerSchema = z.object({
  first_name: z.string().min(1, t.auth.validation.firstNameRequired),
  last_name: z.string().min(1, t.auth.validation.lastNameRequired),
  email: z.string().min(1, t.auth.validation.emailRequired).email(t.auth.validation.emailInvalid),
  password: z.string().min(8, t.auth.validation.passwordMin),
  password_confirmation: z.string().min(1, t.auth.validation.passwordRequired),
}).refine((data) => data.password === data.password_confirmation, {
  message: t.auth.validation.passwordMismatch,
  path: ['password_confirmation'],
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
    for (const [field, messages] of Object.entries(axiosError.response.data.errors)) {
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
        setError('email', { message: t.auth.invalidCredentials });
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
          {...register('email')}
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password">{t.auth.password}</Label>
        <Input
          id="login-password"
          type="password"
          {...register('password')}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="current-password"
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
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
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

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
        setError('email', { message: t.auth.registerError });
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
            {...register('first_name')}
            placeholder={t.auth.firstNamePlaceholder}
            autoComplete="given-name"
          />
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-last-name">{t.auth.lastName}</Label>
          <Input
            id="register-last-name"
            {...register('last_name')}
            placeholder={t.auth.lastNamePlaceholder}
            autoComplete="family-name"
          />
          {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-email">{t.auth.email}</Label>
        <Input
          id="register-email"
          type="email"
          {...register('email')}
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-password">{t.auth.password}</Label>
        <Input
          id="register-password"
          type="password"
          {...register('password')}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="new-password"
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-password-confirm">{t.auth.passwordConfirmation}</Label>
        <Input
          id="register-password-confirm"
          type="password"
          {...register('password_confirmation')}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="new-password"
        />
        {errors.password_confirmation && (
          <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {authModalTab === 'login' ? t.auth.login : t.auth.register}
          </DialogTitle>
        </DialogHeader>

        {authModalTab === 'login' ? <LoginForm /> : <RegisterForm />}

        <div className="text-center text-sm text-muted-foreground">
          {authModalTab === 'login' ? (
            <p>
              {t.auth.noAccount}{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => openAuthModal('register')}
              >
                {t.auth.createAccount}
              </button>
            </p>
          ) : (
            <p>
              {t.auth.hasAccount}{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => openAuthModal('login')}
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
