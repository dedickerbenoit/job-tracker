# JobTracker - Roadmap MVP

## Vue d'ensemble du projet

**JobTracker** est un SaaS gratuit de suivi de candidatures d'emploi, compose de 3 composants :
1. Extension Chrome pour capturer les offres depuis LinkedIn, Indeed, HelloWork
2. API Backend Laravel pour stocker et gerer les candidatures
3. Dashboard React pour visualiser et gerer les candidatures

**Cible** : Public (SaaS gratuit, potentiellement open source)
**Stack** : Chrome Extension + Laravel 11 + React 18 + MySQL/PostgreSQL

---

## Epics du MVP

| Epic | Titre | User Stories | Story Points | Priorite |
|------|-------|-------------|--------------|----------|
| **EPIC 01** | Authentification et gestion de compte | 7 US (US-001 a US-007) | 36 SP | P0 |
| **EPIC 02** | Extension Chrome - Capture d'offres | 9 US (US-101 a US-109) | 48 SP | P0 |
| **EPIC 03** | API Backend Laravel - Gestion des candidatures | 8 US (US-201 a US-208) | 38 SP | P0 |
| **EPIC 04** | Dashboard React - Interface utilisateur | 10 US (US-301 a US-310) | 67 SP | P0 |
| **TOTAL MVP** | | **34 User Stories** | **189 SP** | |

**Estimation de charge** : 189 story points ~ **6-8 semaines** pour 1 developpeur full-stack

---

## Roadmap de developpement

### Phase 1 : Fondations (Semaines 1-2)

**Objectif** : Mettre en place l'infrastructure et l'authentification

#### Sprint 1.1 : Setup projet + Auth basique
- [ ] **Setup** : Initialiser les 3 repos Git (extension, backend, frontend)
- [ ] **US-001** : Inscription par email/mot de passe (Backend + Frontend)
- [ ] **US-002** : Connexion par email/mot de passe (Backend + Frontend)
- [ ] **US-005** : Gestion du profil utilisateur (Backend + Frontend)

**Livrable** : Application web ou un utilisateur peut s'inscrire, se connecter, et gerer son profil

#### Sprint 1.2 : Social login + Auth extension
- [ ] **US-003** : Connexion via Google OAuth
- [ ] **US-004** : Connexion via LinkedIn OAuth
- [ ] **US-006** : Reinitialisation du mot de passe
- [ ] **US-007** : Authentification dans l'extension Chrome

**Livrable** : Auth complete (email + social) et extension connectee

---

### Phase 2 : Backend API (Semaines 3-4)

**Objectif** : Developper l'API complete de gestion des candidatures

#### Sprint 2.1 : CRUD candidatures
- [ ] **US-201** : Creation d'une candidature (API)
- [ ] **US-202** : Liste des candidatures avec filtres et tri
- [ ] **US-203** : Detail d'une candidature
- [ ] **US-204** : Mise a jour d'une candidature
- [ ] **US-205** : Suppression d'une candidature

**Livrable** : API REST complete pour le CRUD candidatures (testable via Postman)

#### Sprint 2.2 : Fonctionnalites avancees API
- [ ] **US-206** : Changement de statut d'une candidature
- [ ] **US-207** : Detection de doublons
- [ ] **US-208** : Historique des changements (timeline)
- [ ] **Bonus** : Route `/api/applications/stats` pour les statistiques

**Livrable** : API avec toutes les fonctionnalites avancees (doublons, historique, stats)

---

### Phase 3 : Extension Chrome (Semaines 4-5)

**Objectif** : Developper l'extension pour capturer les offres

#### Sprint 3.1 : Detection et scraping basique
- [ ] **US-101** : Detection automatique du site d'offres d'emploi
- [ ] **US-102** : Scraping des informations (LinkedIn)
- [ ] **US-103** : Scraping des informations (Indeed)
- [ ] **US-104** : Scraping des informations (HelloWork)

**Livrable** : Extension capable de detecter et scraper les 3 sites

