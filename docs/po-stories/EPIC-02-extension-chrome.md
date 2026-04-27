# EPIC 02 : Extension Chrome - Capture d'offres d'emploi

## Vue d'ensemble

Permettre aux utilisateurs de capturer automatiquement les informations des offres d'emploi depuis LinkedIn, Indeed et HelloWork via une extension Chrome.

## User stories incluses

- US-101 : Detection automatique du site d'offres d'emploi (3 SP)
- US-102 : Scraping des informations de l'offre (LinkedIn) (8 SP)
- US-103 : Scraping des informations de l'offre (Indeed) (8 SP)
- US-104 : Scraping des informations de l'offre (HelloWork) (8 SP)
- US-105 : Envoi des donnees vers l'API (5 SP)
- US-106 : Feedback visuel de confirmation (3 SP)
- US-107 : Gestion des erreurs et retry (8 SP)
- US-108 : Mode manuel de saisie (fallback scraping) (3 SP)
- US-109 : Configuration des sites a surveiller (2 SP)

**Total : 48 story points**

## Priorite

P0 - Fonctionnalite core de l'application

## Dependances techniques

- Manifest V3 (derniere version Chrome Extension)
- Content scripts pour scraper les pages
- Background service worker pour l'API
- Popup pour l'UI

---

# US-101 : Detection automatique du site d'offres d'emploi

## En tant que

Utilisateur de l'extension

## Je veux

Que l'extension detecte automatiquement si je suis sur une page d'offre d'emploi

## Afin de

Savoir si je peux capturer l'offre ou pas

## Criteres d'acceptation

- [ ] L'extension detecte les URLs suivantes :
  - LinkedIn : `https://www.linkedin.com/jobs/view/*`
  - Indeed : `https://fr.indeed.com/viewjob*` ou `https://www.indeed.com/viewjob*`
  - HelloWork : `https://www.hellowork.com/*/emploi/*`
- [ ] Si URL detectee, l'icone de l'extension change de couleur (gris → vert)
- [ ] Si URL detectee, le badge de l'extension affiche "✓"
- [ ] Si URL non detectee, le popup affiche "Aucune offre detectee sur cette page"
- [ ] La detection fonctionne meme si l'URL change en SPA (sans reload)

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels sur les 3 sites
- [ ] Code review effectuee
- [ ] Extension testee sur Chrome et Edge

## Contexte technique

**Extension :**

- Fichier `content-script.js` injecte sur les domaines cibles
- Utilisation de `manifest.json` avec `content_scripts` :

```json
{
  "content_scripts": [
    {
      "matches": [
        "https://www.linkedin.com/jobs/*",
        "https://*.indeed.com/*",
        "https://www.hellowork.com/*/*"
      ],
      "js": ["content-script.js"]
    }
  ]
}
```

- Detection via regex sur `window.location.href`
- Communication avec le background script via `chrome.runtime.sendMessage`
- Changement de l'icone via `chrome.action.setIcon`

**Patterns de detection :**

```javascript
const JOB_PATTERNS = {
  linkedin: /^https:\/\/www\.linkedin\.com\/jobs\/view\/\d+/,
  indeed: /^https:\/\/[a-z]{2}\.indeed\.com\/viewjob/,
  hellowork: /^https:\/\/www\.hellowork\.com\/[^\/]+\/emploi\//,
};
```

**Detection des changements d'URL en SPA :**

- Utiliser un `MutationObserver` ou `setInterval(1000)` pour surveiller `window.location.href`
- Ou ecouter les events `popstate` et `pushstate` (override de history.pushState)
- Re-verifier les patterns d'URL a chaque changement detecte
- Mettre a jour l'icone et le badge en consequence

## Dependances

- Bloque par : US-007 (auth extension)
- Bloque : US-102, US-103, US-104

## Estimation

Story points : 3
Complexite : Faible

## Notes

- Prevoir l'ajout de nouveaux sites facilement (architecture extensible)
- Tester avec les URLs en HTTP/HTTPS

---

# US-102 : Scraping des informations de l'offre (LinkedIn)

## En tant que

Utilisateur sur une page d'offre LinkedIn

## Je veux

Que l'extension capture automatiquement les informations de l'offre

## Afin de

Ne pas avoir a recopier manuellement les informations

## Criteres d'acceptation

- [ ] Au clic sur l'icone extension, si l'offre est sur LinkedIn, scraping automatique des champs :
  - Titre du poste (obligatoire)
  - Entreprise (obligatoire)
  - Localisation (obligatoire)
  - URL de l'offre (window.location.href)
  - Description complete (optionnel)
  - Type de contrat (CDI, CDD, etc.) si disponible
  - Date de publication si disponible
