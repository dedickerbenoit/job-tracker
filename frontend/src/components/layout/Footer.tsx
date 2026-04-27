import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-4 border-t bg-background px-4 py-2 text-xs text-muted-foreground">
      <Link to="/privacy" className="hover:text-primary">
        {t.footer.privacy}
      </Link>
      <span>·</span>
      <Link to="/legal" className="hover:text-primary">
        {t.footer.legal}
      </Link>
      <span>·</span>
      <span>{t.footer.copyright}</span>
    </footer>
  );
}
