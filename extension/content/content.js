// Content script - coordinates scraping across job sites
// NOTE: No ES module imports (content scripts don't support modules)

(function () {
  "use strict";

  let lastUrl = location.href;
  let isListingPage = false;
  let currentSite = null;
  let _lastJobKey = null;

  console.log("[JobTracker] Content script loaded on", location.hostname);

  // --- Message listener ---

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SCRAPE_JOB_DATA") {
      currentSite = message.site;
      isListingPage = !!message.listing;

      if (isListingPage) {
        console.log(
          "[JobTracker] Listing page mode activated for",
          currentSite,
        );
        // Reset _lastJobKey so first panel scrape goes through
        _lastJobKey = null;
      }

      scrapeWithRetry(message.site, 5, 800, isListingPage).then((data) => {
        if (data) {
          _lastJobKey =
            data.title + "|" + data.company + "|" + (data.url || "");
          chrome.runtime.sendMessage({ type: "SCRAPED_DATA", data });
          sendResponse({ scraped: true });
        } else {
          sendResponse({
            scraped: false,
            reason: "No data found after retries",
          });
        }
      });
      return true; // async sendResponse
    }
  });

  // --- Scrape with retry (waits for SPA DOM to render) ---

  async function scrapeWithRetry(site, maxRetries, delayMs, listing) {
    for (let i = 0; i < maxRetries; i++) {
      const data = scrapeCurrentSite(site, listing);
      if (data && data.title && data.company) return data;
      console.log(
        `[JobTracker] Scrape attempt ${i + 1}/${maxRetries} - DOM not ready, retrying...`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
    const lastAttempt = scrapeCurrentSite(site, listing);
    return lastAttempt && lastAttempt.title && lastAttempt.company
      ? lastAttempt
      : null;
  }

  // --- Scrape dispatcher ---

  function scrapeCurrentSite(site, listing) {
    switch (site) {
      case "linkedin":
        return typeof window.scrapeLinkedIn === "function"
          ? window.scrapeLinkedIn(listing)
          : null;
      case "indeed":
        return typeof window.scrapeIndeed === "function"
          ? window.scrapeIndeed(listing)
          : null;
      case "hellowork":
        return typeof window.scrapeHelloWork === "function"
          ? window.scrapeHelloWork(listing)
          : null;
      default:
        console.warn("[JobTracker] Unknown site:", site);
        return null;
    }
  }

  // --- SPA URL change detection (MutationObserver with debounce) ---
  // RGPD: only detect URL changes for badge update, no auto-scraping

  let urlDebounceTimer;

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      clearTimeout(urlDebounceTimer);
      urlDebounceTimer = setTimeout(() => {
        lastUrl = location.href;
        _lastJobKey = null;
        console.log("[JobTracker] SPA navigation detected:", lastUrl);
        chrome.runtime.sendMessage({ type: "URL_CHANGED", url: lastUrl });
      }, 300);
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Notify background of initial URL (for badge detection only, no scraping)
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "URL_CHANGED", url: location.href });
  }, 1000);
})();
