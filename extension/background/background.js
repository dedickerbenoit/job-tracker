import { detectJobSite } from '../utils/detector.js';
import { isSiteEnabled } from '../utils/settings.js';

const currentTabStates = {};
const pendingHandles = new Set();

chrome.runtime.onInstalled.addListener(() => {
  console.log('[JobTracker] Extension installed');
});

// --- Tab listeners ---

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    const url = changeInfo.url || tab.url;
    if (url) await handleTabUrlChange(tabId, url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) await handleTabUrlChange(activeInfo.tabId, tab.url);
  } catch (e) {
    // Tab may no longer exist
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete currentTabStates[tabId];
});

// --- URL change handler ---

async function handleTabUrlChange(tabId, url) {
  if (pendingHandles.has(tabId)) return;
  pendingHandles.add(tabId);

  try {
    await _handleTabUrlChangeInner(tabId, url);
  } finally {
    pendingHandles.delete(tabId);
  }
}

async function _handleTabUrlChangeInner(tabId, url) {
  const detection = detectJobSite(url);

  if (!detection.detected) {
    currentTabStates[tabId] = { detected: false, url };
    await setIcon(tabId, 'inactive');
    await chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  const enabled = await isSiteEnabled(detection.site);
  if (!enabled) {
    currentTabStates[tabId] = { detected: false, url, disabledSite: detection.site };
    await setIcon(tabId, 'inactive');
    await chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  currentTabStates[tabId] = {
    detected: true,
    url,
    site: detection.site,
    source: detection.source,
    name: detection.name,
    scrapedData: null,
    submitted: false,
  };

  await setIcon(tabId, 'active');
  await chrome.action.setBadgeText({ tabId, text: '!' });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: '#0073B1' });

  // Ask content script to scrape
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'SCRAPE_JOB_DATA',
      site: detection.site,
    });
  } catch (e) {
    console.log('[JobTracker] Content script not ready yet, will retry on message');
  }
}

// --- Message handler ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'SCRAPED_DATA': {
      if (tabId && currentTabStates[tabId]) {
        currentTabStates[tabId].scrapedData = message.data;
        setIcon(tabId, 'success');
        chrome.action.setBadgeText({ tabId, text: '✓' });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#4CAF50' });
      }
      sendResponse({ received: true });
      break;
    }

    case 'GET_CURRENT_TAB_STATE': {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const activeTabId = tabs[0]?.id;
        const state = activeTabId ? currentTabStates[activeTabId] : null;
        sendResponse({ state, tabUrl: tabs[0]?.url });
      });
      return true; // async sendResponse
    }

    case 'MARK_AS_SUBMITTED': {
      if (message.tabId && currentTabStates[message.tabId]) {
        currentTabStates[message.tabId].submitted = true;
      }
      sendResponse({ ok: true });
      break;
    }

    case 'URL_CHANGED': {
      if (tabId && message.url) {
        handleTabUrlChange(tabId, message.url);
      }
      sendResponse({ ok: true });
      break;
    }
  }
});

// --- Icon helper ---

async function setIcon(tabId, state) {
  try {
    await chrome.action.setIcon({
      tabId,
      path: {
        16: `assets/icon-${state}-16.png`,
        48: `assets/icon-${state}-48.png`,
        128: `assets/icon-${state}-128.png`,
      },
    });
  } catch (e) {
    // Tab may no longer exist
  }
}