- [ ] Si un selecteur echoue, tenter des selecteurs alternatifs (fallback)
- [ ] Si tous les selecteurs echouent pour un champ obligatoire, afficher "Scraping partiel, verifiez les champs"
- [ ] Logger les echecs de selecteurs dans `chrome.storage.local` pour monitoring
- [ ] Affichage d'un apercu des donnees scrapees dans le popup
- [ ] Possibilite d'editer les champs avant d'envoyer
- [ ] Si un champ obligatoire est manquant, affichage d'une alerte
- [ ] Bouton "Ajouter a mes candidatures" pour valider

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels sur 10+ offres LinkedIn variees
- [ ] Gestion des erreurs de scraping
- [ ] Code review effectuee

## Contexte technique

**Scraping LinkedIn :**

- Les selecteurs CSS peuvent changer, prevoir une logique de fallback
- Exemple de selecteurs avec fallbacks (a valider) :

```javascript
const linkedinSelectors = {
  title: [
    ".top-card-layout__title",
    ".jobs-unified-top-card__job-title",
    "h1.t-24",
  ],
  company: [
    ".topcard__org-name-link",
    ".jobs-unified-top-card__company-name",
    "a.ember-view",
  ],
  location: [
    ".topcard__flavor--bullet",
    ".jobs-unified-top-card__bullet",
    "span.jobs-unified-top-card__workplace-type",
  ],
  description: [
    ".description__text",
    ".jobs-description__content",
    'div[class*="description"]',
  ],
};

// Fonction de scraping avec fallback
function scrapeField(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText.trim()) {
      return element.innerText.trim();
    }
  }
  return null; // Aucun selecteur n'a fonctionne
}
```

- Utilisation de `document.querySelector` avec tentatives multiples
- Nettoyage du texte (trim, suppression des espaces multiples)
- Logging des selecteurs qui echouent pour mise a jour future

**Popup :**

- Affichage des champs dans un formulaire
- Inputs editables
- Validation avant envoi

## Dependances

- Bloque par : US-101, US-007 (auth extension)
- Bloque : US-105

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- LinkedIn peut changer ses selecteurs CSS a tout moment
- Prevoir un systeme de logs pour debugger les echecs de scraping
- Possibilite d'ajouter un mode "manuel" si le scraping echoue (voir US-108)

---

# US-103 : Scraping des informations de l'offre (Indeed)

## En tant que

Utilisateur sur une page d'offre Indeed

## Je veux

Que l'extension capture automatiquement les informations de l'offre

## Afin de

Ne pas avoir a recopier manuellement les informations

## Criteres d'acceptation

- [ ] Au clic sur l'icone extension, si l'offre est sur Indeed, scraping automatique des champs :
  - Titre du poste (obligatoire)
  - Entreprise (obligatoire)
  - Localisation (obligatoire)
  - URL de l'offre
  - Description complete (optionnel)
  - Salaire si affiche
  - Type de contrat si disponible
- [ ] Si un selecteur echoue, tenter des selecteurs alternatifs (fallback)
- [ ] Si tous les selecteurs echouent pour un champ obligatoire, afficher "Scraping partiel, verifiez les champs"
- [ ] Logger les echecs de selecteurs dans `chrome.storage.local` pour monitoring
- [ ] Affichage d'un apercu des donnees scrapees dans le popup
- [ ] Possibilite d'editer les champs avant d'envoyer
- [ ] Si un champ obligatoire est manquant, affichage d'une alerte
- [ ] Bouton "Ajouter a mes candidatures" pour valider

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels sur 10+ offres Indeed variees
- [ ] Gestion des erreurs de scraping
- [ ] Code review effectuee

## Contexte technique

**Scraping Indeed :**

- Indeed a plusieurs layouts selon les pays/langues, fallbacks critiques
- Exemple de selecteurs avec fallbacks (a valider) :

```javascript
const indeedSelectors = {
  title: [
    ".jobsearch-JobInfoHeader-title",
    'h1[class*="jobTitle"]',
    ".icl-u-xs-mb--xs",
  ],
  company: [
    '[data-testid="company-name"]',
    "[data-company-name]",
    'div[class*="companyName"]',
  ],
  location: [
    '[data-testid="job-location"]',
    'div[class*="companyLocation"]',
    ".jobsearch-JobInfoHeader-subtitle",
  ],
  description: [
    "#jobDescriptionText",
    'div[id*="jobDesc"]',
    ".jobsearch-jobDescriptionText",
  ],
};
```

