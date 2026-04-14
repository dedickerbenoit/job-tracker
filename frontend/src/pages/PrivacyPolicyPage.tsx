import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Politique de confidentialité</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Dernière mise à jour : 14 avril 2026
      </p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-lg font-semibold">
            1. Identité du responsable de traitement
          </h2>
          <p>
            JobTracker est édité par [Votre Nom / Raison sociale], dont le siège
            social est situé à [Adresse]. Contact : [email@example.com].
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Données d'identification :</strong> prénom, nom, adresse
              e-mail
            </li>
            <li>
              <strong>Données de candidature :</strong> titre du poste,
              entreprise, localisation, URL de l'offre, description, notes
              personnelles, statut, source
            </li>
            <li>
              <strong>Données techniques :</strong> adresse IP, user-agent (lors
              de l'inscription uniquement, pour le consentement)
            </li>
            <li>
              <strong>Données de connexion :</strong> sessions, tokens
              d'authentification
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            3. Bases légales des traitements
          </h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Exécution du contrat</strong> (art. 6.1.b RGPD) : gestion
              du compte utilisateur et suivi des candidatures
            </li>
            <li>
              <strong>Consentement</strong> (art. 6.1.a RGPD) : acceptation des
              CGU et de la politique de confidentialité lors de l'inscription
            </li>
            <li>
              <strong>Intérêt légitime</strong> (art. 6.1.f RGPD) : sécurité de
              l'application, journalisation des accès
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            4. Finalités des traitements
          </h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>Création et gestion de votre compte utilisateur</li>
            <li>Suivi de vos candidatures professionnelles</li>
            <li>Statistiques personnelles sur vos candidatures</li>
            <li>Sécurité et prévention des accès non autorisés</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            5. Durées de conservation
          </h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Compte actif :</strong> données conservées tant que le
              compte est actif
            </li>
            <li>
              <strong>Après suppression :</strong> données supprimées
              définitivement 30 jours après la demande de suppression
            </li>
            <li>
              <strong>Sessions :</strong> purgées après 30 jours d'inactivité
            </li>
            <li>
              <strong>Tokens d'accès :</strong> purgés après 30 jours sans
              utilisation
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            6. Destinataires des données
          </h2>
          <p>
            Vos données ne sont transmises à aucun tiers. Elles sont uniquement
            accessibles par vous-même et les administrateurs techniques de la
            plateforme, dans le cadre strict de la maintenance.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">7. Transferts hors UE</h2>
          <p>
            Aucun transfert de données personnelles hors de l'Union Européenne
            n'est effectué.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">8. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Droit d'accès :</strong> obtenir une copie de vos données
              (export depuis votre profil)
            </li>
            <li>
              <strong>Droit de rectification :</strong> modifier vos
              informations personnelles
            </li>
            <li>
              <strong>Droit à l'effacement :</strong> supprimer votre compte et
              toutes vos données
            </li>
            <li>
              <strong>Droit à la portabilité :</strong> exporter vos données au
              format JSON
            </li>
            <li>
              <strong>Droit d'opposition :</strong> vous opposer au traitement
              de vos données
            </li>
            <li>
              <strong>Droit à la limitation :</strong> demander la limitation du
              traitement
            </li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, rendez-vous sur votre page{" "}
            <Link
              to="/dashboard/account"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Mon compte
            </Link>{" "}
            ou contactez-nous à [email@example.com].
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">9. Cookies</h2>
          <p>
            JobTracker utilise uniquement des cookies strictement nécessaires au
            fonctionnement du service (cookie de session, token CSRF). Aucun
            cookie de traçage ou publicitaire n'est utilisé.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">10. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données : chiffrement HTTPS, hachage
            des mots de passe (bcrypt), protection CSRF, rate limiting,
            validation des entrées.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">
            11. Réclamation auprès de la CNIL
          </h2>
          <p>
            Si vous estimez que le traitement de vos données ne respecte pas la
            réglementation, vous pouvez introduire une réclamation auprès de la
            CNIL :{" "}
            <a
              href="https://www.cnil.fr/fr/plaintes"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              www.cnil.fr
            </a>
            .
          </p>
        </div>
      </section>

      <div className="mt-8 border-t pt-4">
        <Link
          to="/legal"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Mentions légales
        </Link>
      </div>
    </div>
  );
}
