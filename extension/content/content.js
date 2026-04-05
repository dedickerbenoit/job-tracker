// Content script - coordinates scraping across job sites
// NOTE: No ES module imports (content scripts don't support modules)

(function () {
  'use strict';

  let lastUrl = location.href;

  console.log('[JobTracker] Content script loaded on', location.hostname);

  // --- Message listener ---

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPE_JOB_DATA') {
      scrapeWithRetry(message.site, 5, 800).then((data) => {
        if (data) {
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

  // --- SPA URL change detection (MutationObserver with debounce) ---

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('[JobTracker] SPA navigation detected:', lastUrl);
        chrome.runtime.sendMessage({ type: 'URL_CHANGED', url: lastUrl });
      }
    }, 300);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // --- Auto-scrape on initial load ---

  setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'URL_CHANGED', url: location.href });
  }, 1000);
})();