- Utiliser la meme logique de fallback que LinkedIn (fonction `scrapeField`)

## Dependances

- Bloque par : US-101, US-007 (auth extension)
- Bloque : US-105

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- Indeed affiche parfois des offres en iframe (cas complexe)
- Tester sur Indeed FR et Indeed US si applicable
- Possibilite d'ajouter un mode "manuel" si le scraping echoue (voir US-108)

---

# US-104 : Scraping des informations de l'offre (HelloWork)

## En tant que

Utilisateur sur une page d'offre HelloWork

## Je veux

Que l'extension capture automatiquement les informations de l'offre

## Afin de

Ne pas avoir a recopier manuellement les informations

## Criteres d'acceptation

- [ ] Au clic sur l'icone extension, si l'offre est sur HelloWork, scraping automatique des champs :
  - Titre du poste (obligatoire)
  - Entreprise (obligatoire)
  - Localisation (obligatoire)
  - URL de l'offre
  - Description complete (optionnel)
  - Salaire si affiche
  - Type de contrat si disponible
- [ ] Si un selecteur echoue, tenter des selecteurs alternatifs (fallback)
- [ ] Si tous les selecteurs echouent pour un champ obligatoire, afficher "Scraping partiel, verifiez les champs"
- [ ] Logger les echecs de selecteurs dans `chrome.storage.local` pour monitoring
- [ ] Affichage d'un apercu des donnees scrapees dans le popup
- [ ] Possibilite d'editer les champs avant d'envoyer
- [ ] Si un champ obligatoire est manquant, affichage d'une alerte
- [ ] Bouton "Ajouter a mes candidatures" pour valider

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels sur 10+ offres HelloWork variees
- [ ] Gestion des erreurs de scraping
- [ ] Code review effectuee

## Contexte technique

**Scraping HelloWork :**

- HelloWork a une structure HTML plus stable que LinkedIn/Indeed (utilise des microdata schema.org)
- Exemple de selecteurs avec fallbacks (a valider) :

```javascript
const helloworkSelectors = {
  title: ['[itemprop="title"]', "h1.offer-title", "h1"],
  company: [
    '[itemprop="hiringOrganization"]',
    ".company-name",
    'div[class*="company"]',
  ],
  location: [
    '[itemprop="jobLocation"]',
    ".offer-location",
    'span[class*="location"]',
  ],
  description: [
    '[itemprop="description"]',
    ".offer-description",
    'div[class*="description"]',
  ],
};
```

- Utiliser la meme logique de fallback que LinkedIn et Indeed

## Dependances

- Bloque par : US-101, US-007 (auth extension)
- Bloque : US-105

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- HelloWork est un site francais, moins de variations que LinkedIn/Indeed
- Possibilite d'ajouter un mode "manuel" si le scraping echoue (voir US-108)

---

# US-105 : Envoi des donnees vers l'API

## En tant que

Utilisateur ayant capture une offre

## Je veux

Que l'extension envoie automatiquement l'offre vers mon compte JobTracker

## Afin de

Retrouver l'offre dans mon dashboard

## Criteres d'acceptation

- [ ] Au clic sur "Ajouter a mes candidatures", appel POST vers l'API `/api/applications`
- [ ] Payload JSON contenant :

```json
{
  "title": "...",
  "company": "...",
  "location": "...",
  "url": "...",
  "description": "...",
  "source": "linkedin|indeed|hellowork",
  "status": "to_apply"
}
```

