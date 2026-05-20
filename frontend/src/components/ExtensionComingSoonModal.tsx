import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChromeIcon } from "@/components/icons/ChromeIcon";
import { t } from "@/lib/i18n";
import { betaApi } from "@/services/api";

interface ExtensionComingSoonModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExtensionComingSoonModal({
  open,
  onClose,
}: ExtensionComingSoonModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      await betaApi.signup(email.trim());
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after dialog close animation
    setTimeout(() => {
      setEmail("");
      setStatus("idle");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ChromeIcon className="size-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">
              {t.extension.comingSoon.title}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t.extension.comingSoon.description}
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground italic">
          {t.extension.comingSoon.status}
        </p>

        {status === "success" ? (
          <p className="text-center text-sm font-medium text-green-600">
            {t.extension.comingSoon.success}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              required
              placeholder={t.extension.comingSoon.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={status === "loading"}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={status === "loading"}>
              {status === "loading"
                ? t.extension.comingSoon.submitting
                : t.extension.comingSoon.submit}
            </Button>
          </form>
        )}

        {status === "error" && (
          <p className="text-center text-xs text-destructive">
            {t.extension.comingSoon.error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
