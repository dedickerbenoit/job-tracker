<p align="center">
  <img src="frontend/public/logo-full.png" alt="JobTracker" height="60">
</p>

<p align="center">
  Centralise tes candidatures, suis leur avancement, ne rate plus jamais une relance.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white" alt="Laravel 13">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Fly.io-deployed-8B5CF6?logo=fly.io&logoColor=white" alt="Fly.io">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Extension">
</p>

---

## Apercu

JobTracker est un outil de suivi de candidatures d'emploi avec une extension Chrome qui capture automatiquement les offres depuis LinkedIn et Indeed.

## Fonctionnalites

**Suivi de candidatures**

- Tableau Kanban drag-and-drop avec 6 statuts (a postuler, postule, relance, entretien, offre, refuse)
- Vues liste, timeline et statistiques avec graphiques (Recharts)
- Recherche, filtres par statut/source/date, tri multi-colonnes

**Extension Chrome (Manifest V3)**

- Detection automatique des offres sur LinkedIn et Indeed
- Scraping du titre, entreprise, localisation, description, URL
- Sauvegarde en un clic vers le dashboard
- Authentification par handoff token (pas de mot de passe stocke dans l'extension)

**Authentification et RGPD**

- Inscription avec verification email
- Gestion du consentement (CGU, politique de confidentialite)
- Export de donnees personnelles, suspension et suppression de compte

## Stack technique

| Couche        | Technologies                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **Frontend**  | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, React Hook Form + Zod, dnd-kit, Recharts |
| **Backend**   | PHP 8.3, Laravel 13, Sanctum (auth token + session), PostgreSQL                                        |
| **Extension** | Chrome Manifest V3, content scripts par plateforme                                                     |
| **Infra**     | Docker multi-stage, Fly.io (region CDG), Nginx + PHP-FPM                                               |

## Architecture

Monorepo avec 3 sous-projets :

```
job-tracker/
├── backend/       API REST Laravel
├── frontend/      SPA React + Vite
├── extension/     Extension Chrome (Manifest V3)
├── docker/        Config Nginx + entrypoint
├── Dockerfile     Build multi-stage (Node + PHP)
└── fly.toml       Config Fly.io
```

L'API backend sert aussi le frontend en production : le build React est copie dans le dossier `public/` Laravel et servi via une route catch-all Blade.

## Installation

### Prerequis

- PHP 8.3+, Composer 2.x
- Node.js 22+, npm 10+
- PostgreSQL 16+

### Base de donnees

```bash
sudo service postgresql start
createdb jobtracker
```

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Extension Chrome

```bash
cd extension
./build.sh dev
```

1. Ouvrir `chrome://extensions/`
2. Activer le "Mode developpeur"
3. Cliquer "Charger l'extension non empaquetee"
4. Selectionner le dossier `extension/`

## Email

L'envoi d'emails (verification de compte) passe par **Gmail SMTP**. C'est un choix pragmatique pour un projet personnel : la configuration est immediate, sans achat de domaine ni verification DNS.

Ce n'est pas la solution ideale en production (limite a 500 emails/jour, expediteur en `@gmail.com`), mais c'est largement suffisant pour un projet portfolio. Pour une mise en production reelle, il faudrait un domaine custom avec un service transactionnel (Resend, Postmark, SES).

En local, le mailer est configure sur `log` par defaut : les emails sont simplement ecrits dans les logs Laravel, aucune configuration supplementaire n'est necessaire.

## Deploiement

L'application est deployee sur **Fly.io** (region Paris CDG) via un Dockerfile multi-stage :

1. **Stage 1** - Build du frontend React (Node 20 Alpine)
2. **Stage 2** - Serveur PHP 8.3 FPM + Nginx avec les assets compiles

```bash
fly deploy
```

La machine scale a zero quand il n'y a pas de trafic et redemarre automatiquement a la premiere requete.

## Licence

Projet personnel - Tous droits reserves.
