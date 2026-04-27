import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const PASSWORD_RULES = [
  { key: "minLength" as const, test: (p: string) => p.length >= 8 },
  { key: "uppercase" as const, test: (p: string) => /[A-Z]/.test(p) },
  { key: "lowercase" as const, test: (p: string) => /[a-z]/.test(p) },
  { key: "digit" as const, test: (p: string) => /[0-9]/.test(p) },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const passedCount = PASSWORD_RULES.filter((rule) =>
    rule.test(password),
  ).length;

  const barColor =
    passedCount <= 1
      ? "bg-destructive"
      : passedCount === 2 || passedCount === 3
        ? "bg-warning"
        : "bg-success";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < passedCount ? barColor : "bg-muted",
            )}
          />
        ))}
      </div>

      <ul className="space-y-0.5">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li
              key={rule.key}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                passed ? "text-success" : "text-muted-foreground",
              )}
            >
              {passed ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              <span>{t.auth.passwordRules[rule.key]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
