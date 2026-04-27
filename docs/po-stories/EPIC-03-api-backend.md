# EPIC 03 : API Backend Laravel - Gestion des candidatures

## Vue d'ensemble

Developper l'API REST Laravel pour gerer les candidatures : CRUD, changements de statut, detection de doublons, et synchronisation avec l'extension et le dashboard.

## User stories incluses

- US-201 : Creation d'une candidature (API)
- US-202 : Liste des candidatures avec filtres et tri
- US-203 : Detail d'une candidature
- US-204 : Mise a jour d'une candidature
- US-205 : Suppression d'une candidature
- US-206 : Changement de statut d'une candidature
- US-207 : Detection de doublons
- US-208 : Historique des changements (timeline)

## Priorite

P0 - Backend core de l'application

## Dependances techniques

- Laravel 11
- MySQL ou PostgreSQL
- Laravel Sanctum pour l'auth API
- Queue system pour les traitements asynchrones

---

# US-201 : Creation d'une candidature (API)

## En tant que

Client API (extension ou dashboard)

## Je veux

Creer une nouvelle candidature via l'API

## Afin de

Sauvegarder une offre d'emploi dans le systeme

## Criteres d'acceptation

- [ ] Route POST `/api/applications` protegee par auth middleware
- [ ] Validation des champs :
  - `title` : string, requis, max 255 caracteres
  - `company` : string, requis, max 255 caracteres
  - `location` : string, requis, max 255 caracteres
  - `url` : url valide, requis, unique par user_id
  - `description` : text, optionnel
  - `source` : enum (linkedin, indeed, hellowork, manual), requis
  - `status` : enum, optionnel (defaut: to_apply)
  - `notes` : text, optionnel
- [ ] La candidature est liee a l'utilisateur authentifie (`user_id`)
- [ ] Retourne un JSON avec la candidature creee (201 Created)
- [ ] Retourne un warning si une candidature similaire existe (meme URL ou meme titre+entreprise) :

```json
{
  "id": 123,
  "title": "...",
  "warning": "similar_application_found",
  "similar_applications": [
    { "id": 45, "title": "...", "company": "...", "url": "..." }
  ]
}
```

- [ ] En cas d'erreur de validation : 422 Unprocessable Entity avec details
- [ ] Timestamp `created_at` et `updated_at` automatiques

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ApplicationController@store)
- [ ] Tests de validation (champs requis, formats)
- [ ] Tests de detection de doublons
- [ ] Documentation API (Postman ou OpenAPI)
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Route : `Route::post('/applications', [ApplicationController::class, 'store'])->middleware('auth:sanctum');`
- Controller : `ApplicationController@store`
- Request : `StoreApplicationRequest` avec validation
- Model : `Application`
- Service : `ApplicationService` pour la logique de detection de doublons

**Migration :**

```sql
CREATE TABLE applications (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    description TEXT NULL,
    source ENUM('linkedin', 'indeed', 'hellowork', 'manual') NOT NULL,
    status ENUM('to_apply', 'applied', 'interview', 'offer', 'rejected', 'follow_up') DEFAULT 'to_apply',
    notes TEXT NULL,
    applied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_created (user_id, created_at DESC)
);
```

**Detection de doublons :**

```php
// Verifier si URL existe deja pour cet utilisateur
$existing = Application::where('user_id', $userId)
    ->where('url', $url)
    ->first();

// Ou similaire (meme titre + meme entreprise)
$similar = Application::where('user_id', $userId)
    ->where('title', 'LIKE', "%$title%")
    ->where('company', $company)
    ->get();
```

## Dependances

- Bloque par : US-001 (auth)
- Bloque : US-105, US-301, US-401

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Ne pas bloquer la creation en cas de doublon, juste warning
- Prevoir un index sur `user_id` + `url` pour la perf
- Limiter le nombre de candidatures par utilisateur (ex: 1000 max) pour eviter les abus

---

# US-202 : Liste des candidatures avec filtres et tri

## En tant que

Client API (dashboard)

## Je veux

Recuperer la liste de mes candidatures avec possibilite de filtrer et trier

