// Indeed job scraper
(function () {
  'use strict';

  window.scrapeIndeed = function () {
    const failedFields = [];

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
      url: window.cleanUrl(window.location.href, ['jk']),
      source: 'indeed',
    };

    window.logScrapingResult('Indeed', data, failedFields);
    return data;
  };
})();
