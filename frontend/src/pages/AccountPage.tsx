import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
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

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