## Afin de

Afficher les candidatures dans le dashboard selon differentes vues

## Criteres d'acceptation

- [ ] Route GET `/api/applications` protegee par auth middleware
- [ ] Retourne uniquement les candidatures de l'utilisateur authentifie
- [ ] Pagination : 50 resultats par page par defaut (modifiable via `?per_page=X`)
- [ ] Filtres supportes (query params) :
  - `status` : filtrer par statut (ex: `?status=applied`)
  - `source` : filtrer par source (ex: `?source=linkedin`)
  - `company` : recherche partielle dans le nom de l'entreprise
  - `search` : recherche fulltext dans `title`, `company`, `location`, `description`
  - `from_date` : candidatures creees apres cette date (ISO 8601)
  - `to_date` : candidatures creees avant cette date
- [ ] Tri supporte (query param `sort`) :
  - `created_at` : date de creation (defaut: DESC)
  - `updated_at` : derniere mise a jour
  - `company` : ordre alphabetique
  - `status` : ordre des statuts
- [ ] Format de reponse :

```json
{
  "data": [
    {
      "id": 123,
      "title": "Developpeur Full Stack",
      "company": "Acme Corp",
      "location": "Paris, France",
      "url": "https://...",
      "source": "linkedin",
      "status": "applied",
      "applied_at": "2025-03-15T10:30:00Z",
      "created_at": "2025-03-14T18:20:00Z",
      "updated_at": "2025-03-15T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 50,
    "total": 127
  }
}
```

- [ ] Performance : reponse < 200ms meme avec 1000+ candidatures

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ApplicationController@index)
- [ ] Tests des filtres et tri
- [ ] Tests de performance avec dataset large
- [ ] Documentation API
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Route : `Route::get('/applications', [ApplicationController::class, 'index'])->middleware('auth:sanctum');`
- Utilisation de Query Builder ou Eloquent avec scopes
- Resource Laravel pour formater la reponse (`ApplicationResource`)

**Optimisations :**

- Index sur `user_id`, `status`, `created_at`
- Eager loading si necessaire
- Cache des compteurs de statut

## Dependances

- Bloque par : US-201
- Bloque : US-302, US-303

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Prevoir l'ajout de nouveaux filtres facilement (architecture extensible)
- Fulltext search peut utiliser Laravel Scout si volume important

---

# US-203 : Detail d'une candidature

## En tant que

Client API (dashboard)

## Je veux

Recuperer le detail complet d'une candidature

## Afin de

Afficher toutes les informations d'une candidature specifique

## Criteres d'acceptation

- [ ] Route GET `/api/applications/{id}` protegee par auth middleware
- [ ] Retourne la candidature uniquement si elle appartient a l'utilisateur authentifie
- [ ] Si la candidature n'existe pas ou n'appartient pas a l'utilisateur : 404 Not Found
- [ ] Format de reponse avec tous les champs :

```json
{
  "id": 123,
  "title": "Developpeur Full Stack",
  "company": "Acme Corp",
  "location": "Paris, France",
  "url": "https://...",
  "description": "...",
  "source": "linkedin",
  "status": "applied",
  "notes": "Envoye le CV v2",
  "applied_at": "2025-03-15T10:30:00Z",
  "created_at": "2025-03-14T18:20:00Z",
  "updated_at": "2025-03-15T10:30:00Z"
}
```

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ApplicationController@show)
- [ ] Tests d'autorisation (403 si pas le owner)
- [ ] Documentation API
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Route : `Route::get('/applications/{application}', [ApplicationController::class, 'show'])->middleware('auth:sanctum');`
- Utilisation de Route Model Binding
- Policy Laravel pour l'autorisation :

```php
public function view(User $user, Application $application)
{
    return $user->id === $application->user_id;
}
```

## Dependances

- Bloque par : US-201

## Estimation

Story points : 2
Complexite : Faible

## Notes

- Tres simple, mais indispensable pour le dashboard

---

# US-204 : Mise a jour d'une candidature

## En tant que

Client API (dashboard)

