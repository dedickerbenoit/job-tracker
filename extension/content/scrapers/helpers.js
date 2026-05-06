// Shared scraper helpers
// Loaded before site-specific scrapers via manifest content_scripts order

(function () {
  "use strict";

  /**
   * Try multiple CSS selectors and return the first non-empty match.
   * @param {string[]} selectors - Array of CSS selectors to try
   * @param {string} property - Property to extract (default: 'textContent')
   * @returns {{ value: string|null, selector: string|null }}
   */
  function defineGlobal(name, fn) {
    Object.defineProperty(window, name, {
      value: fn,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }

  // Expose defineGlobal for scrapers loaded after helpers.js
  defineGlobal("defineGlobal", defineGlobal);

  defineGlobal(
    "extractField",
    function (selectors, property = "textContent", scope = document) {
      const root = scope || document;
      for (const selector of selectors) {
        try {
          const el = root.querySelector(selector);
          if (el) {
            const raw =
              property === "href"
                ? el.href
                : el[property] || el.getAttribute(property);
            const value = typeof raw === "string" ? window.cleanText(raw) : raw;
            if (value) return { value, selector };
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }
      return { value: null, selector: null };
    },
  );

  /**
   * Clean whitespace: trim + collapse multiple spaces/newlines.
   */
  defineGlobal("cleanText", function (text) {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
  });

  /**
   * Clean a URL by removing tracking parameters.
   * @param {string} url - The URL to clean
   * @param {string[]} paramsToKeep - Query params to preserve (empty = remove all)
   */
  defineGlobal("cleanUrl", function (url, paramsToKeep = []) {
    try {
      const parsed = new URL(url);
      if (paramsToKeep.length === 0) {
        parsed.search = "";
      } else {
        const keep = new URLSearchParams();
        for (const key of paramsToKeep) {
          if (parsed.searchParams.has(key)) {
            keep.set(key, parsed.searchParams.get(key));
          }
        }
        parsed.search = keep.toString() ? "?" + keep.toString() : "";
      }
      parsed.hash = "";
      return parsed.toString();
    } catch (e) {
      return url;
    }
  });

  /**
   * Find the "detail pane" element on a listing page by trying a list of
   * site-specific selectors in order. Falls back to `document` and logs a
   * warning so that a DOM regression (site redesign) is caught early
   * rather than silently scraping the left-side card list.
   *
   * @param {string[]} selectors - Ordered list of CSS selectors to try
   * @param {string} siteLabel - Human-readable site name for logs
   * @returns {Document|Element}
   */
  defineGlobal("findDetailScope", function (selectors, siteLabel) {
    for (var i = 0; i < selectors.length; i++) {
      try {
        var el = document.querySelector(selectors[i]);
        if (el) return el;
      } catch (e) {
        // Invalid selector, skip
      }
    }
    if (window.__JOBTRACKER_DEBUG__) {
      console.warn(
        "[JobTracker] Detail pane not found on " +
          siteLabel +
          " listing page — DOM may have changed. Falling back to document scope.",
      );
    }
    return document;
  });

  /**
   * Log scraping results for debugging.
   */
  defineGlobal("logScrapingResult", function (site, data, failedFields) {
    if (!window.__JOBTRACKER_DEBUG__) return;
    console.group(`[JobTracker] ${site} scraping result`);
    if (data) {
      console.log("Data:", data);
    } else {
      console.warn("Scraping failed - no data extracted");
    }
    if (failedFields && failedFields.length > 0) {
      console.warn("Failed fields:", failedFields);
    }
    console.groupEnd();
  });
})();
