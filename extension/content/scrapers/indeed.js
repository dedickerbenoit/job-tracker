// Indeed job scraper
(function () {
  'use strict';

  // Build canonical URL: /viewjob?jk={id} from vjk/jk param or DOM link
  function buildCanonicalUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var jobKey = params.get('vjk') || params.get('jk');
      if (jobKey && /^[a-f0-9]+$/i.test(jobKey)) {
        return 'https://' + window.location.hostname + '/viewjob?jk=' + encodeURIComponent(jobKey);
      }
      // Fallback: find a viewjob link in the DOM (selected job in listing)
      var link = document.querySelector('a[href*="/viewjob?jk="]');
      if (link) {
        var linkUrl = new URL(link.href);
        var linkJk = linkUrl.searchParams.get('jk');
        if (linkJk && /^[a-f0-9]+$/i.test(linkJk)) {
          return 'https://' + window.location.hostname + '/viewjob?jk=' + encodeURIComponent(linkJk);
        }
      }
    } catch (e) {
      // fallback below
    }
    // Already on a detail page — clean the URL
    return window.cleanUrl(window.location.href, ['jk']);
  }

  window.defineGlobal('scrapeIndeed', function () {
    const failedFields = [];
    const canonicalUrl = buildCanonicalUrl();

    const title = window.extractField([
      'h1.jobsearch-JobInfoHeader-title',
      '.jobsearch-JobInfoHeader-title',
      'h2.jobTitle',
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      'h1',
    ]);
    if (!title.value) failedFields.push('title');

    const company = window.extractField([
      '[data-testid="inlineHeader-companyName"] a',
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-InlineCompanyRating a',
      '.jobsearch-InlineCompanyRating div',
      '.jobsearch-CompanyInfoWithoutHeaderImage a',
      '[data-company-name="true"]',
    ]);
    if (!company.value) failedFields.push('company');

    if (!title.value && !company.value) {
      window.logScrapingResult('Indeed', null, failedFields);
      return null;
    }

    const location = window.extractField([
      '[data-testid="inlineHeader-companyLocation"] div',
      '[data-testid="inlineHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle div:last-child',
      '.jobsearch-InlineCompanyRating + div',
      '#jobLocationText',
    ]);
    if (!location.value) failedFields.push('location');

    const description = window.extractField([
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      '.jobsearch-JobComponent-description',
    ]);
    if (!description.value) failedFields.push('description');

    const data = {
      title: title.value || '',
      company: company.value || '',
      location: location.value || '',
      description: description.value || '',
      url: canonicalUrl,
      source: 'indeed',
    };

    window.logScrapingResult('Indeed', data, failedFields);
    return data;
  });
})();