## Je veux

Mettre a jour les informations d'une candidature

## Afin de

Corriger ou completer les donnees

## Criteres d'acceptation

- [ ] Route PUT/PATCH `/api/applications/{id}` protegee par auth middleware
- [ ] Champs modifiables :
  - `title`, `company`, `location`, `url`, `description`, `notes`, `status`
- [ ] Validation identique a la creation (US-201)
- [ ] Autorisation : seul le proprietaire peut modifier
- [ ] Si changement de `status`, mise a jour automatique de `applied_at` si le nouveau statut est "applied"
- [ ] Retourne la candidature mise a jour (200 OK)
- [ ] Si non autorise : 403 Forbidden
- [ ] Si validation echoue : 422 Unprocessable Entity

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ApplicationController@update)
- [ ] Tests d'autorisation
- [ ] Tests de validation
- [ ] Documentation API
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Route : `Route::put('/applications/{application}', [ApplicationController::class, 'update'])->middleware('auth:sanctum');`
- Request : `UpdateApplicationRequest`
- Policy : `ApplicationPolicy@update`

## Dependances

- Bloque par : US-201

## Estimation

Story points : 3
Complexite : Faible

## Notes

- Prevoir un log des modifications pour l'historique (US-208)

---

# US-205 : Suppression d'une candidature

## En tant que

Client API (dashboard)

## Je veux

Supprimer une candidature

## Afin de

Nettoyer ma liste de candidatures

## Criteres d'acceptation

- [ ] Route DELETE `/api/applications/{id}` protegee par auth middleware
- [ ] Autorisation : seul le proprietaire peut supprimer
- [ ] Suppression definitive (hard delete)
- [ ] Retourne 204 No Content en cas de succes
- [ ] Si non autorise : 403 Forbidden
- [ ] Si la candidature n'existe pas : 404 Not Found

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ApplicationController@destroy)
- [ ] Tests d'autorisation
- [ ] Documentation API
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Route : `Route::delete('/applications/{application}', [ApplicationController::class, 'destroy'])->middleware('auth:sanctum');`
- Policy : `ApplicationPolicy@delete`

## Dependances

- Bloque par : US-201

## Estimation

Story points : 2
Complexite : Faible

## Notes

- Possibilite de passer en soft delete si besoin de restauration (V2)

---

# US-206 : Changement de statut d'une candidature

## En tant que

Client API (dashboard - Kanban)

## Je veux

Changer le statut d'une candidature rapidement

## Afin de

Permettre le drag & drop dans le Kanban

## Criteres d'acceptation

- [ ] Route PATCH `/api/applications/{id}/status` protegee par auth middleware
- [ ] Body JSON : `{ "status": "applied" }`
- [ ] Validation : statut valide parmi les enum
- [ ] Si passage au statut "applied" et `applied_at` est NULL, set `applied_at` a now()
- [ ] Retourne la candidature mise a jour (200 OK)
- [ ] Creation d'un evenement dans l'historique (lien vers US-208)

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ApplicationController@updateStatus)
- [ ] Tests de validation
- [ ] Documentation API
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Route : `Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus'])->middleware('auth:sanctum');`
- Request : `UpdateStatusRequest`

**Historique :**

- Creation d'un enregistrement dans la table `application_events` (US-208)

## Dependances

- Bloque par : US-201
- Bloque : US-304 (Kanban)

## Estimation

Story points : 3
Complexite : Faible

## Notes

- Endpoint specifique pour optimiser le Kanban (eviter de re-envoyer tous les champs)

---

# US-207 : Detection de doublons

## En tant que

Systeme API

## Je veux

Detecter les candidatures en doublon lors de la creation

## Afin de

Eviter que l'utilisateur ajoute plusieurs fois la meme offre par erreur

## Criteres d'acceptation

- [ ] A la creation d'une candidature (US-201), recherche de doublons
- [ ] Criteres de doublon :
  - **Doublon exact** : meme URL pour le meme user
  - **Doublon similaire** : meme titre (similarity > 80%) + meme entreprise pour le meme user
