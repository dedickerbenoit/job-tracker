/**
 * French translations — single file, nested by domain.
 * Import via `import { t } from '@/lib/i18n'`
 */

const fr = {
  seo: {
    siteUrl: "https://jobtracker-bd.fly.dev",
    landing: {
      title: "JobTracker — Organisez votre recherche d'emploi",
      description:
        "Suivez vos candidatures, entretiens et offres en un seul endroit avec le kanban et la timeline JobTracker. Gratuit et sans limite.",
    },
    privacy: {
      title: "Politique de confidentialité — JobTracker",
      description:
        "Découvrez comment JobTracker protège vos données personnelles : collecte, stockage, droits RGPD et cookies.",
    },
    legal: {
      title: "Mentions légales — JobTracker",
      description:
        "Mentions légales de JobTracker : éditeur, hébergeur, propriété intellectuelle et protection des données.",
    },
    notFound: {
      title: "Page introuvable — JobTracker",
      description:
        "La page que vous recherchez n'existe pas ou a été déplacée.",
    },
  },

  common: {
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement...",
    add: "Ajouter",
    edit: "Modifier",
    delete: "Supprimer",
    deleting: "Suppression...",
    confirm: "Confirmer",
    reset: "Réinitialiser",
    loading: "Chargement...",
    searching: "Recherche...",
    previous: "Précédent",
    next: "Suivant",
    page: "Page",
    noData: "Aucune donnée",
    actions: "Actions",
  },

  status: {
    to_apply: "À postuler",
    applied: "Postulé",
    follow_up: "Relance",
    interview: "Entretien",
    offer: "Offre reçue",
    rejected: "Refusé",
    allStatuses: "Tous les statuts",
  },

  source: {
    linkedin: "LinkedIn",
    indeed: "Indeed",
    hellowork: "HelloWork",
    manual: "Manuel",
    allSources: "Toutes les sources",
  },

  event: {
    created: "Créée",
    status_changed: "Statut modifié",
    updated: "Mise à jour",
    deleted: "Supprimée",
    allTypes: "Tous les types",
  },

  application: {
    singular: "candidature",
    plural: "candidatures",
    none: "Aucune candidature",
    noneFound: "Aucune candidature trouvée",
    noEvent: "Aucun événement",
    addApplication: "Ajouter une candidature",
    editApplication: "Modifier la candidature",
    description: "Description",
    notes: "Notes",
    history: "Historique",
    addedAgo: "Ajoutée",
    appliedOn: "Postulée le",
    location: "Localisation",
    emptyState: "Aucune candidature ici.",
    emptyStateAction: "Ajoutez votre première offre !",
  },

  form: {
    jobTitle: "Titre du poste *",
    jobTitlePlaceholder: "Développeur Full Stack",
    company: "Entreprise *",
    location: "Localisation *",
    locationPlaceholder: "Paris, France",
    jobUrl: "URL de l'offre *",
    descriptionPlaceholder: "Description de l'offre...",
    personalNotes: "Notes personnelles",
    notesPlaceholder: "Vos notes...",
    validation: {
      titleRequired: "Le titre est requis",
      companyRequired: "L'entreprise est requise",
      locationRequired: "La localisation est requise",
      urlRequired: "L'URL est requise",
      urlInvalid: "L'URL n'est pas valide",
    },
  },

  toast: {
    applicationCreated: "Candidature ajoutée",
    applicationUpdated: "Candidature mise à jour",
    applicationDeleted: "Candidature supprimée",
    duplicateDetected: "Doublon détecté",
    errorLoading: "Erreur lors du chargement des candidatures",
    errorCreating: "Erreur lors de l'ajout",
    errorUpdating: "Erreur lors de la mise à jour",
    errorDeleting: "Erreur lors de la suppression",
    errorStatusChange: "Erreur lors du changement de statut",
  },

  kanban: {
    confirmRejectTitle: "Confirmer le refus ?",
    confirmRejectDescription: (title: string, company: string) =>
      `Voulez-vous marquer ${title} chez ${company} comme refusée ?`,
    confirmReject: "Confirmer le refus",
    showRejected: "Voir les refusés",
    hideRejected: "Masquer les refusés",
    followUpBadge: "Relance",
    rejectedCount: (count: number) => `${count} refusée${count > 1 ? "s" : ""}`,
  },

  quickActions: {
    changeStatus: "Changer le statut",
    openLink: "Ouvrir l'offre",
    addNote: "Ajouter une note",
    edit: "Modifier",
    delete: "Supprimer",
    notePlaceholder: "Votre note...",
    noteSaved: "Note enregistrée",
  },

  deleteModal: {
    title: "Supprimer cette candidature ?",
    description: (title: string, company: string) =>
      `Êtes-vous sûr de vouloir supprimer ${title} chez ${company} ? Cette action est irréversible.`,
  },

  search: {
    placeholder: "Rechercher une candidature... (⌘K)",
    clearSearch: "Effacer la recherche",
    searchPlaceholder: "Rechercher...",
    filterByType: "Filtrer par type",
  },

  header: {
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    profile: "Profil",
    logout: "Déconnexion",
    defaultUser: "Utilisateur",
  },

  sidebar: {
    navLabel: "Navigation principale",
    kanban: "Kanban",
    list: "Liste",
    timeline: "Timeline",
    stats: "Stats",
  },

  list: {
    columns: {
      title: "Titre",
      company: "Entreprise",
      status: "Statut",
      date: "Date",
      location: "Localisation",
      source: "Source",
    },
    viewDetail: "Voir le détail",
  },

  timeline: {
    title: "Timeline",
    todayActions: (count: number) =>
      `${count} action${count > 1 ? "s" : ""} aujourd'hui`,
  },

  stats: {
    totalApplications: "Total candidatures",
    activePipeline: "Pipeline active",
    ongoingInterviews: "Entretiens en cours",
    responseRate: "Taux de réponse",
    byStatus: "Répartition par statut",
    bySource: "Répartition par source",
    applications: "Candidatures",
  },

  auth: {
    login: "Connexion",
    register: "Inscription",
    logout: "Déconnexion",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    password: "Mot de passe",
    passwordPlaceholder: "••••••••",
    passwordConfirmation: "Confirmer le mot de passe",
    firstName: "Prénom",
    firstNamePlaceholder: "Jean",
    lastName: "Nom",
    lastNamePlaceholder: "Dupont",
    loginAction: "Se connecter",
    registerAction: "S'inscrire",
    loggingIn: "Connexion...",
    registering: "Inscription...",
    noAccount: "Pas de compte ?",
    createAccount: "S'inscrire",
    hasAccount: "Déjà un compte ?",
    loginLink: "Se connecter",
    welcomeBack: "Content de vous revoir !",
    accountCreated: "Compte créé avec succès !",
    loggedOut: "Déconnecté",
    sessionExpired: "Session expirée, veuillez vous reconnecter",
    invalidCredentials: "Identifiants invalides",
    registerError: "Erreur lors de l'inscription",
    emailAlreadyUsed: "Cet e-mail est déjà utilisé",
    loginToAccess: "Connectez-vous pour accéder à vos candidatures",
    handoffFailed: "Lien d'authentification expiré. Veuillez vous reconnecter.",
    validation: {
      emailRequired: "L'adresse e-mail est requise",
      emailInvalid: "L'adresse e-mail n'est pas valide",
      passwordRequired: "Le mot de passe est requis",
      // Unified complexity message: the per-rule UI feedback is shown live
      // by <PasswordStrengthIndicator/>, so form errors stay concise.
      passwordComplexity:
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      passwordMatch: "Les mots de passe correspondent",
      firstNameRequired: "Le prénom est requis",
      lastNameRequired: "Le nom est requis",
    },
    passwordRules: {
      minLength: "8 caractères minimum",
      uppercase: "Une lettre majuscule",
      lowercase: "Une lettre minuscule",
      digit: "Un chiffre",
    },
  },

  rgpd: {
    myAccount: "Mon compte",
    personalInfo: "Informations personnelles",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Adresse e-mail",
    memberSince: "Membre depuis le",
    consents: "Gestion des consentements",
    consentsDescription:
      "Vous pouvez révoquer vos consentements à tout moment. La révocation entraîne la suspension de votre compte.",
    consentTerms: "Conditions générales d'utilisation",
    consentPrivacy: "Politique de confidentialité",
    consentActive: "Actif",
    consentRevoked: "Révoqué",
    revokeConsent: "Révoquer",
    revokeConsentConfirmTitle: "Révoquer ce consentement ?",
    revokeConsentConfirmDescription:
      "La révocation de ce consentement entraînera la suspension de votre compte. Vos données seront conservées mais l'accès à vos candidatures sera limité.",
    revokeConsentConfirm: "Oui, révoquer",
    revoking: "Révocation...",
    revokeSuccess: "Consentement révoqué.",
    revokeError: "Erreur lors de la révocation.",
    grantConsent: "Redonner mon consentement",
    grantConsentConfirmTitle: "Redonner votre consentement ?",
    grantConsentConfirmDescription:
      "En redonnant votre consentement, vous acceptez à nouveau les conditions associées. Ce consentement sera enregistré avec votre adresse IP.",
    grantConsentConfirm: "Oui, je consens",
    granting: "Enregistrement...",
    grantSuccess: "Consentement enregistré.",
    grantError: "Erreur lors de l'enregistrement du consentement.",
    reactivateAccount: "Réactiver mon compte",
    reactivateDescription:
      "Votre compte est suspendu. Vérifiez vos consentements ci-dessous puis réactivez votre compte.",
    reactivateConfirmTitle: "Réactiver votre compte ?",
    reactivateConfirmDescription:
      "Vous retrouverez l'accès complet à vos candidatures.",
    reactivateConfirm: "Oui, réactiver",
    reactivating: "Réactivation...",
    reactivateSuccess: "Votre compte a été réactivé.",
    reactivateError: "Erreur lors de la réactivation.",
    reactivateMissingConsents:
      "Veuillez d'abord redonner tous vos consentements.",
    accountSuspendedBanner:
      "Votre compte est suspendu. L'accès à vos candidatures est limité.",
    exportData: "Exporter mes données",
    exportDescription:
      "Téléchargez une copie de toutes vos données personnelles (profil, candidatures, événements) au format JSON.",
    exporting: "Export en cours...",
    exportSuccess: "Vos données ont été téléchargées.",
    exportError: "Erreur lors de l'export de vos données.",
    suspendAccount: "Suspendre mon compte",
    suspendDescription:
      "Vos données seront conservées mais leur traitement sera limité (droit à la limitation, art. 18 RGPD). Vous pourrez réactiver votre compte à tout moment.",
    suspendConfirmTitle: "Suspendre votre compte ?",
    suspendConfirmDescription:
      "Votre compte sera immédiatement suspendu. Vos données resteront stockées mais ne seront plus traitées. Vous pourrez le réactiver depuis votre page Compte.",
    suspendConfirm: "Oui, suspendre mon compte",
    suspending: "Suspension...",
    suspendSuccess: "Votre compte a été suspendu.",
    suspendError: "Erreur lors de la suspension du compte.",
    deleteAccount: "Supprimer mon compte",
    deleteDescription:
      "Cette action est irréversible. Toutes vos données seront supprimées après un délai de 30 jours.",
    deleteConfirmTitle: "Supprimer votre compte ?",
    deleteConfirmDescription:
      "Votre compte sera désactivé immédiatement et toutes vos données seront définitivement supprimées après 30 jours. Cette action est irréversible.",
    deleteConfirm: "Oui, supprimer mon compte",
    deleting: "Suppression...",
    deleteSuccess: "Votre compte a été supprimé.",
    deleteError: "Erreur lors de la suppression du compte.",
    acceptTerms: "J'accepte les conditions générales d'utilisation",
    acceptPrivacy: "J'accepte la politique de confidentialité",
    termsRequired:
      "Vous devez accepter les conditions générales d'utilisation.",
    privacyRequired: "Vous devez accepter la politique de confidentialité.",
  },

  footer: {
    privacy: "Politique de confidentialité",
    legal: "Mentions légales",
    copyright: `© ${new Date().getFullYear()} JobTracker. Tous droits réservés.`,
  },

  legal: {
    pageTitle: "Mentions légales",
    seePrivacy: "Politique de confidentialité",
    sections: {
      publisher: {
        title: "1. Éditeur du site",
        editedBy:
          "JobTracker est édité par Benoit Dedicker (personne physique).",
        headOffice: "Contact : dedickerbenoit@gmail.com",
        siret: "",
        contact: "",
      },
      publicationDirector: {
        title: "2. Directeur de la publication",
        value: "Benoit Dedicker",
      },
      hosting: {
        title: "3. Hébergement",
        name: "Fly.io, Inc.",
        address: "2261 Market Street #4990, San Francisco, CA 94114, USA",
        phone: "https://fly.io",
      },
      intellectualProperty: {
        title: "4. Propriété intellectuelle",
        content:
          "L'ensemble du contenu de ce site (textes, images, code source) est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable de l'éditeur.",
      },
      dataProtection: {
        title: "5. Protection des données personnelles",
        contentPrefix:
          "Pour en savoir plus sur la collecte et le traitement de vos données, consultez notre ",
        linkLabel: "Politique de confidentialité",
        contentSuffix: ".",
      },
    },
  },

  privacy: {
    pageTitle: "Politique de confidentialité",
    lastUpdated: "Dernière mise à jour : 21 avril 2026",
    seeLegal: "Mentions légales",
    sections: {
      controller: {
        title: "1. Identité du responsable de traitement",
        content:
          "JobTracker est édité par Benoit Dedicker. Contact : dedickerbenoit@gmail.com.",
      },
      collected: {
        title: "2. Données collectées",
        intro: "Nous collectons les données suivantes :",
        items: [
          {
            label: "Données d'identification :",
            text: "prénom, nom, adresse e-mail",
          },
          {
            label: "Données de candidature :",
            text: "titre du poste, entreprise, localisation, URL de l'offre, description, notes personnelles, statut, source",
          },
          {
            label: "Données techniques :",
            text: "adresse IP, user-agent (lors de l'inscription uniquement, pour le consentement)",
          },
          {
            label: "Données de connexion :",
            text: "sessions, tokens d'authentification",
          },
        ],
      },
      legalBasis: {
        title: "3. Bases légales des traitements",
        items: [
          {
            label: "Exécution du contrat",
            text: " (art. 6.1.b RGPD) : gestion du compte utilisateur et suivi des candidatures",
          },
          {
            label: "Consentement",
            text: " (art. 6.1.a RGPD) : acceptation des CGU et de la politique de confidentialité lors de l'inscription",
          },
          {
            label: "Intérêt légitime",
            text: " (art. 6.1.f RGPD) : sécurité de l'application, journalisation des accès",
          },
        ],
      },
      purposes: {
        title: "4. Finalités des traitements",
        items: [
          "Création et gestion de votre compte utilisateur",
          "Suivi de vos candidatures professionnelles",
          "Statistiques personnelles sur vos candidatures",
          "Sécurité et prévention des accès non autorisés",
        ],
      },
      retention: {
        title: "5. Durées de conservation",
        items: [
          {
            label: "Compte actif :",
            text: " données conservées tant que le compte est actif",
          },
          {
            label: "Après suppression :",
            text: " données supprimées définitivement 30 jours après la demande de suppression",
          },
          {
            label: "Sessions :",
            text: " purgées après 30 jours d'inactivité",
          },
          {
            label: "Tokens d'accès :",
            text: " purgés après 30 jours sans utilisation",
          },
        ],
      },
      recipients: {
        title: "6. Destinataires des données",
        content:
          "Vos données ne sont transmises à aucun tiers. Elles sont uniquement accessibles par vous-même et les administrateurs techniques de la plateforme, dans le cadre strict de la maintenance.",
      },
      transfers: {
        title: "7. Transferts hors UE",
        content:
          "L'hébergement applicatif (Fly.io) et la base de données (Neon) peuvent impliquer des traitements aux États-Unis. Ces prestataires adhèrent au Data Privacy Framework (DPF) UE-États-Unis, garantissant un niveau de protection adéquat conformément au RGPD.",
      },
      rights: {
        title: "8. Vos droits",
        intro: "Conformément au RGPD, vous disposez des droits suivants :",
        items: [
          {
            label: "Droit d'accès :",
            text: " obtenir une copie de vos données (export depuis votre profil)",
          },
          {
            label: "Droit de rectification :",
            text: " modifier vos informations personnelles",
          },
          {
            label: "Droit à l'effacement :",
            text: " supprimer votre compte et toutes vos données",
          },
          {
            label: "Droit à la portabilité :",
            text: " exporter vos données au format JSON",
          },
          {
            label: "Droit d'opposition :",
            text: " vous opposer au traitement de vos données",
          },
          {
            label: "Droit à la limitation :",
            text: " demander la limitation du traitement",
          },
        ],
        exercisePrefix: "Pour exercer ces droits, rendez-vous sur votre page ",
        accountLink: "Mon compte",
        exerciseSuffix: " ou contactez-nous à dedickerbenoit@gmail.com.",
      },
      cookies: {
        title: "9. Cookies",
        content:
          "JobTracker utilise uniquement des cookies strictement nécessaires au fonctionnement du service (cookie de session, token CSRF). Aucun cookie de traçage ou publicitaire n'est utilisé.",
      },
      security: {
        title: "10. Sécurité",
        content:
          "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, hachage des mots de passe (bcrypt), protection CSRF, rate limiting, validation des entrées.",
      },
      cnil: {
        title: "11. Réclamation auprès de la CNIL",
        contentPrefix:
          "Si vous estimez que le traitement de vos données ne respecte pas la réglementation, vous pouvez introduire une réclamation auprès de la CNIL : ",
        linkLabel: "www.cnil.fr",
        contentSuffix: ".",
      },
    },
  },

  landing: {
    nav: {
      features: "Fonctionnalités",
      howItWorks: "Comment ça marche",
      faq: "FAQ",
      cta: "Commencer gratuitement",
    },
    hero: {
      title: `Fini le chaos dans ta recherche d'emploi`,
      subtitle: `Centralise toutes tes candidatures, suis leur avancement en temps réel et décroche le job de tes rêves — sans prise de tête.`,
      ctaDashboard: "Lancer le dashboard",
      ctaExtension: `Installer l'extension Chrome`,
    },
    logos: {
      title: `Compatible avec tes sites d'emploi préférés`,
    },
    features: {
      title: `Tout ce qu'il te faut, rien de superflu`,
      subtitle: `Des outils pensés pour les chercheurs d'emploi qui veulent rester organisés.`,
      kanban: {
        title: "Tableau Kanban",
        description: `Visualise tes candidatures par statut : à postuler, postulé, entretien, offre... Déplace-les d'un simple glisser-déposer.`,
      },
      extension: {
        title: "Extension Chrome",
        description:
          "Sauvegarde une offre depuis LinkedIn ou Indeed en un clic. Plus besoin de copier-coller.",
      },
      timeline: {
        title: "Timeline intelligente",
        description: `Retrouve l'historique complet de chaque candidature : relances, entretiens, changements de statut.`,
      },
      stats: {
        title: "Statistiques claires",
        description: `Taux de réponse, répartition par source, par statut… Comprends ta recherche en un coup d'œil.`,
      },
    },
    howItWorks: {
      title: "Prêt en 3 étapes",
      subtitle: "Commence à suivre tes candidatures en moins de 2 minutes.",
      step1: {
        title: "Crée ton compte",
        description: `Inscription gratuite, sans carte bancaire. C'est parti !`,
      },
      step2: {
        title: "Ajoute tes candidatures",
        description: `Manuellement ou via l'extension Chrome directement depuis les sites d'emploi.`,
      },
      step3: {
        title: "Suis et organise",
        description:
          "Déplace tes candidatures sur le Kanban, ajoute des notes et ne rate plus aucune relance.",
      },
    },
    screenshot: {
      title: "Un dashboard pensé pour toi",
      subtitle:
        "Interface épurée, rapide et intuitive. Tout est à portée de clic.",
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          question: "Est-ce que JobTracker est gratuit ?",
          answer:
            "Oui ! JobTracker est entièrement gratuit. Pas de freemium caché, pas de limite sur le nombre de candidatures.",
        },
        {
          question: "Mes données sont-elles en sécurité ?",
          answer:
            "Absolument. Tes données sont chiffrées, hébergées en Europe et ne sont jamais partagées avec des tiers. Tu peux les exporter ou supprimer ton compte à tout moment.",
        },
        {
          question: `L'extension Chrome fonctionne avec quels sites ?`,
          answer: `LinkedIn et Indeed pour le moment. D'autres sites seront ajoutés prochainement.`,
        },
        {
          question: "Puis-je utiliser JobTracker sur mobile ?",
          answer: `JobTracker est conçu pour une utilisation sur desktop. L'extension Chrome est également disponible uniquement sur ordinateur.`,
        },
      ],
    },
    finalCta: {
      title: "Prêt à organiser ta recherche ?",
      subtitle: `Rejoins des centaines de candidats qui ont repris le contrôle de leur recherche d'emploi.`,
      ctaDashboard: "Créer mon compte gratuitement",
      ctaExtension: `Installer l'extension`,
    },
  },

  extension: {
    comingSoon: {
      title: `L'extension arrive bientôt`,
      description: `Ajoute tes candidatures en 1 clic depuis LinkedIn et Indeed.`,
      status: "On met les derniers coups de polish avant le lancement.",
      close: "Fermer",
    },
  },

  notFound: {
    title: "Page introuvable",
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
    backHome: "Retour à l'accueil",
  },

  a11y: {
    addApplication: "Ajouter une candidature",
  },
} as const;

export default fr;