#### Sprint 3.2 : Envoi API et gestion erreurs
- [ ] **US-105** : Envoi des donnees vers l'API
- [ ] **US-106** : Feedback visuel de confirmation
- [ ] **US-107** : Gestion des erreurs et retry
- [ ] **US-108** : Mode manuel de saisie (fallback scraping)
- [ ] **US-109** : Configuration des sites a surveiller

**Livrable** : Extension fonctionnelle de bout en bout avec gestion offline et fallbacks

---

### Phase 4 : Dashboard React (Semaines 6-8)

**Objectif** : Developper l'interface utilisateur complete

#### Sprint 4.1 : Structure + Kanban
- [ ] **US-301** : Page d'accueil / Dashboard principale
- [ ] **US-302** : Vue Kanban avec drag & drop
- [ ] **US-309** : Detail d'une candidature (modal)

**Livrable** : Dashboard avec navigation et vue Kanban fonctionnelle

#### Sprint 4.2 : Liste + Ajout/Edition
- [ ] **US-303** : Vue Liste avec filtres et tri
- [ ] **US-306** : Ajout manuel d'une candidature
- [ ] **US-307** : Edition d'une candidature
- [ ] **US-308** : Suppression d'une candidature
- [ ] **US-310** : Recherche fulltext

**Livrable** : Dashboard complet avec toutes les actions CRUD

#### Sprint 4.3 : Timeline + Stats
- [ ] **US-304** : Vue Timeline (historique)
- [ ] **US-305** : Vue Stats (statistiques)

**Livrable** : Dashboard MVP complet avec toutes les vues

---

## Dependances critiques entre User Stories

```
EPIC 01 (Auth)
├─ US-001 (Inscription) ─┐
├─ US-002 (Connexion) ───┼─> US-007 (Auth Extension) ─> EPIC 02
├─ US-003 (Google OAuth)─┤
└─ US-004 (LinkedIn OAuth)┘
                          └─> US-005 (Profil)
                          └─> US-006 (Reset password)

EPIC 03 (API)
├─ US-201 (Create) ─┬─> US-202 (List) ───┐
│                   ├─> US-203 (Show)    │
│                   ├─> US-204 (Update)  ├─> EPIC 04 (Dashboard)
│                   ├─> US-205 (Delete)  │
│                   ├─> US-206 (Status)  │
│                   ├─> US-207 (Duplicates)
│                   └─> US-208 (Timeline)┘

EPIC 02 (Extension)
├─ US-101 (Detection) ─┬─> US-102 (LinkedIn) ─┐
│                      ├─> US-103 (Indeed) ───┼─> US-105 (Send API) ─> US-106 (Feedback)
│                      └─> US-104 (HelloWork)─┘                      └─> US-107 (Errors)

EPIC 04 (Dashboard)
└─ US-301 (Layout) ─┬─> US-302 (Kanban) ───┐
                    ├─> US-303 (List) ─────┤
                    ├─> US-304 (Timeline) ─┼─> US-309 (Detail Modal)
                    ├─> US-305 (Stats) ────┤
                    ├─> US-306 (Add) ──────┤
                    ├─> US-307 (Edit) ─────┤
                    ├─> US-308 (Delete) ───┤
                    └─> US-310 (Search) ───┘
```

---

## Definition of Done pour le MVP

Le MVP est considere termine quand :

- [ ] Un utilisateur peut s'inscrire et se connecter (email + Google + LinkedIn)
- [ ] L'extension Chrome detecte et scrape correctement LinkedIn, Indeed, HelloWork
- [ ] L'extension envoie les candidatures vers l'API
- [ ] Le dashboard affiche les candidatures dans les 4 vues : Kanban, Liste, Timeline, Stats
- [ ] L'utilisateur peut ajouter, modifier, supprimer des candidatures
- [ ] Le drag & drop du Kanban fonctionne
- [ ] Les filtres et la recherche fonctionnent
- [ ] Les statistiques s'affichent correctement
- [ ] L'application est responsive (mobile, tablette, desktop)
- [ ] Les tests unitaires et E2E sont ecrits et passent
- [ ] La documentation technique est a jour
- [ ] L'application est deployee en production (accessible publiquement)

