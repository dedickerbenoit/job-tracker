import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApplicationStore } from "@/stores/applicationStore";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import type { Application } from "@/types";

interface DeleteConfirmModalProps {
  application: Application;
  open: boolean;
  onClose: () => void;
}

export function DeleteConfirmModal({
  application,
  open,
  onClose,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const deleteApplication = useApplicationStore((s) => s.deleteApplication);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteApplication(application.id);
      toast.success(t.toast.applicationDeleted);
      onClose();
    } catch {
      toast.error(t.toast.errorDeleting);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.deleteModal.title}</DialogTitle>
          <DialogDescription>
            {t.deleteModal.description(application.title, application.company)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? t.common.deleting : t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
