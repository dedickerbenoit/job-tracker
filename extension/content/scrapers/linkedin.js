// LinkedIn job scraper
(function () {
  'use strict';

  window.scrapeLinkedIn = function () {
    const failedFields = [];

    const title = window.extractField([
      'h1.t-24.t-bold.inline',
      'h1.topcard__title',
      'h1.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1',
    ]);
    if (!title.value) failedFields.push('title');

    const company = window.extractField([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      'a.topcard__org-name-link',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
    ]);
    if (!company.value) failedFields.push('company');

    // If both title and company are missing, scraping failed
    if (!title.value && !company.value) {
      window.logScrapingResult('LinkedIn', null, failedFields);
      return null;
    }

    const location = window.extractField([
      '.job-details-jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
    ]);
    if (!location.value) failedFields.push('location');

    const description = window.extractField([
      '.jobs-description__content .jobs-box__html-content',
      '.jobs-description-content__text',
      '.show-more-less-html__markup',
      '#job-details > span',
      '.description__text',
    ]);
    if (!description.value) failedFields.push('description');

    const data = {
      title: title.value || '',
      company: company.value || '',
      location: location.value || '',
      description: description.value || '',
      url: window.cleanUrl(window.location.href, ['currentJobId']),
      source: 'linkedin',
    };

    window.logScrapingResult('LinkedIn', data, failedFields);
    return data;
  };
})();
