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
    thisMonth: 'Ce mois-ci',
    ongoingInterviews: 'Entretiens en cours',
    responseRate: 'Taux de réponse',
    byStatus: 'Répartition par statut',
    bySource: 'Répartition par source',
    recentActivity: 'Activité récente (30 derniers jours)',
    applications: 'Candidatures',
  },

  a11y: {
    addApplication: 'Ajouter une candidature',
  },
} as const;

export default fr;
