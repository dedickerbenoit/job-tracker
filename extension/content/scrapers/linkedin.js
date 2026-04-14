// LinkedIn job scraper
(function () {
  'use strict';

  // Generic titles that should not be used as job titles
  var GENERIC_TITLES = ['collections', 'recommendations', 'search', 'jobs', 'linkedin', 'home', 'feed'];

  // Build canonical URL: /jobs/view/{id}/ from currentJobId param or current URL
  function buildCanonicalUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var jobId = params.get('currentJobId');
      if (jobId && /^\d+$/.test(jobId)) {
        return 'https://www.linkedin.com/jobs/view/' + jobId + '/';
      }
    } catch (e) {
      // fallback below
    }
    // Already on a detail page — clean the URL
    return window.cleanUrl(window.location.href, ['currentJobId']);
  }

  // Strategy 1: Extract from JSON-LD structured data (most reliable)
  function tryJsonLd() {
    try {
      var scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (var i = 0; i < scripts.length; i++) {
        var json = JSON.parse(scripts[i].textContent);
        if (json['@type'] === 'JobPosting') {
          return {
            title: json.title || '',
            company: json.hiringOrganization?.name || '',
            location: json.jobLocation?.address?.addressLocality
              || json.jobLocation?.name || '',
            description: json.description || '',
          };
        }
      }
    } catch (e) {
      console.log('[JobTracker] JSON-LD parsing failed:', e.message);
    }
    return null;
  }

  // Strategy 2: Heuristic extraction (resilient to hashed CSS classes)
  function tryHeuristic() {
    var title = '';
    var company = '';
    var location = '';
    var description = '';

    // Company: first visible link pointing to /company/ with text
    var companyLink = [...document.querySelectorAll('a[href*="/company/"]')]
      .find(function (a) {
        var t = a.textContent.trim();
        return t.length > 1 && t.length < 80;
      });
    if (companyLink) {
      company = window.cleanText(companyLink.textContent);
    }

    // Title: try heading near the company link first (works on both detail and listing panels)
    if (companyLink) {
      var container = companyLink.closest('div');
      for (var i = 0; i < 3 && container; i++) container = container.parentElement;
      if (container) {
        var heading = container.querySelector('h1, h2');
        // Verify the heading appears before the company link in DOM order
        if (heading && (companyLink.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_PRECEDING)) {
          var headingText = window.cleanText(heading.textContent);
          if (headingText.length > 1 && headingText.length < 120) {
            title = headingText;
          }
        }
      }
    }

    // Fallback: extract from document.title, filtering generic titles
    if (!title && document.title) {
      var raw = document.title
        .replace(/^\(\d+\)\s*/, '')          // remove notification count
        .replace(/\s*[|]\s*LinkedIn\s*$/i, ''); // remove "| LinkedIn"
      var parts = raw.split(/\s*[|–]\s*/);
      var candidate = window.cleanText(parts[0]);
      // Check if the title is generic
      var isGeneric = GENERIC_TITLES.some(function (g) {
        return candidate.toLowerCase() === g;
      });
      if (!isGeneric && candidate.length > 1) {
        title = candidate;
      }
      // If company wasn't found via link, use second part
      if (!company && parts.length > 1) {
        company = window.cleanText(parts[1]);
      }
    }

    // Location: <p> containing · near the company link
    var anchor = companyLink || document.querySelector('[data-display-contents]');
    if (anchor) {
      var section = anchor.closest('div');
      // Walk up a few levels to get the job info container
      for (var j = 0; j < 4 && section; j++) section = section.parentElement;
      if (section) {
        var paragraphs = section.querySelectorAll('p');
        for (var k = 0; k < paragraphs.length; k++) {
          var text = window.cleanText(paragraphs[k].textContent);
          if (text.includes('\u00B7') && text.length < 200) {
            location = text.split('\u00B7')[0].trim();
            break;
          }
        }
      }
    }

    // Description: content after "À propos de l'offre" / "About the job" heading
    var headings = document.querySelectorAll('h2');
    for (var m = 0; m < headings.length; m++) {
      var hText = headings[m].textContent.toLowerCase();
      if (hText.includes('propos de l') || hText.includes('about the job')) {
        var descEl = headings[m].nextElementSibling;
        if (!descEl) descEl = headings[m].parentElement?.nextElementSibling;
        if (descEl) {
          description = window.cleanText(descEl.textContent);
        }
        break;
      }
    }

    return { title: title, company: company, location: location, description: description };
  }

  window.defineGlobal('scrapeLinkedIn', function () {
    var failedFields = [];
    var canonicalUrl = buildCanonicalUrl();

    // Strategy 1: JSON-LD
    var jsonLd = tryJsonLd();
    if (jsonLd && jsonLd.title && jsonLd.company) {
      var data = {
        title: window.cleanText(jsonLd.title),
        company: window.cleanText(jsonLd.company),
        location: window.cleanText(jsonLd.location),
        description: window.cleanText(jsonLd.description),
        url: canonicalUrl,
        source: 'linkedin',
      };
      window.logScrapingResult('LinkedIn', data, []);
      return data;
    }

    // Strategy 2: Heuristic
    var h = tryHeuristic();
    if (h.title && h.company) {
      var hFailedFields = [];
      if (!h.location) hFailedFields.push('location');
      if (!h.description) hFailedFields.push('description');
      var data2 = {
        title: h.title,
        company: h.company,
        location: h.location,
        description: h.description,
        url: canonicalUrl,
        source: 'linkedin',
      };
      window.logScrapingResult('LinkedIn', data2, hFailedFields);
      return data2;
    }

    // Strategy 3: Classic CSS selectors (older LinkedIn layouts / public pages)
    var title = window.extractField([
      'h1.job-details-jobs-unified-top-card__job-title',
      'h1.top-card-layout__title',
      'h1.topcard__title',
      'h1',
    ]);
    if (!title.value) failedFields.push('title');

    var company = window.extractField([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      'a.topcard__org-name-link',
      'span.topcard__flavor a',
    ]);
    if (!company.value) failedFields.push('company');

    if (!title.value && !company.value) {
      // Use partial heuristic results as last resort
      if (h.title || h.company) {
        var data3 = {
          title: h.title || '',
          company: h.company || '',
          location: h.location || '',
          description: h.description || '',
          url: canonicalUrl,
          source: 'linkedin',
        };
        window.logScrapingResult('LinkedIn', data3, failedFields);
        return data3;
      }
      window.logScrapingResult('LinkedIn', null, failedFields);
      return null;
    }

    var loc = window.extractField([
      '.job-details-jobs-unified-top-card__bullet',
      'span.topcard__flavor--bullet',
    ]);
    if (!loc.value) failedFields.push('location');

    var desc = window.extractField([
      '.jobs-description__content .jobs-box__html-content',
      '.show-more-less-html__markup',
      '#job-details > span',
      '#job-details',
    ]);
    if (!desc.value) failedFields.push('description');

    var data4 = {
      title: title.value || h.title || '',
      company: company.value || h.company || '',
      location: loc.value || h.location || '',
      description: desc.value || h.description || '',
      url: canonicalUrl,
      source: 'linkedin',
    };

    window.logScrapingResult('LinkedIn', data4, failedFields);
    return data4;
  });
})();
