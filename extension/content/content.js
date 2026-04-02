// Content script - coordinates scraping across job sites
// NOTE: No ES module imports (content scripts don't support modules)

(function () {
  'use strict';

  let lastUrl = location.href;

  console.log('[JobTracker] Content script loaded on', location.hostname);

  // --- Message listener ---

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPE_JOB_DATA') {
      const data = scrapeCurrentSite(message.site);
      if (data) {
        chrome.runtime.sendMessage({ type: 'SCRAPED_DATA', data });
        sendResponse({ scraped: true });
      } else {
        sendResponse({ scraped: false, reason: 'No data found' });
      }
    }
  });

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
