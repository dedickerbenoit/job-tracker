# JobTracker - Specifications Techniques

## Architecture generale

```
┌─────────────────────────────────────────────────────────────┐
│                     UTILISATEUR                              │
└─────────────────────────────────────────────────────────────┘
           │                          │
           │                          │
           ▼                          ▼
┌──────────────────┐        ┌──────────────────┐
│   Extension      │        │   Dashboard      │
│   Chrome         │        │   React          │
│   (JavaScript)   │        │   (SPA)          │
└──────────────────┘        └──────────────────┘
           │                          │
           │         HTTPS            │
           │    (REST API)            │
           └──────────┬───────────────┘
                      ▼
           ┌────────────────────┐
           │   API Backend      │
           │   Laravel 11       │
           │   (PHP 8.2+)       │
           └────────────────────┘
                      │
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
  ┌─────────────────┐   ┌─────────────────┐
  │   MySQL/        │   │   Redis         │
  │   PostgreSQL    │   │   (Cache +      │
  │   (Database)    │   │    Queue)       │
  └─────────────────┘   └─────────────────┘
```

---

## Schema de base de donnees

### Table : `users`

| Colonne           | Type            | Contraintes                         | Description                                          |
| ----------------- | --------------- | ----------------------------------- | ---------------------------------------------------- |
| id                | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT         | ID unique de l'utilisateur                           |
| first_name        | VARCHAR(100)    | NULL                                | Prenom                                               |
| last_name         | VARCHAR(100)    | NULL                                | Nom                                                  |
| email             | VARCHAR(255)    | UNIQUE, NOT NULL                    | Email (login)                                        |
| password          | VARCHAR(255)    | NULL                                | Mot de passe hache (NULL si social login uniquement) |
| email_verified_at | TIMESTAMP       | NULL                                | Date de verification de l'email                      |
| google_id         | VARCHAR(255)    | UNIQUE, NULL                        | ID Google pour OAuth                                 |
| linkedin_id       | VARCHAR(255)    | UNIQUE, NULL                        | ID LinkedIn pour OAuth                               |
| avatar_url        | VARCHAR(500)    | NULL                                | URL de la photo de profil                            |
| created_at        | TIMESTAMP       | DEFAULT CURRENT_TIMESTAMP           | Date de creation                                     |
| updated_at        | TIMESTAMP       | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Date de mise a jour                                  |

**Indexes :**

- PRIMARY KEY (`id`)
- UNIQUE KEY (`email`)
- UNIQUE KEY (`google_id`)
- UNIQUE KEY (`linkedin_id`)

---

### Table : `applications`

| Colonne     | Type            | Contraintes                         | Description                                          |
| ----------- | --------------- | ----------------------------------- | ---------------------------------------------------- |
| id          | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT         | ID unique de la candidature                          |
| user_id     | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY               | Utilisateur proprietaire                             |
| title       | VARCHAR(255)    | NOT NULL                            | Titre du poste                                       |
| company     | VARCHAR(255)    | NOT NULL                            | Nom de l'entreprise                                  |
| location    | VARCHAR(255)    | NOT NULL                            | Localisation du poste                                |
| url         | VARCHAR(2048)   | NOT NULL                            | Lien vers l'offre                                    |
| description | TEXT            | NULL                                | Description complete de l'offre                      |
| source      | ENUM            | NOT NULL                            | Source ('linkedin', 'indeed', 'hellowork', 'manual') |
| status      | ENUM            | DEFAULT 'to_apply'                  | Statut actuel (voir ci-dessous)                      |
| notes       | TEXT            | NULL                                | Notes personnelles                                   |
| applied_at  | TIMESTAMP       | NULL                                | Date de candidature effective                        |
| created_at  | TIMESTAMP       | DEFAULT CURRENT_TIMESTAMP           | Date d'ajout                                         |
| updated_at  | TIMESTAMP       | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Date de mise a jour                                  |

**Enum `status` :**

- `to_apply` : A postuler
- `applied` : Postule
- `follow_up` : Relance
- `interview` : Entretien
- `offer` : Offre recue
- `rejected` : Refus

**Enum `source` :**

- `linkedin` : Capture depuis LinkedIn
- `indeed` : Capture depuis Indeed
- `hellowork` : Capture depuis HelloWork
- `manual` : Ajout manuel

