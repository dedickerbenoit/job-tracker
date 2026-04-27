const SITE_PATTERNS = [
  // Detail pages (more specific, matched first)
  {
    regex: /linkedin\.com\/jobs\/view\//,
    site: "linkedin",
    name: "LinkedIn",
    source: "linkedin",
    listing: false,
  },
  {
    regex: /indeed\.(com|fr|co\.\w+)\/viewjob/,
    site: "indeed",
    name: "Indeed",
    source: "indeed",
    listing: false,
  },
  {
    regex: /hellowork\.com\/fr-fr\/emplois\//,
    site: "hellowork",
    name: "HelloWork",
    source: "hellowork",
    listing: false,
  },
  // Listing pages (broader patterns)
  {
    regex: /linkedin\.com\/jobs\//,
    site: "linkedin",
    name: "LinkedIn",
    source: "linkedin",
    listing: true,
  },
  {
    regex: /indeed\.(com|fr|co\.\w+)\/(jobs|emplois|recherche|q-)/,
    site: "indeed",
    name: "Indeed",
    source: "indeed",
    listing: true,
  },
  {
    regex: /indeed\.(com|fr|co\.\w+)\/.*[?&]vjk=/,
    site: "indeed",
    name: "Indeed",
    source: "indeed",
    listing: true,
  },
];

export function detectJobSite(url) {
  if (!url)
    return {
      detected: false,
      site: null,
      source: null,
      name: null,
      listing: false,
    };

  for (const pattern of SITE_PATTERNS) {
    if (pattern.regex.test(url)) {
      return {
        detected: true,
        site: pattern.site,
        source: pattern.source,
        name: pattern.name,
        listing: pattern.listing,
      };
    }
  }

  return {
    detected: false,
    site: null,
    source: null,
    name: null,
    listing: false,
  };
}
