// HelloWork job scraper
(function () {
  'use strict';

  window.scrapeHelloWork = function () {
    const failedFields = [];

    // Prioritize schema.org microdata selectors
    const title = window.extractField([
      '[itemprop="title"]',
      'h1[itemprop="name"]',
      'h1.offer-title',
      'h1',
    ]);
    if (!title.value) failedFields.push('title');

    const company = window.extractField([
      '[itemprop="hiringOrganization"] [itemprop="name"]',
      '[itemprop="hiringOrganization"]',
      '.offer-company-name',
      '.company-name a',
    ]);
    if (!company.value) failedFields.push('company');

    if (!title.value && !company.value) {
      window.logScrapingResult('HelloWork', null, failedFields);
      return null;
    }

    const location = window.extractField([
      '[itemprop="jobLocation"] [itemprop="address"]',
      '[itemprop="jobLocation"]',
      '.offer-location',
      '.location',
    ]);
    if (!location.value) failedFields.push('location');

    const description = window.extractField([
      '[itemprop="description"]',
      '.offer-description',
      '.job-description',
    ]);
    if (!description.value) failedFields.push('description');

    const data = {
      title: title.value || '',
      company: company.value || '',
      location: location.value || '',
      description: description.value || '',
      url: window.cleanUrl(window.location.href),
      source: 'hellowork',
    };

    window.logScrapingResult('HelloWork', data, failedFields);
    return data;
  };
})();
