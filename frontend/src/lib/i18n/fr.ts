/**
 * French translations — single file, nested by domain.
 * Import via `import { t } from '@/lib/i18n'`
 */

const fr = {
  common: {
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    deleting: 'Suppression...',
    confirm: 'Confirmer',
    reset: 'Réinitialiser',
    loading: 'Chargement...',
    searching: 'Recherche...',
    previous: 'Précédent',
    next: 'Suivant',
    page: 'Page',
    noData: 'Aucune donnée',
    actions: 'Actions',
  },

  status: {
    to_apply: 'À postuler',
    applied: 'Postulé',
    follow_up: 'Relance',
    interview: 'Entretien',
    offer: 'Offre reçue',
    rejected: 'Refusé',
    allStatuses: 'Tous les statuts',
  },

  source: {
    linkedin: 'LinkedIn',
    indeed: 'Indeed',
    hellowork: 'HelloWork',
    manual: 'Manuel',
    allSources: 'Toutes les sources',
  },

  event: {
    created: 'Créée',
    status_changed: 'Statut modifié',
    updated: 'Mise à jour',
    deleted: 'Supprimée',
    allTypes: 'Tous les types',
  },

  application: {
    singular: 'candidature',
    plural: 'candidatures',
    none: 'Aucune candidature',
    noneFound: 'Aucune candidature trouvée',
    noEvent: 'Aucun événement',
    addApplication: 'Ajouter une candidature',
    editApplication: 'Modifier la candidature',
    description: 'Description',
    notes: 'Notes',
    history: 'Historique',
    addedAgo: 'Ajoutée',
    appliedOn: 'Postulée le',
    location: 'Localisation',
    emptyState: 'Aucune candidature ici.',
    emptyStateAction: 'Ajoutez votre première offre !',
  },

  form: {
    jobTitle: 'Titre du poste *',
    jobTitlePlaceholder: 'Développeur Full Stack',
    company: 'Entreprise *',
    location: 'Localisation *',
    locationPlaceholder: 'Paris, France',
    jobUrl: "URL de l'offre *",
    descriptionPlaceholder: "Description de l'offre...",
    personalNotes: 'Notes personnelles',
    notesPlaceholder: 'Vos notes...',
    validation: {
      titleRequired: 'Le titre est requis',
      companyRequired: "L'entreprise est requise",
      locationRequired: 'La localisation est requise',
      urlRequired: "L'URL est requise",
      urlInvalid: "L'URL n'est pas valide",
    },
  },

  toast: {
    applicationCreated: 'Candidature ajoutée',
    applicationUpdated: 'Candidature mise à jour',
    applicationDeleted: 'Candidature supprimée',
    duplicateDetected: 'Doublon détecté',
    errorLoading: 'Erreur lors du chargement des candidatures',
    errorCreating: "Erreur lors de l'ajout",
    errorUpdating: 'Erreur lors de la mise à jour',
    errorDeleting: 'Erreur lors de la suppression',
    errorStatusChange: 'Erreur lors du changement de statut',
  },

  kanban: {
    confirmRejectTitle: 'Confirmer le refus ?',
    confirmRejectDescription: (title: string, company: string) =>
      `Voulez-vous marquer ${title} chez ${company} comme refusée ?`,
    confirmReject: 'Confirmer le refus',
    showRejected: 'Voir les refusés',
    hideRejected: 'Masquer les refusés',
    followUpBadge: 'Relance',
    rejectedCount: (count: number) => `${count} refusée${count > 1 ? 's' : ''}`,
  },

  quickActions: {
    changeStatus: 'Changer le statut',
    openLink: "Ouvrir l'offre",
    addNote: 'Ajouter une note',
    edit: 'Modifier',
    delete: 'Supprimer',
    notePlaceholder: 'Votre note...',
    noteSaved: 'Note enregistrée',
  },

  deleteModal: {
    title: 'Supprimer cette candidature ?',
    description: (title: string, company: string) =>
      `Êtes-vous sûr de vouloir supprimer ${title} chez ${company} ? Cette action est irréversible.`,
  },

  search: {
    placeholder: 'Rechercher une candidature... (⌘K)',
    clearSearch: 'Effacer la recherche',
    searchPlaceholder: 'Rechercher...',
    filterByType: 'Filtrer par type',
  },

  header: {
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    profile: 'Profil',
    logout: 'Déconnexion',
    defaultUser: 'Utilisateur',
  },

  sidebar: {
    navLabel: 'Navigation principale',
    kanban: 'Kanban',
    list: 'Liste',
    timeline: 'Timeline',
    stats: 'Stats',
  },

  list: {
    columns: {
      title: 'Titre',
      company: 'Entreprise',
      status: 'Statut',
      date: 'Date',
      location: 'Localisation',
      source: 'Source',
    },
    viewDetail: 'Voir le détail',
  },

  timeline: {
    title: 'Timeline',
    todayActions: (count: number) =>
      `${count} action${count > 1 ? 's' : ''} aujourd'hui`,
  },

  stats: {
    totalApplications: 'Total candidatures',
    activePipeline: 'Pipeline active',
    ongoingInterviews: 'Entretiens en cours',
    responseRate: 'Taux de réponse',
    byStatus: 'Répartition par statut',
    bySource: 'Répartition par source',
    applications: 'Candidatures',
  },

  auth: {
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    email: 'Adresse e-mail',
    emailPlaceholder: 'vous@exemple.com',
    password: 'Mot de passe',
    passwordPlaceholder: '••••••••',
    passwordConfirmation: 'Confirmer le mot de passe',
    firstName: 'Prénom',
    firstNamePlaceholder: 'Jean',
    lastName: 'Nom',
    lastNamePlaceholder: 'Dupont',
    loginAction: 'Se connecter',
    registerAction: "S'inscrire",
    loggingIn: 'Connexion...',
    registering: 'Inscription...',
    noAccount: "Pas de compte ?",
    createAccount: "S'inscrire",
    hasAccount: 'Déjà un compte ?',
    loginLink: 'Se connecter',
    welcomeBack: 'Content de vous revoir !',
    accountCreated: 'Compte créé avec succès !',
    loggedOut: 'Déconnecté',
    sessionExpired: 'Session expirée, veuillez vous reconnecter',
    invalidCredentials: 'Identifiants invalides',
    registerError: "Erreur lors de l'inscription",
    emailAlreadyUsed: 'Cet e-mail est déjà utilisé',
    loginToAccess: 'Connectez-vous pour accéder à vos candidatures',
    validation: {
      emailRequired: "L'adresse e-mail est requise",
      emailInvalid: "L'adresse e-mail n'est pas valide",
      passwordRequired: 'Le mot de passe est requis',
      passwordMin: 'Le mot de passe doit contenir au moins 8 caractères',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      firstNameRequired: 'Le prénom est requis',
      lastNameRequired: 'Le nom est requis',
    },
  },

  rgpd: {
    myAccount: 'Mon compte',
    personalInfo: 'Informations personnelles',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Adresse e-mail',
    memberSince: 'Membre depuis le',
    exportData: 'Exporter mes données',
    exportDescription: 'Téléchargez une copie de toutes vos données personnelles (profil, candidatures, événements) au format JSON.',
    exporting: 'Export en cours...',
    exportSuccess: 'Vos données ont été téléchargées.',
    exportError: "Erreur lors de l'export de vos données.",
    deleteAccount: 'Supprimer mon compte',
    deleteDescription: 'Cette action est irréversible. Toutes vos données seront supprimées après un délai de 30 jours.',
    deleteConfirmTitle: 'Supprimer votre compte ?',
    deleteConfirmDescription: 'Votre compte sera désactivé immédiatement et toutes vos données seront définitivement supprimées après 30 jours. Cette action est irréversible.',
    deleteConfirm: 'Oui, supprimer mon compte',
    deleting: 'Suppression...',
    deleteSuccess: 'Votre compte a été supprimé.',
    deleteError: 'Erreur lors de la suppression du compte.',
    acceptTerms: "J'accepte les conditions générales d'utilisation",
    acceptPrivacy: "J'accepte la politique de confidentialité",
    termsRequired: "Vous devez accepter les conditions générales d'utilisation.",
    privacyRequired: 'Vous devez accepter la politique de confidentialité.',
  },

  footer: {
    privacy: 'Politique de confidentialité',
    legal: 'Mentions légales',
    copyright: `© ${new Date().getFullYear()} JobTracker. Tous droits réservés.`,
  },

  a11y: {
    addApplication: 'Ajouter une candidature',
  },
} as const;

export default fr;
