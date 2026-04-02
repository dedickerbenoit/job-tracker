import { getSettings, updateSettings } from '../utils/settings.js';

// --- DOM references ---
const elements = {
  sectionJob: document.getElementById('section-job'),
  sectionManual: document.getElementById('section-manual'),
  sectionSettings: document.getElementById('section-settings'),
  statusIcon: document.getElementById('status-icon'),
  statusText: document.getElementById('status-text'),
  jobForm: document.getElementById('job-form'),
  btnManual: document.getElementById('btn-manual'),
  btnSettings: document.getElementById('btn-settings'),
  btnSettingsBack: document.getElementById('btn-settings-back'),
  btnSubmit: document.getElementById('btn-submit'),
  toast: document.getElementById('toast'),
  fieldTitle: document.getElementById('field-title'),
  fieldCompany: document.getElementById('field-company'),
  fieldLocation: document.getElementById('field-location'),
  fieldUrl: document.getElementById('field-url'),
  fieldSource: document.getElementById('field-source'),
  fieldDescription: document.getElementById('field-description'),
  fieldNotes: document.getElementById('field-notes'),
  settingLinkedin: document.getElementById('setting-linkedin'),
  settingIndeed: document.getElementById('setting-indeed'),
  settingHellowork: document.getElementById('setting-hellowork'),
};

let currentTabUrl = '';

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  await loadTabState();
  await loadSettings();
  bindEvents();
});

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
  elements.sectionJob.classList.toggle('hidden', !isVisible);
  elements.sectionManual.classList.toggle('hidden', !isVisible);
}

// --- Events ---

function bindEvents() {
  elements.btnManual.addEventListener('click', showManualForm);
  elements.btnSettings.addEventListener('click', toggleSettingsPanel);
  elements.btnSettingsBack.addEventListener('click', toggleSettingsPanel);

  // Settings checkboxes auto-save
  elements.settingLinkedin.addEventListener('change', saveSettings);
  elements.settingIndeed.addEventListener('change', saveSettings);
  elements.settingHellowork.addEventListener('change', saveSettings);

  // Form submit (disabled for now - no API)
  elements.jobForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      title: elements.fieldTitle.value,
      company: elements.fieldCompany.value,
      location: elements.fieldLocation.value,
      url: elements.fieldUrl.value,
      source: elements.fieldSource.value,
      description: elements.fieldDescription.value,
      notes: elements.fieldNotes.value,
    };
    console.log('[JobTracker] Form data (API not connected yet):', data);
    showToast('Données capturées (envoi API bientôt disponible)', 'info');
  });
}
