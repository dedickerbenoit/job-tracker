import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChromeIcon } from "@/components/icons/ChromeIcon";
import { t } from "@/lib/i18n";

interface ExtensionComingSoonModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExtensionComingSoonModal({
  open,
  onClose,
}: ExtensionComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
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
        <DialogFooter>
          <DialogClose render={<Button className="w-full" />}>
            {t.extension.comingSoon.close}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
