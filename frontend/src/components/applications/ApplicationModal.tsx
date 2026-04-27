import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { useApplicationStore } from "@/stores/applicationStore";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import type { Application, CreateApplicationData } from "@/types";

interface ApplicationModalProps {
  open: boolean;
  onClose: () => void;
  application?: Application | null;
}

export function ApplicationModal({
  open,
  onClose,
  application,
}: ApplicationModalProps) {
  const [loading, setLoading] = useState(false);
  const createApplication = useApplicationStore((s) => s.createApplication);
  const updateApplication = useApplicationStore((s) => s.updateApplication);
  const clearWarning = useApplicationStore((s) => s.clearWarning);

  const isEdit = !!application;

  const handleSubmit = async (data: CreateApplicationData) => {
    setLoading(true);
    try {
      if (isEdit && application) {
        await updateApplication(application.id, data);
        toast.success(t.toast.applicationUpdated);
      } else {
        await createApplication(data);
        // Read lastWarning from store after create (avoid stale closure)
        const warning = useApplicationStore.getState().lastWarning;
        if (warning) {
          toast.warning(t.toast.duplicateDetected, {
            description: warning.message,
          });
          clearWarning();
        } else {
          toast.success(t.toast.applicationCreated);
        }
      }
      onClose();
    } catch {
      toast.error(isEdit ? t.toast.errorUpdating : t.toast.errorCreating);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t.application.editApplication
              : t.application.addApplication}
          </DialogTitle>
        </DialogHeader>
        <ApplicationForm
          application={application}
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
