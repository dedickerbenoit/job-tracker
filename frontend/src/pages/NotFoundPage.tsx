import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Helmet>
        <title>{t.seo.notFound.title}</title>
        <meta name="description" content={t.seo.notFound.description} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {t.notFound.description}
      </p>
      <Link to="/" className="mt-8">
        <Button size="lg">{t.notFound.backHome}</Button>
      </Link>
    </div>
  );
}
