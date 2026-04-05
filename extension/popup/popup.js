import { getSettings, updateSettings } from '../utils/settings.js';
import { apiRequest, apiLogin, apiLogout, apiGetMe, getAuthToken } from '../utils/api.js';

// --- DOM references ---
const elements = {
  sectionAuth: document.getElementById('section-auth'),
  sectionJob: document.getElementById('section-job'),
  sectionManual: document.getElementById('section-manual'),
  sectionSettings: document.getElementById('section-settings'),
  statusIcon: document.getElementById('status-icon'),
  statusText: document.getElementById('status-text'),
  jobForm: document.getElementById('job-form'),
  authForm: document.getElementById('auth-form'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authError: document.getElementById('auth-error'),
  btnLogin: document.getElementById('btn-login'),
  btnLogout: document.getElementById('btn-logout'),
  btnManual: document.getElementById('btn-manual'),
  btnSettings: document.getElementById('btn-settings'),
  btnSettingsBack: document.getElementById('btn-settings-back'),
  btnSubmit: document.getElementById('btn-submit'),
  userInfo: document.getElementById('user-info'),
  userName: document.getElementById('user-name'),
  toast: document.getElementById('toast'),
  fieldTitle: document.getElementById('field-title'),
  fieldCompany: document.getElementById('field-company'),
  fieldLocation: document.getElementById('field-location'),
  fieldUrl: document.getElementById('field-url'),
  fieldSource: document.getElementById('field-source'),
  fieldDescription: document.getElementById('field-description'),
  fieldNotes: document.getElementById('field-notes'),
  fieldStatus: document.getElementById('field-status'),
  settingLinkedin: document.getElementById('setting-linkedin'),
  settingIndeed: document.getElementById('setting-indeed'),
  settingHellowork: document.getElementById('setting-hellowork'),
};

let currentTabUrl = '';
let isAuthenticated = false;
let hasSubmitted = false;

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await loadSettings();
  bindEvents();
});

// --- Auth ---

async function checkAuth() {
  const token = await getAuthToken();
  if (!token) {
    showAuthSection();
    return;
  }

  try {
    const result = await apiGetMe();
    const user = result?.data || result;
    setAuthenticated(user);
  } catch (e) {
    showAuthSection();
  }
}

function setAuthenticated(user) {
  isAuthenticated = true;
  elements.sectionAuth.classList.add('hidden');
  elements.sectionJob.classList.remove('hidden');
  elements.sectionManual.classList.remove('hidden');
  elements.userInfo.classList.remove('hidden');
  elements.userName.textContent = user.first_name || user.email;
  loadTabState();
}

function showAuthSection() {
  isAuthenticated = false;
  elements.sectionAuth.classList.remove('hidden');
  elements.sectionJob.classList.add('hidden');
  elements.sectionManual.classList.add('hidden');
  elements.userInfo.classList.add('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  elements.authError.classList.add('hidden');
  elements.btnLogin.disabled = true;
  elements.btnLogin.textContent = 'Connexion...';

  try {
    const result = await apiLogin(
      elements.authEmail.value,
      elements.authPassword.value,
    );
    const user = result?.data?.user || result?.user;
    if (!user) {
      showToast('Erreur : profil non reçu', 'error');
      return;
    }
    elements.authEmail.value = '';
    elements.authPassword.value = '';
    setAuthenticated(user);
    showToast('Connecté', 'success');
  } catch (err) {
    const message = err.data?.message || err.data?.errors?.email?.[0] || 'Identifiants invalides';
    elements.authError.textContent = message;
    elements.authError.classList.remove('hidden');
  } finally {
    elements.btnLogin.disabled = false;
    elements.btnLogin.textContent = 'Se connecter';
  }
}

async function handleLogout() {
  try {
    await apiLogout();
  } catch (e) {
    // Ignore errors — token already cleared
  }
  showAuthSection();
  showToast('Déconnecté', 'info');
}

// --- Load current tab state from background ---

async function loadTabState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB_STATE' });
    currentTabUrl = response?.tabUrl || '';

    if (response?.state?.scrapedData) {
      showScrapedData(response.state.scrapedData);
    } else if (response?.state?.detected) {
      setStatus('detected', `Offre ${response.state.name} détectée, scraping en cours...`);
    } else {
      setStatus('none', 'Aucune offre détectée sur cette page');
    }
  } catch (e) {
    setStatus('none', 'Impossible de communiquer avec l\'extension');
  }
}

// --- UI update functions ---