**Indexes :**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users(id)` ON DELETE CASCADE
- INDEX `idx_user_status` (`user_id`, `status`)
- INDEX `idx_user_created` (`user_id`, `created_at` DESC)
- INDEX `idx_user_url` (`user_id`, `url`) - pour detection doublons

---

### Table : `application_events`

| Colonne        | Type            | Contraintes                 | Description                               |
| -------------- | --------------- | --------------------------- | ----------------------------------------- |
| id             | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | ID unique de l'evenement                  |
| user_id        | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY       | Utilisateur                               |
| application_id | BIGINT UNSIGNED | NULL, FOREIGN KEY           | Candidature concernee (NULL si supprimee) |
| type           | ENUM            | NOT NULL                    | Type d'evenement (voir ci-dessous)        |
| description    | TEXT            | NOT NULL                    | Description lisible de l'evenement        |
| metadata       | JSON            | NULL                        | Donnees supplementaires (old/new values)  |
| created_at     | TIMESTAMP       | DEFAULT CURRENT_TIMESTAMP   | Date de l'evenement                       |

**Enum `type` :**

- `created` : Candidature creee
- `status_changed` : Changement de statut
- `updated` : Mise a jour des informations
- `deleted` : Candidature supprimee

**Indexes :**

- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY (`application_id`) REFERENCES `applications(id)` ON DELETE SET NULL
- INDEX `idx_user_created` (`user_id`, `created_at` DESC)

**Exemple de `metadata` :**

```json
{
  "old_status": "applied",
  "new_status": "interview",
  "changed_fields": ["status", "notes"]
}
```

---

### Table : `password_resets`

| Colonne    | Type         | Contraintes               | Description               |
| ---------- | ------------ | ------------------------- | ------------------------- |
| email      | VARCHAR(255) | PRIMARY KEY               | Email de l'utilisateur    |
| token      | VARCHAR(255) | NOT NULL                  | Token de reinitialisation |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Date de creation          |

**Indexes :**

- PRIMARY KEY (`email`)
- INDEX (`token`)

---

## Routes API Backend

### Authentification

| Methode | Route                         | Description                | Auth |
| ------- | ----------------------------- | -------------------------- | ---- |
| POST    | `/api/auth/register`          | Inscription                | Non  |
| POST    | `/api/auth/login`             | Connexion                  | Non  |
| POST    | `/api/auth/logout`            | Deconnexion                | Oui  |
| GET     | `/api/auth/google/redirect`   | Redirection OAuth Google   | Non  |
| GET     | `/api/auth/google/callback`   | Callback OAuth Google      | Non  |
| GET     | `/api/auth/linkedin/redirect` | Redirection OAuth LinkedIn | Non  |
| GET     | `/api/auth/linkedin/callback` | Callback OAuth LinkedIn    | Non  |
| POST    | `/api/auth/forgot-password`   | Demande reset password     | Non  |
| POST    | `/api/auth/reset-password`    | Reset password             | Non  |

### Utilisateur

| Methode | Route               | Description             | Auth |
| ------- | ------------------- | ----------------------- | ---- |
| GET     | `/api/user/profile` | Recuperer le profil     | Oui  |
| PUT     | `/api/user/profile` | Mettre a jour le profil | Oui  |
| POST    | `/api/user/avatar`  | Upload avatar           | Oui  |
| DELETE  | `/api/user/account` | Supprimer le compte     | Oui  |

### Candidatures

| Methode | Route                           | Description                           | Auth |
| ------- | ------------------------------- | ------------------------------------- | ---- |
| GET     | `/api/applications`             | Liste des candidatures (avec filtres) | Oui  |
| POST    | `/api/applications`             | Creer une candidature                 | Oui  |
| GET     | `/api/applications/{id}`        | Detail d'une candidature              | Oui  |
| PUT     | `/api/applications/{id}`        | Mettre a jour une candidature         | Oui  |
| DELETE  | `/api/applications/{id}`        | Supprimer une candidature             | Oui  |
| PATCH   | `/api/applications/{id}/status` | Changer le statut uniquement          | Oui  |
| GET     | `/api/applications/timeline`    | Historique des evenements             | Oui  |
| GET     | `/api/applications/stats`       | Statistiques agregees                 | Oui  |

**Exemples de query params pour `/api/applications` :**

```
GET /api/applications?status=applied&source=linkedin&search=developer&sort=created_at&per_page=50&page=1
GET /api/applications?from_date=2025-01-01&to_date=2025-03-31
```

---

## Architecture Frontend (React)

### Structure des dossiers

```
src/
├── assets/              # Images, fonts, etc.
├── components/          # Composants reutilisables
│   ├── common/          # Composants generiques (Button, Modal, etc.)
│   ├── layout/          # Header, Sidebar, Footer
│   ├── applications/    # Composants specifiques aux candidatures
│   └── auth/            # Composants d'authentification
├── contexts/            # React Contexts (AuthContext, ApplicationContext)
├── hooks/               # Custom hooks (useAuth, useApplications, etc.)
├── pages/               # Pages principales
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── dashboard/       # Dashboard layout
│   │   ├── KanbanView.jsx
│   │   ├── ListView.jsx
│   │   ├── TimelineView.jsx
│   │   └── StatsView.jsx
│   └── profile/         # Page de profil
├── services/            # API calls (axios)
│   ├── api.js           # Configuration axios
│   ├── authService.js
│   └── applicationService.js
├── utils/               # Fonctions utilitaires
├── App.jsx              # Composant racine
└── main.jsx             # Entry point
```

### Gestion de l'etat

**Option 1 : Context API (recommande pour MVP)**

```jsx
// contexts/AuthContext.jsx
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => { ... };
  const logout = () => { ... };
  const register = async (data) => { ... };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook custom
