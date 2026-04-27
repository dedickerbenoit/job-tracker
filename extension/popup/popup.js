import { getSettings, updateSettings } from "../utils/settings.js";
import {
  apiRequest,
  apiLogin,
  apiLogout,
  apiGetMe,
  getAuthToken,
  openDashboard,
} from "../utils/api.js";
import { t } from "../utils/i18n.js";
import {
  APPLICATION_STATUSES,
  DEFAULT_STATUS,
  APPLICATION_SOURCES,
} from "../utils/constants.js";

// --- DOM references ---
const elements = {
  // Sections
  sectionAuth: document.getElementById("section-auth"),
  sectionJob: document.getElementById("section-job"),
  sectionManual: document.getElementById("section-manual"),
  sectionSettings: document.getElementById("section-settings"),

  // Status
  statusIcon: document.getElementById("status-icon"),
  statusText: document.getElementById("status-text"),

  // Forms
  jobForm: document.getElementById("job-form"),
  authForm: document.getElementById("auth-form"),

  // Auth
  authIntro: document.getElementById("auth-intro"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  authError: document.getElementById("auth-error"),
  labelAuthEmail: document.getElementById("label-auth-email"),
  labelAuthPassword: document.getElementById("label-auth-password"),

  // Job fields
  fieldTitle: document.getElementById("field-title"),
  fieldCompany: document.getElementById("field-company"),
  fieldLocation: document.getElementById("field-location"),

  fieldUrl: document.getElementById("field-url"),
  fieldSource: document.getElementById("field-source"),
  fieldStatus: document.getElementById("field-status"),
  fieldDescription: document.getElementById("field-description"),
  fieldNotes: document.getElementById("field-notes"),
  labelFieldTitle: document.getElementById("label-field-title"),
  labelFieldCompany: document.getElementById("label-field-company"),
  labelFieldLocation: document.getElementById("label-field-location"),

  labelFieldUrl: document.getElementById("label-field-url"),
  labelFieldSource: document.getElementById("label-field-source"),
  labelFieldStatus: document.getElementById("label-field-status"),
  labelFieldDescription: document.getElementById("label-field-description"),
  labelFieldNotes: document.getElementById("label-field-notes"),

  // Buttons
  btnLogin: document.getElementById("btn-login"),
  btnLogout: document.getElementById("btn-logout"),
  btnManual: document.getElementById("btn-manual"),
  btnScrape: document.getElementById("btn-scrape"),
  btnSubmit: document.getElementById("btn-submit"),
  btnDashboard: document.getElementById("btn-dashboard"),
  btnOpenDashboard: document.getElementById("btn-open-dashboard"),
  btnOpenDashboardLabel: document.getElementById("btn-open-dashboard-label"),

  // Settings panel
  settingsTitle: document.getElementById("settings-title"),
  settingsEnabledSites: document.getElementById("settings-enabled-sites"),
  settingLinkedin: document.getElementById("setting-linkedin"),
  settingIndeed: document.getElementById("setting-indeed"),

  // Misc
  userInfo: document.getElementById("user-info"),
  userName: document.getElementById("user-name"),
  toast: document.getElementById("toast"),
};

let currentTabUrl = "";
let isAuthenticated = false;
let hasSubmitted = false;

// --- Init ---

document.addEventListener("DOMContentLoaded", async () => {
  applyTranslations();
  await checkAuth();
  await loadSettings();
  bindEvents();
});

// --- i18n: populate static text from the translation dictionary ---

function applyTranslations() {
  // Header tooltips
  elements.btnDashboard.title = t.ui.header.dashboard;
  elements.btnLogout.title = t.ui.header.logout;

  // Auth section
  elements.authIntro.textContent = t.ui.auth.intro;
  elements.labelAuthEmail.textContent = t.ui.auth.emailLabel;
  elements.authEmail.placeholder = t.ui.auth.emailPlaceholder;
  elements.labelAuthPassword.textContent = t.ui.auth.passwordLabel;
  elements.authPassword.placeholder = t.ui.auth.passwordPlaceholder;
  elements.btnLogin.textContent = t.auth.login;

  // Job status + primary scrape button
  elements.statusText.textContent = t.status.loading;
  elements.btnScrape.textContent = t.scrape.button;

  // Job form labels + placeholders
  elements.labelFieldTitle.textContent = t.ui.form.titleLabel;
  elements.fieldTitle.placeholder = t.ui.form.titlePlaceholder;
  elements.labelFieldCompany.textContent = t.ui.form.companyLabel;
  elements.fieldCompany.placeholder = t.ui.form.companyPlaceholder;
  elements.labelFieldLocation.textContent = t.ui.form.locationLabel;
  elements.fieldLocation.placeholder = t.ui.form.locationPlaceholder;

  elements.labelFieldUrl.textContent = t.ui.form.urlLabel;
  elements.fieldUrl.placeholder = t.ui.form.urlPlaceholder;
  elements.labelFieldSource.textContent = t.ui.form.sourceLabel;
  // Génération dynamique des options source
  elements.fieldSource.innerHTML = "";
  APPLICATION_SOURCES.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = t.ui.applicationSource[value];
    elements.fieldSource.appendChild(opt);
  });

  elements.labelFieldStatus.textContent = t.ui.form.statusLabel;
  // Génération dynamique des options statut
  elements.fieldStatus.innerHTML = "";
  APPLICATION_STATUSES.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = t.ui.applicationStatus[value];
    elements.fieldStatus.appendChild(opt);
  });
  elements.labelFieldDescription.textContent = t.ui.form.descriptionLabel;
  elements.fieldDescription.placeholder = t.ui.form.descriptionPlaceholder;
  elements.labelFieldNotes.textContent = t.ui.form.notesLabel;
  elements.fieldNotes.placeholder = t.ui.form.notesPlaceholder;
  elements.btnSubmit.textContent = t.job.submit;
  elements.btnOpenDashboardLabel.textContent = t.ui.form.openDashboard;

  // Manual entry
  elements.btnManual.textContent = t.ui.manual.button;
}

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
  elements.sectionAuth.classList.add("hidden");
  elements.sectionJob.classList.remove("hidden");
  elements.sectionManual.classList.remove("hidden");
  elements.userInfo.classList.remove("hidden");
  elements.btnLogout.classList.remove("hidden");
  elements.userName.textContent = user.first_name || user.email;
  loadTabState();
}