function setStatus(type, text) {
  const icons = { detected: '●', success: '✓', none: '○' };
  elements.statusIcon.textContent = icons[type] || '○';
  elements.statusIcon.className = `status-icon ${type}`;
  elements.statusText.textContent = text;
}

function showScrapedData(data) {
  setStatus('success', `Offre ${data.source} capturée`);
  elements.fieldTitle.value = data.title || '';
  elements.fieldCompany.value = data.company || '';
  elements.fieldLocation.value = data.location || '';
  elements.fieldUrl.value = data.url || '';
  elements.fieldSource.value = data.source || 'other';
  elements.fieldDescription.value = data.description || '';
  elements.jobForm.classList.remove('hidden');
}

function showManualForm() {
  setStatus('none', 'Saisie manuelle');
  elements.fieldTitle.value = '';
  elements.fieldCompany.value = '';
  elements.fieldLocation.value = '';
  elements.fieldUrl.value = currentTabUrl;
  elements.fieldSource.value = 'other';
  elements.fieldDescription.value = '';
  elements.fieldNotes.value = '';
  elements.jobForm.classList.remove('hidden');
  elements.sectionManual.classList.add('hidden');
  elements.fieldTitle.focus();
}

function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.remove('hidden');
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3000);
}

// --- Form submit → API ---

async function handleSubmit(e) {
  e.preventDefault();

  // M3: Prevent duplicate submissions
  if (hasSubmitted) {
    showToast('Candidature déjà sauvegardée', 'info');
    return;
  }

  elements.btnSubmit.disabled = true;
  elements.btnSubmit.textContent = 'Envoi...';

  const data = {
    title: elements.fieldTitle.value,
    company: elements.fieldCompany.value,
    location: elements.fieldLocation.value,
    url: elements.fieldUrl.value,
    source: elements.fieldSource.value,
    description: elements.fieldDescription.value,
    notes: elements.fieldNotes.value,
    status: elements.fieldStatus.value,
  };

  try {
    await apiRequest('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Mark as submitted in background
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.runtime.sendMessage({ type: 'MARK_AS_SUBMITTED', tabId: tabs[0].id });
    }

    hasSubmitted = true;
    showToast('Candidature sauvegardée !', 'success');
    elements.btnSubmit.textContent = 'Sauvegardé ✓';
    // M1: Form stays editable — only the submit button is disabled
  } catch (err) {
    if (err.status === 401) {
      showAuthSection();
      showToast('Session expirée, reconnectez-vous', 'error');
    } else {
      const message = err.data?.message || 'Erreur lors de la sauvegarde';
      showToast(message, 'error');
    }
    elements.btnSubmit.disabled = false;
    elements.btnSubmit.textContent = 'Sauvegarder';
  }
}

// --- Settings ---

async function loadSettings() {
  const settings = await getSettings();
  elements.settingLinkedin.checked = settings.enabledSites.linkedin;
  elements.settingIndeed.checked = settings.enabledSites.indeed;
  elements.settingHellowork.checked = settings.enabledSites.hellowork;
}

async function saveSettings() {
  await updateSettings({
    enabledSites: {
      linkedin: elements.settingLinkedin.checked,
      indeed: elements.settingIndeed.checked,
      hellowork: elements.settingHellowork.checked,
    },
  });
  showToast('Paramètres sauvegardés', 'success');
}

function toggleSettingsPanel() {
  const isVisible = !elements.sectionSettings.classList.contains('hidden');
  elements.sectionSettings.classList.toggle('hidden', isVisible);
  if (isAuthenticated) {
    elements.sectionJob.classList.toggle('hidden', !isVisible);
    elements.sectionManual.classList.toggle('hidden', !isVisible);
  } else {
    elements.sectionAuth.classList.toggle('hidden', !isVisible);
  }
}

// --- Events ---

function bindEvents() {
  elements.authForm.addEventListener('submit', handleLogin);
  elements.btnLogout.addEventListener('click', handleLogout);
  elements.btnManual.addEventListener('click', showManualForm);
  elements.btnSettings.addEventListener('click', toggleSettingsPanel);
  elements.btnSettingsBack.addEventListener('click', toggleSettingsPanel);

  // Settings checkboxes auto-save
  elements.settingLinkedin.addEventListener('change', saveSettings);
  elements.settingIndeed.addEventListener('change', saveSettings);
  elements.settingHellowork.addEventListener('change', saveSettings);

  // Form submit → API
  elements.jobForm.addEventListener('submit', handleSubmit);
}