export const useAuth = () => useContext(AuthContext);
```

**Option 2 : Zustand (si besoin de plus de performance)**

```js
// stores/authStore.js
import create from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: async (email, password) => { ... },
  logout: () => set({ user: null, token: null }),
}));
```

---

## Architecture Extension Chrome

### Structure des fichiers

```
extension/
├── manifest.json        # Configuration de l'extension (Manifest V3)
├── popup/               # UI de l'extension (popup)
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/             # Scripts injectes dans les pages
│   ├── content.js       # Content script principal
│   └── scrapers/        # Scrapers par site
│       ├── linkedin.js
│       ├── indeed.js
│       └── hellowork.js
├── background/          # Service worker (background)
│   └── background.js
├── assets/              # Icons, images
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── utils/               # Fonctions utilitaires
    ├── api.js           # Appels API
    └── storage.js       # Gestion du chrome.storage
```

### Manifest V3

```json
{
  "manifest_version": 3,
  "name": "JobTracker",
  "version": "1.0.0",
  "description": "Suivez vos candidatures d'emploi facilement",
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": [
    "https://www.linkedin.com/*",
    "https://*.indeed.com/*",
    "https://www.hellowork.com/*",
    "https://api.jobtracker.com/*"
  ],
  "background": {
    "service_worker": "background/background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.linkedin.com/jobs/*",
        "https://*.indeed.com/*",
        "https://www.hellowork.com/*/*"
      ],
      "js": ["content/content.js"]
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  },
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
}
```

### Communication entre composants

```
┌───────────────┐        ┌───────────────┐
│   Popup       │◄──────►│   Background  │
│   (UI)        │ Message│   Service     │
└───────────────┘        │   Worker      │
                         └───────┬───────┘
                                 │
                                 │ Message
                                 │
                         ┌───────▼───────┐
                         │   Content     │
                         │   Script      │
                         │   (Scraping)  │
                         └───────────────┘
```

**Exemple de communication :**

```javascript
// content.js - Envoie les donnees scrapees
chrome.runtime.sendMessage({
  type: "JOB_SCRAPED",
  data: { title: "...", company: "..." },
});

