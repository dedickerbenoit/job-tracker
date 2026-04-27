const DEFAULTS = {
  enabledSites: {
    linkedin: true,
    indeed: true,
    hellowork: true,
  },
};

export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get("settings", (result) => {
      resolve({ ...DEFAULTS, ...result.settings });
    });
  });
}

export async function updateSettings(updates) {
  const current = await getSettings();
  const merged = { ...current, ...updates };
  if (updates.enabledSites && current.enabledSites) {
    merged.enabledSites = { ...current.enabledSites, ...updates.enabledSites };
  }
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings: merged }, () => resolve(merged));
  });
}

export async function isSiteEnabled(site) {
  const settings = await getSettings();
  return settings.enabledSites[site] ?? true;
}
