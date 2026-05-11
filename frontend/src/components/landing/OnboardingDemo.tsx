import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import {
  Sparkles,
  ArrowRight,
  X,
  Table,
  FileText,
  Mail,
  Brain,
  Plus,
  Zap,
  Check,
  Columns3,
  Heart,
  Clock,
} from "lucide-react";
import { ChromeIcon } from "@/components/icons/ChromeIcon";

// ── Types ──

interface Application {
  title: string;
  company: string;
  location: string;
  source: "linkedin" | "manual";
}

// ── Dialog-style shell (matches shadcn Dialog look) ──

function DialogShell({
  icon: HeaderIcon,
  title,
  description,
  stepBadge,
  children,
  footer,
  onReset,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  stepBadge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onReset?: () => void;
}) {
  return (
    <div className="glow relative grid gap-4 rounded-xl border bg-card p-4 text-sm">
      {onReset && (
        <button
          onClick={onReset}
          aria-label="Recommencer"
          className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
        >
          <X className="size-3.5" />
        </button>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HeaderIcon className="size-5" />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg font-medium leading-none tracking-tight">
              {title}
            </h3>
            {stepBadge && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                {stepBadge}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm leading-snug text-muted-foreground">
          {description}
        </p>
      </div>

      {children}

      {footer && (
        <div className="-mx-4 -mb-4 flex flex-col gap-2 rounded-b-xl border-t bg-muted/50 p-4">
          {footer}
        </div>
      )}
    </div>
  );
}

function MutedNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-muted/60 px-3 py-2 text-center text-xs italic text-muted-foreground">
      {children}
    </p>
  );
}

// ── Step 1: Diagnostic ──

function DiagnosticStep({
  choice,
  setChoice,
  onNext,
}: {
  choice: string | null;
  setChoice: (v: string) => void;
  onNext: () => void;
}) {
  const options = [
    {
      id: "spreadsheet",
      label: t.landing.onboarding.step1.optSpreadsheet,
      icon: Table,
      pain: t.landing.onboarding.step1.painSpreadsheet,
    },
    {
      id: "notes",
      label: t.landing.onboarding.step1.optNotes,
      icon: FileText,
      pain: t.landing.onboarding.step1.painNotes,
    },
    {
      id: "email",
      label: t.landing.onboarding.step1.optEmail,
      icon: Mail,
      pain: t.landing.onboarding.step1.painEmail,
    },
    {
      id: "memory",
      label: t.landing.onboarding.step1.optMemory,
      icon: Brain,
      pain: t.landing.onboarding.step1.painMemory,
    },
  ];

  return (
    <DialogShell
      icon={Sparkles}
      stepBadge="1 / 3"
      title={t.landing.onboarding.step1.title}
      description={t.landing.onboarding.step1.description}
      footer={
        <Button
          size="lg"
          onClick={onNext}
          disabled={!choice}
          className="w-full"
        >
          {t.landing.onboarding.step1.cta} <ArrowRight className="size-4" />
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = choice === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setChoice(opt.id)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              <opt.icon className="size-4.5 shrink-0" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {choice && (
        <MutedNote>
          <b>{options.find((o) => o.id === choice)!.pain}</b>
          {t.landing.onboarding.step1.painSuffix}
        </MutedNote>
      )}
    </DialogShell>
  );
}

// ── Step 2: Add an application ──

function AddStep({
  setApplication,
  onNext,
}: {
  setApplication: (app: Application) => void;
  onNext: () => void;
}) {
  const [method, setMethod] = useState<"extension" | "manual" | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", location: "" });

  const SAMPLE: Application = {
    title: t.landing.onboarding.sampleTitle,
    company: t.landing.onboarding.sampleCompany,
    location: t.landing.onboarding.sampleLocation,
    source: "linkedin",
  };

  const importFromLinkedIn = () => {
    setImporting(true);
    setTimeout(() => {
      setApplication(SAMPLE);
      setImporting(false);
      setImported(true);
    }, 1400);
  };

  // Method selection screen
  if (!method) {
    return (
      <DialogShell
        icon={Plus}
        stepBadge="2 / 3"
        title={t.landing.onboarding.step2.title}
        description={t.landing.onboarding.step2.description}
      >
        <div className="grid gap-2">
          <button
            onClick={() => setMethod("extension")}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-3 text-left transition-colors hover:border-primary"
          >
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <ChromeIcon className="size-4.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {t.landing.onboarding.step2.methodExtension}
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                  {t.landing.onboarding.step2.methodExtensionBadge}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.landing.onboarding.step2.methodExtensionDesc}
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => setMethod("manual")}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-3 text-left transition-colors hover:border-primary"
          >
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-muted">
              <Plus className="size-4.5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {t.landing.onboarding.step2.methodManual}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.landing.onboarding.step2.methodManualDesc}
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </DialogShell>
    );
  }

  // Extension mock
  if (method === "extension") {
    return (
      <DialogShell
        icon={ChromeIcon}
        stepBadge="2 / 3"
        title={t.landing.onboarding.step2.extensionTitle}
        description={t.landing.onboarding.step2.extensionDesc}
        footer={
          imported ? (
            <Button size="lg" className="w-full" onClick={onNext}>
              {t.landing.onboarding.step2.extensionNext}{" "}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <MutedNote>{t.landing.onboarding.step2.extensionHint}</MutedNote>
          )
        }
      >
        {/* LinkedIn mock */}
        <div className="overflow-hidden rounded-[10px] border bg-card">
          {/* Browser bar */}
          <div className="flex items-center gap-1.5 border-b bg-muted px-2.5 py-1.5">
            <span className="size-2 rounded-full bg-[#ef4444]" />
            <span className="size-2 rounded-full bg-[#f59e0b]" />
            <span className="size-2 rounded-full bg-[#22c55e]" />
            <div className="font-mono-jb ml-2 flex-1 rounded-md bg-background px-2.5 py-0.5 text-[10px] text-muted-foreground">
              linkedin.com/jobs/view/4256781
            </div>
          </div>

          <div className="relative p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-[#635BFF] to-[#00D4FF] text-sm font-bold text-white">
                S
              </div>
              <div>
                <div className="text-[13px] font-semibold">
                  {t.landing.onboarding.sampleTitle}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t.landing.onboarding.sampleCompany} ·{" "}
                  {t.landing.onboarding.sampleLocation} · Il y a 2 jours
                </div>
              </div>
            </div>
            {/* Skeleton lines */}
            <div className="mt-2.5 flex gap-1.5">
              <div className="h-1.25 flex-1 rounded-full bg-muted" />
              <div className="h-1.25 flex-[0.7] rounded-full bg-muted" />
            </div>
            <div className="mt-1.5 h-1.25 w-[85%] rounded-full bg-muted" />
            <div className="mt-1.5 h-1.25 w-[60%] rounded-full bg-muted" />

            {/* Save button */}
            {!imported && (
              <div
                className={`absolute right-2.5 top-2.5 rounded-(--radius) ${importing ? "" : "pulse-ring"}`}
              >
                <Button
                  size="sm"
                  onClick={importFromLinkedIn}
                  disabled={importing}
                  className={`bg-[#3b82f6] text-white hover:bg-[#2563eb] ${importing ? "cursor-wait" : ""}`}
                >
                  {importing ? (
                    <>
                      <span className="inline-block size-2.75 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t.landing.onboarding.step2.extensionImporting}
                    </>
                  ) : (
                    <>
                      <Zap className="size-3.25" fill="currentColor" />
                      {t.landing.onboarding.step2.extensionSaveBtn}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Saved badge */}
            {imported && (
              <div className="float-up absolute right-2.5 top-2.5 inline-flex h-9 items-center gap-1.5 rounded-(--radius) border border-success/30 bg-success/15 px-3 text-[13px] font-medium text-success">
                <Check className="size-3.5" strokeWidth={3} />
                {t.landing.onboarding.step2.extensionSaved}
              </div>
            )}
          </div>
        </div>
      </DialogShell>
    );
  }

  // Manual form
  const valid = form.title && form.company && form.location;
  const submit = () => {
    setApplication({ ...form, source: "manual" });
    onNext();
  };

  return (
    <DialogShell
      icon={Plus}
      stepBadge="2 / 3"
      title={t.landing.onboarding.step2.manualTitle}
      description={t.landing.onboarding.step2.manualDesc}
      footer={
        <>
          <Button
            size="lg"
            onClick={submit}
            disabled={!valid}
            className="w-full"
          >
            {t.landing.onboarding.step2.manualAdd}{" "}
            <ArrowRight className="size-4" />
          </Button>
          <button
            onClick={() =>
              setForm({
                title: t.landing.onboarding.sampleTitle,
                company: t.landing.onboarding.sampleCompany,
                location: t.landing.onboarding.sampleLocation,
              })
            }
            className="text-center text-xs text-muted-foreground underline hover:text-foreground"
          >
            {t.landing.onboarding.step2.manualPrefill}
          </button>
        </>
      }
    >
      <div className="grid gap-2.5">
        {[
          {
            key: "title" as const,
            label: t.landing.onboarding.step2.fieldTitle,
            placeholder: t.landing.onboarding.sampleTitle,
          },
          {
            key: "company" as const,
            label: t.landing.onboarding.step2.fieldCompany,
            placeholder: t.landing.onboarding.sampleCompany,
          },
          {
            key: "location" as const,
            label: t.landing.onboarding.step2.fieldLocation,
            placeholder: t.landing.onboarding.sampleLocation,
          },
        ].map((f) => (
          <div key={f.key}>
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            <Input
              className="mt-1"
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </DialogShell>
  );
}

// ── Step 3: Pipeline animation ──

function PipelineStep({
  application,
  onFinish,
}: {
  application: Application;
  onFinish: () => void;
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= 2) return;
    const timer = setTimeout(() => setStage((s) => s + 1), 1700);
    return () => clearTimeout(timer);
  }, [stage]);

  const columns = [
    {
      id: "to_apply",
      label: t.landing.onboarding.colToApply,
      color: "var(--status-to-apply, #64748b)",
    },
    {
      id: "applied",
      label: t.landing.onboarding.colApplied,
      color: "var(--status-applied, #3b82f6)",
    },
    {
      id: "interview",
      label: t.landing.onboarding.colInterview,
      color: "var(--status-interview, #2563eb)",
    },
    {
      id: "offer",
      label: t.landing.onboarding.colOffer,
      color: "var(--status-offer, #22c55e)",
    },
  ];

  const userColIdx = stage === 0 ? 1 : stage === 1 ? 2 : 3;
  const ghostCounts = [3, 2, 1, 0];

  const titles = t.landing.onboarding.step3.titles;
  const subs = t.landing.onboarding.step3.subtitles;
  const notes = t.landing.onboarding.step3.notes;

  return (
    <DialogShell
      icon={stage === 2 ? Heart : Columns3}
      stepBadge="3 / 3"
      title={titles[stage]}
      description={subs[stage]}
      footer={
        stage === 2 ? (
          <>
            <Button size="lg" onClick={onFinish} className="w-full">
              {t.landing.onboarding.step3.ctaFinish}{" "}
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              {t.landing.onboarding.step3.ctaFinishCaption}
            </p>
          </>
        ) : (
          <button
            onClick={() => setStage(2)}
            className="text-center text-xs text-muted-foreground underline hover:text-foreground"
          >
            {t.landing.onboarding.step3.ctaSkip}
          </button>
        )
      }
    >
      {/* Mini Kanban */}
      <div className="grid min-h-55 grid-cols-4 gap-1.5 rounded-[10px] bg-muted p-2.5">
        {columns.map((col, idx) => (
          <div key={col.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1 py-0.5">
              <div className="flex items-center gap-1">
                <span
                  className="size-1.25 rounded-full"
                  style={{ background: col.color }}
                />
                <span className="text-[9px] font-semibold">{col.label}</span>
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground">
                {ghostCounts[idx] + (idx === userColIdx ? 1 : 0)}
              </span>
            </div>

            {/* User card */}
            {idx === userColIdx && (
              <div
                key={`user-${stage}`}
                className="float-up relative rounded-md bg-card p-1.75"
                style={{
                  border: `1.5px solid ${col.color}`,
                  boxShadow: `0 4px 12px ${col.color}33`,
                }}
              >
                <div className="text-[10px] font-semibold leading-tight">
                  {application.title}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                  {application.source === "linkedin" && (
                    <LinkedInIcon size={11} />
                  )}
                  {application.company}
                </div>
                <div
                  className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full text-white"
                  style={{ background: col.color }}
                >
                  <Sparkles className="size-2" fill="white" />
                </div>
              </div>
            )}

            {/* Ghost cards */}
            {Array.from({ length: ghostCounts[idx] }).map((_, j) => (
              <div key={j} className="rounded-md border bg-card p-1.75">
                <div className="h-1 w-3/4 rounded bg-muted" />
                <div className="mt-1 h-0.75 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Status note */}
      <MutedNote>
        <Clock className="mr-1 inline size-2.75 align-[-2px]" />
        {stage === 0 && (
          <>
            {notes[0]}
            <b>{application.company}</b>
          </>
        )}
        {stage === 1 && notes[1]}
        {stage === 2 && notes[2]}
      </MutedNote>
    </DialogShell>
  );
}

// ── LinkedIn SVG icon ──

function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

// ── Main Wrapper ──

export function OnboardingDemo({ onAccount }: { onAccount: () => void }) {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);

  const reset = () => {
    setStep(0);
    setChoice(null);
    setApplication(null);
  };

  return (
    <div>
      {/* Progress bars */}
      <div className="mb-2.5 flex gap-1.5 px-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-0.75 flex-1 rounded-full transition-colors duration-300 ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <DiagnosticStep
          choice={choice}
          setChoice={setChoice}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <AddStep setApplication={setApplication} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <PipelineStep
          application={
            application || {
              title: t.landing.onboarding.sampleTitle,
              company: t.landing.onboarding.sampleCompany,
              location: t.landing.onboarding.sampleLocation,
              source: "linkedin",
            }
          }
          onFinish={onAccount}
        />
      )}

      {step > 0 && (
        <button
          onClick={reset}
          className="mx-auto mt-2.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <X className="size-2.75" />
          {t.landing.onboarding.reset}
        </button>
      )}
    </div>
  );
}