// background.js - Recoit et traite
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "JOB_SCRAPED") {
    // Envoyer vers l'API
    sendToAPI(message.data);
  }
});
```

---

## Scrapers specifiques

### Scraper LinkedIn

```javascript
// content/scrapers/linkedin.js
export function scrapeLinkedIn() {
  return {
    title: document.querySelector(".top-card-layout__title")?.innerText.trim(),
    company: document
      .querySelector(".topcard__org-name-link")
      ?.innerText.trim(),
    location: document
      .querySelector(".topcard__flavor--bullet")
      ?.innerText.trim(),
    description: document.querySelector(".description__text")?.innerText.trim(),
    url: window.location.href,
  };
}
```

### Scraper Indeed

```javascript
// content/scrapers/indeed.js
export function scrapeIndeed() {
  return {
    title: document
      .querySelector(".jobsearch-JobInfoHeader-title")
      ?.innerText.trim(),
    company: document
      .querySelector('[data-testid="company-name"]')
      ?.innerText.trim(),
    location: document
      .querySelector('[data-testid="job-location"]')
      ?.innerText.trim(),
    description: document
      .querySelector("#jobDescriptionText")
      ?.innerText.trim(),
    url: window.location.href,
  };
}
```

### Scraper HelloWork

```javascript
// content/scrapers/hellowork.js
export function scrapeHelloWork() {
  return {
    title: document.querySelector('[itemprop="title"]')?.innerText.trim(),
    company: document
      .querySelector('[itemprop="hiringOrganization"]')
      ?.innerText.trim(),
    location: document
      .querySelector('[itemprop="jobLocation"]')
      ?.innerText.trim(),
    description: document
      .querySelector('[itemprop="description"]')
      ?.innerText.trim(),
    url: window.location.href,
  };
}
```

---

## Securite

### Backend

1. **Authentification**
   - Tokens JWT avec Laravel Sanctum
   - Duree de vie : 24h (ou 30j si "Remember me")
   - Refresh token pour renouveler sans re-login

2. **Autorisation**
   - Policies Laravel pour chaque ressource
   - Verification que l'utilisateur est proprietaire de la ressource

3. **Validation**
   - Form Requests Laravel pour valider toutes les entrees
   - Sanitization des champs text (XSS)

4. **Rate limiting**
   - Inscription : 5 tentatives / heure / IP
   - Login : 5 tentatives / 15 minutes / email
   - API : 60 requetes / minute / utilisateur

5. **CORS**
   - Configuration stricte des origins autorisees
   - Whitelist : extension Chrome ID + domaine frontend

6. **HTTPS**
   - Obligatoire en production
   - Certificat SSL (Let's Encrypt)

### Frontend

1. **Stockage securise**
   - Token JWT dans localStorage (ou httpOnly cookie)
   - Pas de donnees sensibles dans le localStorage

2. **XSS Protection**
   - React echappe automatiquement les variables
   - Attention avec dangerouslySetInnerHTML

3. **CSRF Protection**
   - Laravel Sanctum gere le CSRF pour les cookies

### Extension

1. **Stockage securise**
   - Token JWT dans chrome.storage.local (encrypte par Chrome)

2. **Communication securisee**
   - Toutes les requetes API en HTTPS
   - Validation de l'origine des messages

3. **Permissions minimales**
   - Seulement les permissions necessaires dans le manifest

---

## Performance

### Backend

1. **Database**
   - Indexes sur les colonnes frequemment filtrees
   - Eager loading pour eviter les N+1 queries
   - Cache Redis pour les stats (TTL 1h)

2. **API**
   - Pagination obligatoire (max 100 items par page)
   - Gzip compression
   - Response caching pour les GET

### Frontend

1. **Code splitting**
   - Lazy loading des routes avec React.lazy
   - Dynamic imports pour les gros composants

2. **Optimisations React**
   - Memo pour les composants couteux
   - useMemo/useCallback pour eviter les re-renders
   - Virtualisation pour les longues listes (react-window)

3. **Assets**
   - Images optimisees (WebP)
   - Minification JS/CSS
   - CDN pour les assets statiques

### Extension

1. **Scraping**
   - Lazy loading des selecteurs
   - Timeout de 5s max pour le scraping

2. **API calls**
   - Debounce des requetes
   - Batch des requetes si possible

---

## Monitoring et logs

### Backend

1. **Logs**
   - Laravel Log (daily rotation)
   - Niveaux : error, warning, info, debug

2. **Monitoring**
   - Sentry pour les erreurs
   - Laravel Telescope pour le debug (dev only)

3. **Metriques**
   - Temps de reponse API
   - Taux d'erreur
   - Nombre de requetes par endpoint

### Frontend

1. **Erreurs**
   - Sentry pour les erreurs JS
   - Error boundaries React

2. **Analytics**
   - Plausible ou Matomo (respect RGPD)
   - Pas Google Analytics (trop intrusif)

### Extension

1. **Logs**
   - console.log en dev
   - chrome.storage.local pour logs en prod

2. **Monitoring scraping**
   - Taux de succes par site
   - Selecteurs qui echouent

---

## Environnements

### Developpement

- **Backend** : Laravel Sail (Docker) ou Valet
- **Frontend** : Vite dev server (`npm run dev`)
- **Extension** : Load unpacked en mode developpeur

### Staging

- **Backend** : staging.api.jobtracker.com
- **Frontend** : staging.jobtracker.com
- **Extension** : Version beta (non publiee sur le store)

### Production

- **Backend** : api.jobtracker.com
- **Frontend** : jobtracker.com
- **Extension** : Chrome Web Store (version stable)

---

## CI/CD

### Pipeline GitHub Actions

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: "8.2"
      - name: Install dependencies
        run: composer install
      - name: Run tests
        run: php artisan test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh
```

---

_Document genere le 2025-03-30_
