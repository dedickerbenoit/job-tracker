import { Link } from "react-router-dom";

export default function LegalMentionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Mentions légales</h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-lg font-semibold">1. Éditeur du site</h2>
          <p>
            JobTracker est édité par [Votre Nom / Raison sociale].
            <br />
            Siège social : [Adresse complète]
            <br />
            SIRET : [Numéro SIRET]
            <br />
            Contact : [email@example.com]
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            2. Directeur de la publication
          </h2>
          <p>[Nom du directeur de la publication]</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">3. Hébergement</h2>
          <p>
            [Nom de l'hébergeur]
            <br />
            [Adresse de l'hébergeur]
            <br />
            [Téléphone de l'hébergeur]
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            4. Propriété intellectuelle
          </h2>
          <p>
            L'ensemble du contenu de ce site (textes, images, code source) est
            protégé par le droit d'auteur. Toute reproduction, même partielle,
            est interdite sans autorisation préalable de l'éditeur.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            5. Protection des données personnelles
          </h2>
          <p>
            Pour en savoir plus sur la collecte et le traitement de vos données,
            consultez notre{" "}
            <Link
              to="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </section>

      <div className="mt-8 border-t pt-4">
        <Link
          to="/privacy"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Politique de confidentialité
        </Link>
      </div>
    </div>
  );
}
