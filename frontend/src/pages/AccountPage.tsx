import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  Mail,
  Pause,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { accountApi, adminApi } from "@/services/api";
import { t } from "@/lib/i18n";
import type { AdminUser, Consent } from "@/types";

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const navigate = useNavigate();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState<
    "terms" | "privacy" | null
  >(null);
  const [granting, setGranting] = useState<string | null>(null);
  const [showGrantDialog, setShowGrantDialog] = useState<
    "terms" | "privacy" | null
  >(null);
  const [reactivating, setReactivating] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [betaEmail, setBetaEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const isSuspended = !!user?.suspended_at;

  const hasActiveConsent = (type: "terms" | "privacy") =>
    consents.some((c) => c.consent_type === type && !c.revoked_at);

  const allConsentsActive =
    hasActiveConsent("terms") && hasActiveConsent("privacy");

  const loadConsents = useCallback(async () => {
    try {
      const data = await accountApi.consents();
      setConsents(data);
    } catch {
      // Silently fail — consents section will just not show data
    }
  }, []);

  const loadAdminUsers = useCallback(async () => {
    try {
      const data = await adminApi.listUsers();
      setAdminUsers(data);
    } catch {
      toast.error(t.admin.betaInvite.loadError);
    }
  }, []);

  useEffect(() => {
    loadConsents();
    if (user?.is_admin) loadAdminUsers();
  }, [loadConsents, loadAdminUsers, user?.is_admin]);

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
      // Revocation triggers auto-suspension on backend — refresh user
      await refreshUser();
    } catch {
      toast.error(t.rgpd.revokeError);
    } finally {
      setRevoking(null);
      setShowRevokeDialog(null);
    }
  };

  const handleGrant = async (consentType: "terms" | "privacy") => {
    setGranting(consentType);
    try {
      await accountApi.grantConsent(consentType);
      toast.success(t.rgpd.grantSuccess);
      // Add the new consent to local state
      setConsents((prev) => [
        ...prev,
        {
          id: Date.now(), // Temporary ID until next reload
          consent_type: consentType,
          consented_at: new Date().toISOString(),
          revoked_at: null,
        },
      ]);
    } catch {
      toast.error(t.rgpd.grantError);
    } finally {
      setGranting(null);
      setShowGrantDialog(null);
    }
  };

  const handleReactivate = async () => {
    if (!allConsentsActive) {
      toast.error(t.rgpd.reactivateMissingConsents);
      return;
    }
    setReactivating(true);
    try {
      await accountApi.reactivateAccount();
      toast.success(t.rgpd.reactivateSuccess);
      await refreshUser();
    } catch {
      toast.error(t.rgpd.reactivateError);
    } finally {
      setReactivating(false);
      setShowReactivateDialog(false);
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

  const handleSendBetaInvite = async () => {
    if (!betaEmail.trim()) return;
    setSendingInvite(true);
    try {
      await adminApi.sendBetaInvite(betaEmail.trim());
      toast.success(t.admin.betaInvite.success);
      setBetaEmail("");
      loadAdminUsers();
    } catch {
      toast.error(t.admin.betaInvite.error);
    } finally {
      setSendingInvite(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t.rgpd.myAccount}</h1>

      {/* Admin — Beta invite */}
      {user.is_admin && (
        <div className="rounded-lg border border-blue-500/30 bg-card p-6">
          <h2 className="mb-2 text-lg font-semibold">
            {t.admin.betaInvite.title}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t.admin.betaInvite.description}
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t.admin.betaInvite.emailPlaceholder}
              value={betaEmail}
              onChange={(e) => setBetaEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendBetaInvite();
              }}
              className="max-w-sm"
            />
            <Button
              onClick={handleSendBetaInvite}
              disabled={sendingInvite || !betaEmail.trim()}
            >
              <Mail className="mr-2 h-4 w-4" />
              {sendingInvite
                ? t.admin.betaInvite.sending
                : t.admin.betaInvite.send}
            </Button>
          </div>

          {/* Registered users list */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold">
              {t.admin.betaInvite.listTitle}
            </h3>
            {adminUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.admin.betaInvite.empty}
              </p>
            ) : (
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">
                        {t.admin.betaInvite.columnEmail}
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        {t.admin.betaInvite.columnName}
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        {t.admin.betaInvite.columnInvitation}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((adminUser) => (
                      <tr key={adminUser.id} className="border-b last:border-0">
                        <td className="px-3 py-2">{adminUser.email}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {adminUser.first_name} {adminUser.last_name}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              adminUser.is_beta_invitation_sent
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {adminUser.is_beta_invitation_sent
                              ? t.admin.betaInvite.invitationYes
                              : t.admin.betaInvite.invitationNo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspended account banner + reactivation */}
      {isSuspended && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-50 p-6 dark:bg-orange-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {t.rgpd.accountSuspendedBanner}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.rgpd.reactivateDescription}
              </p>
              <Button
                onClick={() => setShowReactivateDialog(true)}
                disabled={!allConsentsActive || reactivating}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {reactivating ? t.rgpd.reactivating : t.rgpd.reactivateAccount}
              </Button>
            </div>
          </div>
        </div>
      )}

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
            const isActive = hasActiveConsent(type);
            const label =
              type === "terms" ? t.rgpd.consentTerms : t.rgpd.consentPrivacy;

            return (
              <div
                key={type}
                className="flex items-center justify-between rounded border p-3"
              >
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <ShieldOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{label}</span>
                  <span
                    className={`text-xs ${isActive ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {isActive ? t.rgpd.consentActive : t.rgpd.consentRevoked}
                  </span>
                </div>
                {isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevokeDialog(type)}
                    disabled={revoking === type}
                  >
                    {revoking === type ? t.rgpd.revoking : t.rgpd.revokeConsent}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrantDialog(type)}
                    disabled={granting === type}
                    className="border-green-500/50 text-green-700 hover:bg-green-50"
                  >
                    {granting === type ? t.rgpd.granting : t.rgpd.grantConsent}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suspend account (right to restriction) — hidden when already suspended */}
      {!isSuspended && (
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
      )}

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

      {/* Grant consent confirmation dialog */}
      <Dialog
        open={showGrantDialog !== null}
        onOpenChange={() => setShowGrantDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rgpd.grantConsentConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.rgpd.grantConsentConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowGrantDialog(null)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => showGrantDialog && handleGrant(showGrantDialog)}
              disabled={granting !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {granting ? t.rgpd.granting : t.rgpd.grantConsentConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reactivate confirmation dialog */}
      <Dialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rgpd.reactivateConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.rgpd.reactivateConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowReactivateDialog(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleReactivate}
              disabled={reactivating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {reactivating ? t.rgpd.reactivating : t.rgpd.reactivateConfirm}
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
