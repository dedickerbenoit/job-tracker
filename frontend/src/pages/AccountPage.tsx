import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Pause, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { accountApi } from "@/services/api";
import { t } from "@/lib/i18n";
import type { Consent } from "@/types";

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState<
    "terms" | "privacy" | null
  >(null);
  const [exporting, setExporting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadConsents = useCallback(async () => {
    try {
      const data = await accountApi.consents();
      setConsents(data);
    } catch {
      // Silently fail — consents section will just not show data
    }
  }, []);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const handleRevoke = async (consentType: "terms" | "privacy") => {
    setRevoking(consentType);
    try {
      await accountApi.revokeConsent(consentType);
      toast.success(t.rgpd.revokeSuccess);
      setConsents((prev) =>
        prev.map((c) =>
          c.consent_type === consentType && !c.revoked_at
            ? { ...c, revoked_at: new Date().toISOString() }
            : c,
        ),
      );
    } catch {
      toast.error(t.rgpd.revokeError);
    } finally {
      setRevoking(null);
      setShowRevokeDialog(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await accountApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobtracker-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t.rgpd.exportSuccess);
    } catch {
      toast.error(t.rgpd.exportError);
    } finally {
      setExporting(false);
    }
  };

  const handleSuspend = async () => {
    setSuspending(true);
    try {
      await accountApi.suspendAccount();
      toast.success(t.rgpd.suspendSuccess);
      clearAuth();
      navigate("/");
    } catch {
      toast.error(t.rgpd.suspendError);
    } finally {
      setSuspending(false);
      setShowSuspendDialog(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await accountApi.deleteAccount();
      toast.success(t.rgpd.deleteSuccess);
      clearAuth();
      navigate("/");
    } catch {
      toast.error(t.rgpd.deleteError);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t.rgpd.myAccount}</h1>

      {/* Personal info */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">{t.rgpd.personalInfo}</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">
              {t.rgpd.firstName}
            </dt>
            <dd className="font-medium">{user.first_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t.rgpd.lastName}</dt>
            <dd className="font-medium">{user.last_name}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">{t.rgpd.email}</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>
      </div>

      {/* Data export */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">{t.rgpd.exportData}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.rgpd.exportDescription}
        </p>
        <Button onClick={handleExport} disabled={exporting} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {exporting ? t.rgpd.exporting : t.rgpd.exportData}
        </Button>
      </div>

      {/* Consent management */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">{t.rgpd.consents}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.rgpd.consentsDescription}
        </p>
        <div className="space-y-3">
          {(["terms", "privacy"] as const).map((type) => {
            const consent = consents.find(
              (c) => c.consent_type === type && !c.revoked_at,
            );
            const isRevoked = !consent;
            const label =
              type === "terms" ? t.rgpd.consentTerms : t.rgpd.consentPrivacy;

            return (
              <div
                key={type}
                className="flex items-center justify-between rounded border p-3"
              >
                <div className="flex items-center gap-2">
                  {isRevoked ? (
                    <ShieldOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium">{label}</span>
                  <span
                    className={`text-xs ${isRevoked ? "text-muted-foreground" : "text-green-600"}`}
                  >
                    {isRevoked ? t.rgpd.consentRevoked : t.rgpd.consentActive}
                  </span>
                </div>
                {!isRevoked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevokeDialog(type)}
                    disabled={revoking === type}
                  >
                    {revoking === type ? t.rgpd.revoking : t.rgpd.revokeConsent}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suspend account (right to restriction) */}
      <div className="rounded-lg border border-orange-500/30 bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold text-orange-600">
          {t.rgpd.suspendAccount}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.rgpd.suspendDescription}
        </p>
        <Button
          variant="outline"
          className="border-orange-500/50 text-orange-600 hover:bg-orange-50"
          onClick={() => setShowSuspendDialog(true)}
        >
          <Pause className="mr-2 h-4 w-4" />
          {t.rgpd.suspendAccount}
        </Button>
      </div>

      {/* Delete account */}
      <div className="rounded-lg border border-destructive/30 bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold text-destructive">
          {t.rgpd.deleteAccount}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.rgpd.deleteDescription}
        </p>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t.rgpd.deleteAccount}
        </Button>
      </div>

      {/* Revoke consent confirmation dialog */}
      <Dialog
        open={showRevokeDialog !== null}
        onOpenChange={() => setShowRevokeDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rgpd.revokeConsentConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.rgpd.revokeConsentConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowRevokeDialog(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => showRevokeDialog && handleRevoke(showRevokeDialog)}
              disabled={revoking !== null}
            >
              {revoking ? t.rgpd.revoking : t.rgpd.revokeConsentConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend confirmation dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rgpd.suspendConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.rgpd.suspendConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSuspend}
              disabled={suspending}
            >
              {suspending ? t.rgpd.suspending : t.rgpd.suspendConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rgpd.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.rgpd.deleteConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t.rgpd.deleting : t.rgpd.deleteConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