- [ ] Avant l'envoi, verifier la presence et la validite du token JWT :
  - Si token absent ou expire (erreur 401 de l'API) : afficher "Session expiree, reconnectez-vous" et ouvrir le login
  - Sinon : poursuivre l'envoi
- [ ] Header Authorization avec le token JWT
- [ ] Gestion du loading pendant l'envoi (spinner)
- [ ] En cas de succes (201) :
  - Message "Offre ajoutee avec succes"
  - Fermeture automatique du popup apres 2 secondes
- [ ] En cas d'erreur reseau (timeout, 500) :
  - Message "Erreur lors de l'ajout, reessayez"
  - Bouton "Reessayer"
- [ ] En cas de doublon detecte (warning de l'API) :
  - Affichage du message "Cette offre ressemble a une candidature existante"
  - Bouton "Ajouter quand meme" et "Voir la candidature"

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels de bout en bout
- [ ] Tests des cas d'erreur
- [ ] Code review effectuee

## Contexte technique

**Extension :**

- Utilisation de `fetch` dans le background script
- Token recupere depuis `chrome.storage.local`
- Timeout de 10 secondes
- Retry automatique apres echec (max 3 tentatives)

**API :**

- Route POST `/api/applications`
- Auth middleware
- Retourne la candidature creee avec son ID

## Dependances

- Bloque par : US-102, US-103, US-104, US-007
- Bloque : US-106

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Prevoir un mode offline : stocker localement et syncer plus tard
- Logger les erreurs pour debugging

---

# US-106 : Feedback visuel de confirmation

## En tant que

Utilisateur ayant ajoute une offre

## Je veux

Avoir un feedback visuel clair que l'offre a ete ajoutee

## Afin de

Etre sur que l'action a fonctionne

## Criteres d'acceptation

- [ ] Apres succes de l'envoi, affichage d'un toast/notification dans le popup
- [ ] Le toast contient :
  - Icone de succes (checkmark vert)
  - Message "Offre ajoutee avec succes"
  - Lien "Voir dans le dashboard" (ouvre le dashboard dans un nouvel onglet)
- [ ] Le toast disparait automatiquement apres 3 secondes
- [ ] Le badge de l'extension affiche temporairement "✓" pendant 5 secondes
- [ ] Si l'utilisateur re-clique sur l'extension sur la meme offre, affichage "Offre deja ajoutee"

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels
- [ ] Code review effectuee

## Contexte technique

**Extension :**

- Utilisation de `chrome.notifications` pour les notifications systeme (optionnel)
- Ou notification custom dans le popup avec CSS animations
- Stockage temporaire des URLs deja ajoutees dans `chrome.storage.local` (cache de 7 jours)

**Detection des offres deja ajoutees :**

- Stocker les URLs des offres ajoutees dans `chrome.storage.local` avec timestamp

```javascript
{
  "added_urls": {
    "https://linkedin.com/jobs/view/123": { "added_at": 1234567890, "application_id": 45 },
    "https://indeed.com/viewjob?jk=456": { "added_at": 1234567891, "application_id": 46 }
  }
}
```

- Au scraping, verifier si `window.location.href` existe dans `added_urls`
- Si oui et age < 7 jours, afficher "Offre deja ajoutee le [date]" avec lien vers le dashboard
- Nettoyer les entrees de plus de 7 jours automatiquement

## Dependances

- Bloque par : US-105

## Estimation

Story points : 3
Complexite : Faible

## Notes

- Faire des animations fluides pour une meilleure UX

---

# US-107 : Gestion des erreurs et retry

## En tant que

Utilisateur de l'extension

## Je veux

Que l'extension gere les erreurs de maniere intelligente

## Afin de

Ne pas perdre mes donnees en cas de probleme reseau

## Criteres d'acceptation

- [ ] En cas d'erreur reseau (offline, timeout) :
  - Message clair "Pas de connexion Internet, l'offre sera sauvegardee localement"
  - L'offre est stockee dans `chrome.storage.local` avec un flag `pending: true`
  - Un badge sur l'icone indique le nombre d'offres en attente de sync
- [ ] En cas de token expire :
  - Message "Session expiree, reconnectez-vous"
  - Redirection vers le login
- [ ] En cas d'erreur serveur (500) :
  - Retry automatique apres 5 secondes (max 3 fois)
  - Si echec apres 3 tentatives : stockage local + message
- [ ] Au retour de la connexion (event `online`), effectuer un ping sur `/api/health` :
  - Si API repond 200, declencher la sync automatique de la queue
  - Si API ne repond pas, ne rien faire (retry plus tard)
- [ ] Bouton "Synchroniser maintenant" dans le popup pour forcer la sync

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels en mode offline
- [ ] Tests des scenarios de retry
- [ ] Code review effectuee

## Contexte technique

**Extension :**

- Utilisation de `navigator.onLine` pour detecter le statut reseau
- Event listeners sur `online` et `offline`
- Queue de sync dans `chrome.storage.local` :

```json
{
  "pending_applications": [
    { "title": "...", "company": "...", ... }
  ]
}
```

- Background script qui ecoute les changements de connexion
- Exponential backoff pour les retries

## Dependances

- Bloque par : US-105

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- Crucial pour une bonne UX, surtout si l'utilisateur est en mobilite
- Prevoir un maximum de 50 offres en queue (sinon alerte)

---

# US-108 : Mode manuel de saisie (fallback scraping)

## En tant que

Utilisateur sur une offre dont le scraping a echoue

## Je veux

Saisir manuellement les informations de l'offre

## Afin de

Pouvoir quand meme ajouter l'offre a mes candidatures sans dependre du scraping

## Criteres d'acceptation

- [ ] Si le scraping echoue (champ obligatoire manquant), afficher un bouton "Saisie manuelle"
- [ ] Au clic sur "Saisie manuelle", afficher un formulaire vide dans le popup
- [ ] Pre-remplir les champs qui ont reussi a etre scrapes (ex: URL, source detectee automatiquement)
- [ ] Formulaire contenant les champs :
  - Titre du poste (input text, requis)
  - Entreprise (input text, requis)
  - Localisation (input text, requis)
  - URL (input url, requis, pre-rempli avec `window.location.href`)
  - Description (textarea, optionnel)
  - Type de contrat (select, optionnel)
  - Salaire (input text, optionnel)
- [ ] Validation front-end des champs obligatoires
- [ ] Bouton "Ajouter a mes candidatures" pour valider
- [ ] Meme comportement d'envoi vers l'API que US-105

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels sur les 3 sites avec scraping force a echouer
- [ ] Code review effectuee

## Contexte technique

**Extension :**

- Composant `ManualForm.jsx` ou HTML/CSS simple dans le popup
- Reutiliser la logique d'envoi API de US-105
- Stocker les donnees saisies dans `chrome.storage.local` en cas d'echec reseau (comme US-107)

**Declenchement du mode manuel :**

```javascript
// Dans content-script.js
const scrapedData = scrapeSite();
if (!scrapedData.title || !scrapedData.company || !scrapedData.location) {
  // Afficher le bouton "Saisie manuelle" dans le popup
  chrome.runtime.sendMessage({ type: "SCRAPING_PARTIAL", data: scrapedData });
}
```

## Dependances

- Bloque par : US-102, US-103, US-104, US-105
- Bloque : Aucune (optionnel)

## Estimation

Story points : 3
Complexite : Faible

## Notes

- Ce mode manuel est un excellent fallback pour garantir une UX complete
- Peut aussi servir pour ajouter des offres depuis d'autres sites non supportes

---

# US-109 : Configuration des sites a surveiller

## En tant que

Utilisateur de l'extension

## Je veux

Activer ou desactiver la detection sur LinkedIn, Indeed, ou HelloWork

## Afin de

Eviter les notifications et badges sur les sites que je n'utilise pas

## Criteres d'acceptation

- [ ] Dans le popup, ajouter un onglet ou section "Parametres"
- [ ] Afficher 3 checkboxes avec labels :
  - ☑ LinkedIn
  - ☑ Indeed
  - ☑ HelloWork
- [ ] Par defaut, les 3 sites sont actives (checked)
- [ ] Au clic sur une checkbox, sauvegarder la configuration dans `chrome.storage.local` :

```json
{
  "enabled_sites": {
    "linkedin": true,
    "indeed": false,
    "hellowork": true
  }
}
```

- [ ] Si un site est desactive, ne pas afficher l'icone verte ni le badge sur ce site
- [ ] Afficher un message "Site desactive" dans le popup si l'utilisateur est sur un site desactive
- [ ] La configuration persiste entre les sessions

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests manuels sur les 3 sites avec configurations variees
- [ ] Code review effectuee

## Contexte technique

**Extension :**

- Ajouter un onglet "Parametres" dans `popup.html`
- Lire la config depuis `chrome.storage.local` au chargement du content script
- Modifier la logique de detection (US-101) pour respecter la config :

```javascript
// Dans content-script.js
chrome.storage.local.get(["enabled_sites"], (result) => {
  const config = result.enabled_sites || {
    linkedin: true,
    indeed: true,
    hellowork: true,
  };

  if (isLinkedIn() && config.linkedin) {
    // Activer la detection
  } else if (isIndeed() && config.indeed) {
    // Activer la detection
  } else if (isHelloWork() && config.hellowork) {
    // Activer la detection
  } else {
    // Desactiver la detection (icone grise)
  }
});
```

**UI Parametres :**

- Design simple avec switches ou checkboxes
- Message explicatif : "Choisissez les sites sur lesquels vous souhaitez capturer des offres"

## Dependances

- Bloque par : US-101
- Bloque : Aucune (optionnel)

## Estimation

Story points : 2
Complexite : Faible

## Notes

- Fonctionnalite simple mais tres appreciee pour les utilisateurs qui n'utilisent qu'un seul site
- Peut etre etendue plus tard avec d'autres parametres (langue, frequence de sync, etc.)