---

## Stack technique detaillee

### Extension Chrome
- **Manifest** : V3
- **Language** : JavaScript (ES6+)
- **Scraping** : Vanilla JS (querySelector)
- **Storage** : chrome.storage.local
- **Icons** : Font Awesome ou Heroicons

### Backend Laravel
- **Version** : Laravel 11
- **PHP** : 8.2+
- **Database** : MySQL 8.0 ou PostgreSQL 15
- **Auth** : Laravel Sanctum (API tokens)
- **Social login** : Laravel Socialite
- **Queue** : Redis (pour les jobs asynchrones)
- **Cache** : Redis
- **Tests** : PHPUnit + Pest

### Frontend React
- **Version** : React 18
- **Build tool** : Vite
- **Router** : React Router v6
- **State** : Context API ou Zustand
- **Forms** : React Hook Form + Zod
- **UI** : Tailwind CSS + Headless UI
- **Drag & drop** : dnd-kit
- **Charts** : Recharts
- **HTTP** : Axios
- **Tests** : Vitest + React Testing Library + Playwright (E2E)

### Infrastructure
- **Hosting backend** : AWS (EC2 + RDS) ou DigitalOcean
- **Hosting frontend** : Vercel ou Netlify
- **Extension** : Chrome Web Store
- **CI/CD** : GitHub Actions
- **Monitoring** : Sentry (erreurs) + Plausible (analytics)

---

## Prochaines etapes (Post-MVP / V2)

Fonctionnalites a ajouter apres le MVP :

1. **Rappels intelligents**
   - Notifications pour relancer apres X jours sans reponse
   - Integration avec Google Calendar

2. **Documents**
   - Upload de CV et lettres de motivation par candidature
   - Versioning des documents

3. **Emails**
   - Tracking des emails envoyes
   - Templates de messages de relance

4. **Collaboration**
   - Partage de candidatures avec un coach ou mentor
   - Commentaires sur les candidatures

5. **Import/Export**
   - Import CSV de candidatures
   - Export PDF/Excel de toutes les candidatures

6. **Intelligence artificielle**
   - Suggestions de relance automatique
   - Score de pertinence de l'offre
   - Generation de messages de motivation

7. **Mobile**
   - Application mobile native (React Native)
   - Notifications push

8. **Integrations**
   - Zapier/Make pour automatiser
   - Slack/Discord pour les notifications
   - LinkedIn API pour importer les candidatures

9. **Monetisation (si pertinent)**
   - Plan Premium avec features avancees
   - Ads non intrusives

---

## Metriques de succes

Pour mesurer le succes du MVP :

- **Adoption** : 100 utilisateurs actifs dans les 3 premiers mois
- **Retention** : 50% des utilisateurs reviennent apres 1 semaine
- **Engagement** : 10+ candidatures ajoutees par utilisateur en moyenne
- **Performance** : Temps de reponse API < 200ms
- **Qualite** : Taux de scraping reussi > 90% sur les 3 sites
- **Bugs** : 0 bug critique en production

---

## Risques et mitigations

| Risque | Impact | Probabilite | Mitigation |
|--------|--------|-------------|------------|
| Changement des selecteurs CSS (LinkedIn/Indeed/HelloWork) | Elevee | Haute | Monitoring automatique + fallbacks + logs detailles |
| Problemes de CORS entre extension et API | Elevee | Moyenne | Configuration CORS correcte + tests exhaustifs |
| Performance API avec beaucoup d'utilisateurs | Moyenne | Moyenne | Cache Redis + indexes DB + pagination |
| Bugs de drag & drop (cross-browser) | Moyenne | Moyenne | Tests sur tous les navigateurs + library robuste (dnd-kit) |
| Complexite de l'auth dans l'extension | Elevee | Faible | POC rapide pour valider le flow token JWT |

---

## Contact et contribution

**Repository GitHub** : A creer (3 repos : extension, backend, frontend)
**License** : MIT (open source)
**Contribution** : Welcome (guidelines a definir)

---

*Document genere le 2025-03-30 par l'agent PO*
