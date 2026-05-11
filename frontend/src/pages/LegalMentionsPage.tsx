import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { t } from "@/lib/i18n";

export default function LegalMentionsPage() {
  const s = t.legal.sections;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Helmet>
        <title>{t.seo.legal.title}</title>
        <meta name="description" content={t.seo.legal.description} />
        <link rel="canonical" href={`${t.seo.siteUrl}/legal`} />
        <meta property="og:title" content={t.seo.legal.title} />
        <meta property="og:description" content={t.seo.legal.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${t.seo.siteUrl}/legal`} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <h1 className="mb-8 text-3xl font-bold">{t.legal.pageTitle}</h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.publisher.title}</h2>
          <p>
            {s.publisher.editedBy}
            {s.publisher.headOffice && (
              <>
                <br />
                {s.publisher.headOffice}
              </>
            )}
            {s.publisher.siret && (
              <>
                <br />
                {s.publisher.siret}
              </>
            )}
            {s.publisher.contact && (
              <>
                <br />
                {s.publisher.contact}
              </>
            )}
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            {s.publicationDirector.title}
          </h2>
          <p>{s.publicationDirector.value}</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.hosting.title}</h2>
          <p>
            {s.hosting.name}
            <br />
            {s.hosting.address}
            <br />
            {s.hosting.phone}
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            {s.intellectualProperty.title}
          </h2>
          <p>{s.intellectualProperty.content}</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            {s.dataProtection.title}
          </h2>
          <p>
            {s.dataProtection.contentPrefix}
            <Link
              to="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {s.dataProtection.linkLabel}
            </Link>
            {s.dataProtection.contentSuffix}
          </p>
        </div>
      </section>

      <div className="mt-8 border-t pt-4">
        <Link
          to="/privacy"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {t.legal.seePrivacy}
        </Link>
      </div>
    </div>
  );
}