function showAuthSection() {
  isAuthenticated = false;
  elements.sectionAuth.classList.remove("hidden");
  elements.sectionJob.classList.add("hidden");
  elements.sectionManual.classList.add("hidden");
  elements.userInfo.classList.add("hidden");
  elements.btnLogout.classList.add("hidden");
}

async function handleLogin(e) {
  e.preventDefault();
  elements.authError.classList.add("hidden");
  elements.btnLogin.disabled = true;
  elements.btnLogin.textContent = t.auth.loggingIn;

  try {
    const result = await apiLogin(
      elements.authEmail.value,
      elements.authPassword.value,
    );
    const user = result?.data?.user || result?.user;
    if (!user) {
      showToast(t.auth.profileNotReceived, "error");
      return;
    }
    elements.authEmail.value = "";
    elements.authPassword.value = "";
    setAuthenticated(user);
    showToast(t.auth.loggedIn, "success");
  } catch (err) {
    const message =
      err.data?.message ||
      err.data?.errors?.email?.[0] ||
      t.auth.invalidCredentials;
    elements.authError.textContent = message;
    elements.authError.classList.remove("hidden");
  } finally {
    elements.btnLogin.disabled = false;
    elements.btnLogin.textContent = t.auth.login;
  }
}

async function handleLogout() {
  try {
    await apiLogout();
  } catch (e) {
    // Ignore errors — token already cleared
  }
  showAuthSection();
  showToast(t.auth.logout, "info");
}

// --- Load current tab state from background ---

async function loadTabState() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_CURRENT_TAB_STATE",
    });
    currentTabUrl = response?.tabUrl || "";

    if (response?.state?.scrapedData) {
      showScrapedData(response.state.scrapedData);
      elements.btnScrape.classList.add("hidden");
    } else if (response?.state?.detected) {
      setStatus("detected", t.job.detected(response.state.name));
      elements.btnScrape.classList.remove("hidden");
    } else {
      elements.btnScrape.classList.add("hidden");
      setStatus("none", t.job.noneDetected);
    }
  } catch (e) {
    setStatus("none", t.status.commError);
  }
}

// --- UI update functions ---

function setStatus(type, text) {
  const icons = { detected: "●", success: "✓", none: "○" };
  elements.statusIcon.textContent = icons[type] || "○";
  elements.statusIcon.className = `status-icon ${type}`;
  elements.statusText.textContent = text;
}

