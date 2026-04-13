// Content script - coordinates scraping across job sites
// NOTE: No ES module imports (content scripts don't support modules)

(function () {
  'use strict';

  let lastUrl = location.href;
  let isListingPage = false;
  let currentSite = null;
  let lastJobKey = null;

  console.log('[JobTracker] Content script loaded on', location.hostname);

  // --- Message listener ---

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPE_JOB_DATA') {
      currentSite = message.site;
      isListingPage = !!message.listing;

      if (isListingPage) {
        console.log('[JobTracker] Listing page mode activated for', currentSite);
        // Reset lastJobKey so first panel scrape goes through
        lastJobKey = null;
      }

      scrapeWithRetry(message.site, 5, 800).then((data) => {
        if (data) {
          lastJobKey = data.title + '|' + data.company + '|' + (data.url || '');
          chrome.runtime.sendMessage({ type: 'SCRAPED_DATA', data });
          sendResponse({ scraped: true });
        } else {
          sendResponse({ scraped: false, reason: 'No data found after retries' });
        }
      });
      return true; // async sendResponse
    }
  });

  // --- Scrape with retry (waits for SPA DOM to render) ---

  async function scrapeWithRetry(site, maxRetries, delayMs) {
    for (let i = 0; i < maxRetries; i++) {
      const data = scrapeCurrentSite(site);
      if (data && data.title && data.company) return data;
      console.log(`[JobTracker] Scrape attempt ${i + 1}/${maxRetries} - DOM not ready, retrying...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    const lastAttempt = scrapeCurrentSite(site);
    return (lastAttempt && lastAttempt.title && lastAttempt.company) ? lastAttempt : null;
  }

  // --- Scrape dispatcher ---

  function scrapeCurrentSite(site) {
    switch (site) {
      case 'linkedin':
        return typeof window.scrapeLinkedIn === 'function'
          ? window.scrapeLinkedIn()
          : null;
      case 'indeed':
        return typeof window.scrapeIndeed === 'function'
          ? window.scrapeIndeed()
          : null;
      case 'hellowork':
        return typeof window.scrapeHelloWork === 'function'
          ? window.scrapeHelloWork()
          : null;
      default:
        console.warn('[JobTracker] Unknown site:', site);
        return null;
    }
  }

  // --- Panel change detection for listing pages ---

  function tryScrapePanelChange() {
    if (!isListingPage || !currentSite) return;

    const data = scrapeCurrentSite(currentSite);
    if (!data || !data.title || !data.company) return;

    const jobKey = data.title + '|' + data.company + '|' + (data.url || '');
    if (jobKey === lastJobKey) return;

    lastJobKey = jobKey;
    console.log('[JobTracker] Panel change detected, new job:', jobKey);
    chrome.runtime.sendMessage({ type: 'SCRAPED_DATA', data });
  }

  // --- SPA URL change detection (MutationObserver with debounce) ---

  let urlDebounceTimer;
  let panelDebounceTimer;
  let lastPanelCheck = 0;
  const MAX_PANEL_WAIT = 3000;

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      // URL changed — handle via background
      clearTimeout(urlDebounceTimer);
      urlDebounceTimer = setTimeout(() => {
        lastUrl = location.href;
        lastJobKey = null;
        console.log('[JobTracker] SPA navigation detected:', lastUrl);
        chrome.runtime.sendMessage({ type: 'URL_CHANGED', url: lastUrl });
      }, 300);
    } else if (isListingPage) {
      // URL unchanged but DOM mutated on listing page — check for panel change
      const now = Date.now();
      if (now - lastPanelCheck > MAX_PANEL_WAIT) {
        // Force check after max wait (avoids starvation during continuous mutations)
        lastPanelCheck = now;
        tryScrapePanelChange();
      } else {
        clearTimeout(panelDebounceTimer);
        panelDebounceTimer = setTimeout(() => {
          lastPanelCheck = Date.now();
          tryScrapePanelChange();
        }, 800);
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // --- Auto-scrape on initial load ---

  setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'URL_CHANGED', url: location.href });
  }, 1000);
})();
