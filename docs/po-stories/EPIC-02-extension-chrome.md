# EPIC 02 : Extension Chrome - Capture d'offres d'emploi

## Vue d'ensemble

Permettre aux utilisateurs de capturer automatiquement les informations des offres d'emploi depuis LinkedIn, Indeed et HelloWork via une extension Chrome.

## User stories incluses

- US-101 : Detection automatique du site d'offres d'emploi
- US-102 : Scraping des informations de l'offre (LinkedIn)
- US-103 : Scraping des informations de l'offre (Indeed)
- US-104 : Scraping des informations de l'offre (HelloWork)
- US-105 : Envoi des donnees vers l'API
- US-106 : Feedback visuel de confirmation
- US-107 : Gestion des erreurs et retry

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
  hellowork: /^https:\/\/www\.hellowork\.com\/[^\/]+\/emploi\//
};
```

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
- Exemple de selecteurs (a valider) :
```javascript
const linkedinSelectors = {
  title: '.top-card-layout__title',
  company: '.topcard__org-name-link',
  location: '.topcard__flavor--bullet',
  description: '.description__text'
};
```
- Utilisation de `document.querySelector` et `document.querySelectorAll`
- Nettoyage du texte (trim, suppression des espaces multiples)

**Popup :**
- Affichage des champs dans un formulaire
- Inputs editables
- Validation avant envoi

## Dependances

- Bloque par : US-101
- Bloque : US-105

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- LinkedIn peut changer ses selecteurs CSS a tout moment
- Prevoir un systeme de logs pour debugger les echecs de scraping
- Possibilite d'ajouter un mode "manuel" si le scraping echoue

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
- Exemple de selecteurs (a valider) :
```javascript
const indeedSelectors = {
  title: '.jobsearch-JobInfoHeader-title',
  company: '[data-testid="company-name"]',
  location: '[data-testid="job-location"]',
  description: '#jobDescriptionText'
};
```
- Indeed a plusieurs layouts selon les pays/langues
- Prevoir des fallbacks pour les selecteurs

## Dependances

- Bloque par : US-101
- Bloque : US-105

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- Indeed affiche parfois des offres en iframe (cas complexe)
- Tester sur Indeed FR et Indeed US si applicable

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
- HelloWork a une structure HTML plus stable que LinkedIn/Indeed
- Exemple de selecteurs (a valider) :
```javascript
const helloworkSelectors = {
  title: '[itemprop="title"]',
  company: '[itemprop="hiringOrganization"]',
  location: '[itemprop="jobLocation"]',
  description: '[itemprop="description"]'
};
```

## Dependances

- Bloque par : US-101
- Bloque : US-105

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- HelloWork est un site francais, moins de variations que LinkedIn/Indeed

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
- Stockage temporaire des URLs deja ajoutees dans `chrome.storage.local`

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
- [ ] Au retour de la connexion, tentative automatique de sync des offres en attente
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
