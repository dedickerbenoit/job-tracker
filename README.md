# JobTracker

SaaS de suivi de candidatures d'emploi.

## Architecture

Monorepo avec 3 sous-projets :

- **backend/** - API Laravel (PHP) avec Sanctum pour l'authentification
- **frontend/** - SPA React 19 + Vite + Tailwind CSS + shadcn/ui
- **extension/** - Extension Chrome (Manifest V3) pour scraper LinkedIn, Indeed et HelloWork

## Prérequis

- PHP 8.3+
- Composer 2.x
- Node.js 22+
- npm 10+
- PostgreSQL 16+

## Installation

### Base de données

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
2. Activer le "Mode développeur"
3. Cliquer "Charger l'extension non empaquetée"
4. Sélectionner le dossier `extension/`