- [ ] Si doublon exact : retourne un warning `duplicate_url` avec la candidature existante
- [ ] Si doublon similaire : retourne un warning `similar_application` avec les candidatures similaires (max 5)
- [ ] Le warning n'empeche PAS la creation (c'est a l'utilisateur de decider)
- [ ] Format du warning :

```json
{
  "id": 123,
  "title": "...",
  "warning": {
    "type": "duplicate_url",
    "message": "Cette URL existe deja dans vos candidatures",
    "duplicates": [
      {
        "id": 45,
        "title": "...",
        "company": "...",
        "status": "applied",
        "created_at": "..."
      }
    ]
  }
}
```

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (detection exacte et similaire)
- [ ] Tests de performance (detection rapide meme avec 1000+ candidatures)
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Service : `ApplicationDuplicateDetector`
- Utilisation de Levenshtein distance ou similar_text pour la similarite de titre
- Optimisation avec index sur `url` et `company`

**Algo de similarite :**

```php
$similarity = similar_text($title1, $title2);
if ($similarity > 80) {
    // Similaire
}
```

## Dependances

- Bloque par : US-201
- Lie a : US-105 (extension)

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Attention aux faux positifs (ex: "Developpeur Full Stack" est tres commun)
- Permettre a l'utilisateur de desactiver la detection (settings V2)

---

# US-208 : Historique des changements (timeline)

## En tant que

Utilisateur

## Je veux

Consulter l'historique de toutes les actions sur mes candidatures

## Afin de

Suivre l'evolution de ma recherche d'emploi

## Criteres d'acceptation

- [ ] Route GET `/api/applications/timeline` protegee par auth middleware
- [ ] Retourne une liste d'evenements chronologiques (tri DESC par date)
- [ ] Types d'evenements :
  - `created` : candidature creee
  - `status_changed` : changement de statut
  - `updated` : mise a jour des informations
  - `deleted` : candidature supprimee
- [ ] Format de reponse :

```json
{
  "data": [
    {
      "id": 456,
      "application_id": 123,
      "type": "status_changed",
      "description": "Statut change de 'to_apply' a 'applied'",
      "metadata": {
        "old_status": "to_apply",
        "new_status": "applied"
      },
      "created_at": "2025-03-15T10:30:00Z"
    },
    {
      "id": 455,
      "application_id": 123,
      "type": "created",
      "description": "Candidature creee depuis LinkedIn",
      "metadata": {
        "source": "linkedin"
      },
      "created_at": "2025-03-14T18:20:00Z"
    }
  ]
}
```

- [ ] Pagination : 100 evenements par page
- [ ] Filtres supportes :
  - `application_id` : historique d'une candidature specifique
  - `type` : filtrer par type d'evenement
  - `from_date`, `to_date` : plage de dates

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (TimelineController@index)
- [ ] Tests de creation d'evenements lors des actions CRUD
- [ ] Documentation API
- [ ] Code review effectuee

## Contexte technique

**Backend :**

- Route : `Route::get('/applications/timeline', [TimelineController::class, 'index'])->middleware('auth:sanctum');`
- Model : `ApplicationEvent`
- Migration :

```sql
CREATE TABLE application_events (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    application_id BIGINT UNSIGNED NULL,
    type ENUM('created', 'status_changed', 'updated', 'deleted') NOT NULL,
    description TEXT NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at DESC)
);
```

**Observers :**

- Laravel Observer sur le model `Application` pour enregistrer automatiquement les evenements :

```php
class ApplicationObserver
{
    public function created(Application $application) {
        ApplicationEvent::create([...]);
    }

    public function updated(Application $application) {
        if ($application->isDirty('status')) {
            ApplicationEvent::create([...]);
        }
    }
}
```

## Dependances

- Bloque par : US-201

## Estimation

Story points : 8
Complexite : Elevee

## Notes

- Essentiel pour la feature Timeline du dashboard
- Prevoir un nettoyage automatique des evenements trop anciens (> 1 an)
- Les evenements lies a une candidature supprimee doivent etre conserves (`application_id` NULL)