function showScrapedData(data) {
  setStatus("success", t.job.captured(data.source));
  elements.fieldTitle.value = data.title || "";
  elements.fieldCompany.value = data.company || "";
  elements.fieldLocation.value = data.location || "";

  elements.fieldUrl.value = data.url || "";
  elements.fieldSource.value = data.source || "manual";
  elements.fieldDescription.value = data.description || "";
  elements.jobForm.classList.remove("hidden");
}

function showManualForm() {
  setStatus("none", t.job.manualEntry);
  elements.fieldTitle.value = "";
  elements.fieldCompany.value = "";
  elements.fieldLocation.value = "";

  elements.fieldUrl.value = currentTabUrl;
  elements.fieldSource.value = "manual";
  elements.fieldStatus.value = DEFAULT_STATUS;
  elements.fieldDescription.value = "";
  elements.fieldNotes.value = "";
  elements.jobForm.classList.remove("hidden");
  elements.sectionManual.classList.add("hidden");
  elements.fieldTitle.focus();
}

function showToast(message, type = "info") {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.remove("hidden");
  setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 3000);
}

// --- User-initiated scrape (RGPD) ---

async function handleScrape() {
  elements.btnScrape.disabled = true;
  elements.btnScrape.textContent = t.scrape.inProgress;
  try {
    await chrome.runtime.sendMessage({ type: "REQUEST_SCRAPE" });
    // Wait for SCRAPED_DATA to come back via background → popup reload
    // Poll for scraped data
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const response = await chrome.runtime.sendMessage({
        type: "GET_CURRENT_TAB_STATE",
      });
      if (response?.state?.scrapedData) {
        clearInterval(poll);
        showScrapedData(response.state.scrapedData);
        elements.btnScrape.classList.add("hidden");
      } else if (attempts > 10) {
        clearInterval(poll);
        showToast(t.scrape.unable, "error");
        elements.btnScrape.disabled = false;
        elements.btnScrape.textContent = t.scrape.button;
      }
    }, 800);
  } catch (e) {
    showToast(t.scrape.error, "error");
    elements.btnScrape.disabled = false;
    elements.btnScrape.textContent = t.scrape.button;
  }
}

// --- Form submit → API ---

async function handleSubmit(e) {
  e.preventDefault();

  // M3: Prevent duplicate submissions
  if (hasSubmitted) {
    showToast(t.job.alreadySaved, "info");
    return;
  }

  elements.btnSubmit.disabled = true;
  elements.btnSubmit.textContent = t.job.submitting;

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
    await apiRequest("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Mark as submitted in background
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.runtime.sendMessage({
        type: "MARK_AS_SUBMITTED",
        tabId: tabs[0].id,
      });
    }

    hasSubmitted = true;
    showToast(t.job.savedToast, "success");
    elements.btnSubmit.textContent = t.job.saved;
    elements.btnOpenDashboard.classList.remove("hidden");
    // M1: Form stays editable — only the submit button is disabled
  } catch (err) {
    if (err.status === 401) {
      showAuthSection();
      showToast(t.auth.sessionExpired, "error");
    } else {
      const message = err.data?.message || t.job.saveError;
      showToast(message, "error");
    }
    elements.btnSubmit.disabled = false;
    elements.btnSubmit.textContent = t.job.submit;
  }
}

// --- Settings ---

async function loadSettings() {
  const settings = await getSettings();
  elements.settingLinkedin.checked = settings.enabledSites.linkedin;
  elements.settingIndeed.checked = settings.enabledSites.indeed;
}

async function saveSettings() {
  await updateSettings({
    enabledSites: {
      linkedin: elements.settingLinkedin.checked,
      indeed: elements.settingIndeed.checked,
    },
  });
  showToast(t.settings.saved, "success");
}

// --- Events ---

function bindEvents() {
  elements.authForm.addEventListener("submit", handleLogin);
  elements.btnLogout.addEventListener("click", handleLogout);
  elements.btnDashboard.addEventListener("click", openDashboard);
  elements.btnOpenDashboard.addEventListener("click", openDashboard);
  elements.btnScrape.addEventListener("click", handleScrape);
  elements.btnManual.addEventListener("click", showManualForm);

  // Settings checkboxes auto-save
  elements.settingLinkedin.addEventListener("change", saveSettings);
  elements.settingIndeed.addEventListener("change", saveSettings);

  // Form submit → API
  elements.jobForm.addEventListener("submit", handleSubmit);
}
