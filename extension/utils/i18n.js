// Lightweight i18n for the extension.
// Single file, nested by domain. Mirrors the dashboard's structure.
// Usage: import { t } from './i18n.js';

const fr = {
  auth: {
    login: "Se connecter",
    loggingIn: "Connexion...",
    logout: "Déconnecté",
    loggedIn: "Connecté",
    invalidCredentials: "Identifiants invalides",
    profileNotReceived: "Erreur : profil non reçu",
    sessionExpired: "Session expirée, reconnectez-vous",
  },
  scrape: {
    button: "Récupérer cette offre",
    inProgress: "Récupération...",
    unable: "Impossible de de récupérer cette offre",
    error: "Erreur lors de la récupération de cette offre",
  },
  job: {
    detected: (source) => `Offre ${source} détectée`,
    captured: (source) => `Offre ${source} capturée`,
    noneDetected: "Aucune offre détectée sur cette page",
    manualEntry: "Saisie manuelle",
    submit: "Sauvegarder",
    submitting: "Envoi...",
    saved: "Sauvegardé ✓",
    savedToast: "Candidature sauvegardée !",
    saveError: "Erreur lors de la sauvegarde",
    alreadySaved: "Candidature déjà sauvegardée",
  },
  settings: {
    saved: "Paramètres sauvegardés",
  },
  status: {
    loading: "Chargement...",
    commError: "Impossible de communiquer avec l'extension",
  },
  ui: {
    header: {
      dashboard: "Ouvrir le Dashboard",
      settings: "Paramètres",
      logout: "Déconnexion",
    },
    auth: {
      intro: "Connectez-vous pour sauvegarder vos candidatures.",
      emailLabel: "Email",
      emailPlaceholder: "votre@email.com",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "Mot de passe",
    },
    form: {
      titleLabel: "Titre du poste",
      titlePlaceholder: "Ex: Développeur Full Stack",
      companyLabel: "Entreprise",
      companyPlaceholder: "Ex: Acme Corp",
      locationLabel: "Localisation",
      locationPlaceholder: "Ex: Paris, France",
      urlLabel: "URL de l'offre",
      urlPlaceholder: "https://...",
      sourceLabel: "Source",
      sourceOther: "Autre",
      statusLabel: "Statut",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Description du poste...",
      notesLabel: "Notes personnelles",
      notesPlaceholder: "Vos notes...",
      openDashboard: "Voir dans le Dashboard",
    },
    applicationStatus: {
      applied: "Candidaté",
      interview: "Entretien",
      offer: "Offre",
      rejected: "Refusé",
      withdrawn: "Retiré",
    },
    manual: {
      button: "Saisie manuelle",
    },
    settingsPanel: {
      title: "Paramètres",
      enabledSites: "Sites activés",
      back: "Retour",
    },
  },
};

// Export a stable `t` alias; swap languages later by switching the source object.
export const t = fr;
export default fr;
