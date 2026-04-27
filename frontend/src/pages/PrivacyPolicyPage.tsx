import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";

export default function PrivacyPolicyPage() {
  const s = t.privacy.sections;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t.privacy.pageTitle}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {t.privacy.lastUpdated}
      </p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.controller.title}</h2>
          <p>{s.controller.content}</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.collected.title}</h2>
          <p>{s.collected.intro}</p>
          <ul className="ml-6 list-disc space-y-1">
            {s.collected.items.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong> {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.legalBasis.title}</h2>
          <ul className="ml-6 list-disc space-y-1">
            {s.legalBasis.items.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.purposes.title}</h2>
          <ul className="ml-6 list-disc space-y-1">
            {s.purposes.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.retention.title}</h2>
          <ul className="ml-6 list-disc space-y-1">
            {s.retention.items.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.recipients.title}</h2>
          <p>{s.recipients.content}</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.transfers.title}</h2>
          <p>{s.transfers.content}</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.rights.title}</h2>
          <p>{s.rights.intro}</p>
          <ul className="ml-6 list-disc space-y-1">
            {s.rights.items.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                {item.text}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            {s.rights.exercisePrefix}
            <Link
              to="/dashboard/account"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {s.rights.accountLink}
            </Link>
            {s.rights.exerciseSuffix}
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.cookies.title}</h2>
          <p>{s.cookies.content}</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.security.title}</h2>
          <p>{s.security.content}</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">{s.cnil.title}</h2>
          <p>
            {s.cnil.contentPrefix}
            <a
              href="https://www.cnil.fr/fr/plaintes"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {s.cnil.linkLabel}
            </a>
            {s.cnil.contentSuffix}
          </p>
        </div>
      </section>

      <div className="mt-8 border-t pt-4">
        <Link
          to="/legal"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {t.privacy.seeLegal}
        </Link>
      </div>
    </div>
  );
}
