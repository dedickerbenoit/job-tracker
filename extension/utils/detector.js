const SITE_PATTERNS = {
  linkedin: {
    regex: /https:\/\/(www\.)?linkedin\.com\/jobs\/view\//,
    name: 'LinkedIn',
    source: 'linkedin',
  },
  indeed: {
    regex: /https:\/\/(www\.|[a-z]{2}\.)?indeed\.(com|fr|co\.\w+)\/viewjob/,
    name: 'Indeed',
    source: 'indeed',
  },
  hellowork: {
    regex: /https:\/\/(www\.)?hellowork\.com\/fr-fr\/emplois\//,
    name: 'HelloWork',
    source: 'hellowork',
  },
};

export function detectJobSite(url) {
  if (!url) return { detected: false, site: null, source: null, name: null };

  for (const [site, pattern] of Object.entries(SITE_PATTERNS)) {
    if (pattern.regex.test(url)) {
      return {
        detected: true,
        site,
        source: pattern.source,
        name: pattern.name,
      };
    }
  }

  return { detected: false, site: null, source: null, name: null };
}
