# EPIC 04 : Dashboard React - Interface utilisateur

## Vue d'ensemble

Developper l'interface web React pour consulter, filtrer, et gerer les candidatures via 4 vues principales : Kanban, Liste, Timeline, et Stats.

## User stories incluses

- US-301 : Page d'accueil / Dashboard principale
- US-302 : Vue Kanban avec drag & drop
- US-303 : Vue Liste avec filtres et tri
- US-304 : Vue Timeline (historique)
- US-305 : Vue Stats (statistiques)
- US-306 : Ajout manuel d'une candidature
- US-307 : Edition d'une candidature
- US-308 : Suppression d'une candidature
- US-309 : Detail d'une candidature (modal)
- US-310 : Recherche fulltext

## Priorite

P0 - Interface core de l'application

## Dependances techniques

- React 18+
- React Router v6
- State management : Context API ou Zustand
- UI library : Tailwind CSS + Headless UI ou MUI
- Drag & drop : react-beautiful-dnd ou dnd-kit
- Charts : Recharts ou Chart.js

---

# US-301 : Page d'accueil / Dashboard principale

## En tant que
Utilisateur connecte

## Je veux
Acceder a une page d'accueil avec un apercu de mes candidatures

## Afin de
Voir rapidement l'etat de ma recherche d'emploi

## Criteres d'acceptation

- [ ] Route `/dashboard` affiche la page d'accueil
- [ ] Header avec :
  - Logo "JobTracker"
  - Nom de l'utilisateur connecte
  - Menu dropdown : Profil, Deconnexion
- [ ] Sidebar avec navigation :
  - Kanban (icone + label)
  - Liste (icone + label)
  - Timeline (icone + label)
  - Stats (icone + label)
- [ ] Vue par defaut : Kanban
- [ ] La sidebar est responsive : collapse sur mobile
- [ ] Bouton flottant "+" (bottom right) pour ajouter une candidature manuellement

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (composant Dashboard)
- [ ] Tests E2E (navigation)
- [ ] Responsive teste sur mobile, tablette, desktop
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Page : `src/pages/Dashboard.jsx`
- Composants :
  - `Header.jsx`
  - `Sidebar.jsx`
  - `FloatingAddButton.jsx`
- React Router :
```jsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Navigate to="/dashboard/kanban" />} />
  <Route path="kanban" element={<KanbanView />} />
  <Route path="list" element={<ListView />} />
  <Route path="timeline" element={<TimelineView />} />
  <Route path="stats" element={<StatsView />} />
</Route>
```

## Dependances

- Bloque par : US-002 (auth)
- Bloque : US-302, US-303, US-304, US-305

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Design clean et moderne
- Prevoir le dark mode (V2)

---

# US-302 : Vue Kanban avec drag & drop

## En tant que
Utilisateur

## Je veux
Visualiser mes candidatures dans un Kanban et les deplacer par drag & drop

## Afin de
Mettre a jour le statut de mes candidatures facilement

## Criteres d'acceptation

- [ ] Route `/dashboard/kanban` affiche la vue Kanban
- [ ] 6 colonnes representant les statuts :
  - "A postuler" (to_apply)
  - "Postule" (applied)
  - "Relance" (follow_up)
  - "Entretien" (interview)
  - "Offre recue" (offer)
  - "Refus" (rejected)
- [ ] Chaque colonne affiche :
  - Titre de la colonne + compteur (ex: "Postule (12)")
  - Liste des cartes candidatures
- [ ] Chaque carte affiche :
  - Titre du poste (bold)
  - Entreprise
  - Localisation
  - Source (badge LinkedIn/Indeed/HelloWork)
  - Date d'ajout (relative : "il y a 2 jours")
- [ ] Drag & drop d'une carte d'une colonne a une autre
- [ ] Au drop, confirmation conditionnelle :
  - Pas de confirmation pour les statuts "normaux"
  - Confirmation si drop dans "Refus" : "Confirmer le refus ?"
- [ ] Apres drop, appel API PATCH `/api/applications/{id}/status`
- [ ] Mise a jour optimiste de l'UI (pas d'attente de l'API)
- [ ] Gestion des erreurs : rollback en cas d'echec de l'API
- [ ] Scroll horizontal sur mobile si necessaire

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (KanbanView, KanbanColumn, KanbanCard)
- [ ] Tests E2E (drag & drop)
- [ ] Tests des erreurs API
- [ ] Responsive teste
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/pages/KanbanView.jsx`
- Sous-composants :
  - `KanbanColumn.jsx`
  - `KanbanCard.jsx`
- Library drag & drop : `dnd-kit` (plus moderne que react-beautiful-dnd)
- State management : Context API ou Zustand pour les candidatures
- API calls : axios avec gestion des erreurs

**Flow drag & drop :**
1. User drag une carte
2. User drop dans une nouvelle colonne
3. Confirmation modale si necessaire
4. Mise a jour optimiste de l'UI
5. Appel API en background
6. Si erreur API : rollback + toast d'erreur

## Dependances

- Bloque par : US-301, US-201, US-206
- Bloque : US-309

## Estimation

Story points : 13
Complexite : Elevee

## Notes

- Drag & drop est complexe, prevoir du temps de debug
- Tester sur differents navigateurs (Chrome, Firefox, Safari)
- Ajouter des animations fluides pour une meilleure UX

---

# US-303 : Vue Liste avec filtres et tri

## En tant que
Utilisateur

## Je veux
Voir toutes mes candidatures dans un tableau avec possibilite de filtrer et trier

## Afin de
Trouver rapidement une candidature specifique

## Criteres d'acceptation

- [ ] Route `/dashboard/list` affiche la vue Liste
- [ ] Tableau avec colonnes :
  - Titre du poste
  - Entreprise
  - Localisation
  - Statut (badge colore)
  - Source (icone)
  - Date d'ajout
  - Actions (icones : voir, editer, supprimer)
- [ ] Pagination : 50 lignes par page
- [ ] Tri par colonne (clic sur header de colonne) :
  - Titre, Entreprise, Statut, Date (ASC/DESC)
- [ ] Barre de filtres au-dessus du tableau :
  - Dropdown "Statut" (multi-select)
  - Dropdown "Source" (multi-select)
  - Input "Entreprise" (recherche partielle)
  - Date range picker (de/a)
- [ ] Bouton "Reinitialiser les filtres"
- [ ] Affichage du nombre total de resultats : "127 candidatures"
- [ ] Clic sur une ligne ouvre le detail (modal US-309)
- [ ] Responsive : tableau scroll horizontal sur mobile

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ListView, FilterBar, ApplicationTable)
- [ ] Tests E2E (filtres, tri, pagination)
- [ ] Responsive teste
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/pages/ListView.jsx`
- Sous-composants :
  - `FilterBar.jsx`
  - `ApplicationTable.jsx`
  - `Pagination.jsx`
- State management : URL query params pour les filtres (ex: `?status=applied&source=linkedin`)
- Library de table : TanStack Table (React Table v8) ou custom
- API calls : GET `/api/applications` avec query params

## Dependances

- Bloque par : US-301, US-202
- Bloque : US-309

## Estimation

Story points : 8
Complexite : Moyenne a Elevee

## Notes

- Persistance des filtres dans l'URL pour le partage/refresh
- Debounce sur les inputs de recherche (500ms)

---

# US-304 : Vue Timeline (historique)

## En tant que
Utilisateur

## Je veux
Voir un historique chronologique de toutes mes actions

## Afin de
Suivre l'evolution de ma recherche d'emploi dans le temps

## Criteres d'acceptation

- [ ] Route `/dashboard/timeline` affiche la vue Timeline
- [ ] Timeline verticale avec evenements chronologiques (plus recent en haut)
- [ ] Chaque evenement affiche :
  - Type d'evenement (icone + label)
  - Description (ex: "Candidature creee : Developpeur Full Stack chez Acme Corp")
  - Date et heure (format relatif puis absolu)
- [ ] Types d'evenements :
  - Candidature creee (icone +)
  - Statut change (icone fleche)
  - Candidature mise a jour (icone crayon)
  - Candidature supprimee (icone poubelle)
- [ ] Clic sur un evenement de candidature ouvre le detail (si non supprimee)
- [ ] Pagination : infinite scroll ou load more
- [ ] Filtre par type d'evenement (dropdown en haut)
- [ ] Affichage du nombre d'actions aujourd'hui : "5 actions aujourd'hui"

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (TimelineView, TimelineEvent)
- [ ] Tests E2E
- [ ] Responsive teste
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/pages/TimelineView.jsx`
- Sous-composant : `TimelineEvent.jsx`
- API call : GET `/api/applications/timeline`
- Infinite scroll : react-intersection-observer

**Design :**
- Ligne verticale avec des points (icones) pour chaque evenement
- Cartes evenements alignees a gauche avec timestamp a droite

## Dependances

- Bloque par : US-301, US-208

## Estimation

Story points : 8
Complexite : Moyenne

## Notes

- Timeline peut devenir longue, optimiser le rendu (virtualisation si necessaire)

---

# US-305 : Vue Stats (statistiques)

## En tant que
Utilisateur

## Je veux
Visualiser des statistiques sur mes candidatures

## Afin de
Mesurer l'efficacite de ma recherche d'emploi

## Criteres d'acceptation

- [ ] Route `/dashboard/stats` affiche la vue Stats
- [ ] Section 1 : Vue d'ensemble (cartes metriques)
  - Total de candidatures
  - Candidatures ce mois-ci
  - Entretiens en cours
  - Taux de reponse (% candidatures avec retour)
- [ ] Section 2 : Repartition par statut (pie chart ou donut chart)
  - Nombre et % par statut
  - Couleurs distinctes par statut
- [ ] Section 3 : Evolution dans le temps (line chart)
  - Nombre de candidatures par semaine sur les 3 derniers mois
  - Nombre d'entretiens par semaine
- [ ] Section 4 : Repartition par source (bar chart)
  - Nombre de candidatures par source (LinkedIn, Indeed, HelloWork, Manuel)
- [ ] Section 5 : Top entreprises (liste)
  - Les 10 entreprises ou j'ai postule le plus
- [ ] Filtres en haut : plage de dates (defaut : 3 derniers mois)

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (StatsView, charts)
- [ ] Tests avec donnees factices
- [ ] Responsive teste
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/pages/StatsView.jsx`
- Sous-composants :
  - `MetricCard.jsx`
  - `PieChart.jsx`
  - `LineChart.jsx`
  - `BarChart.jsx`
- Library de charts : Recharts (React-friendly)
- API call : GET `/api/applications/stats` (endpoint a creer)

**Backend (nouvelle US) :**
- Route : GET `/api/applications/stats`
- Retourne des donnees agregees :
```json
{
  "total": 127,
  "this_month": 23,
  "interviews": 5,
  "response_rate": 34.5,
  "by_status": {
    "to_apply": 45,
    "applied": 60,
    "interview": 5,
    "offer": 2,
    "rejected": 15
  },
  "by_source": {
    "linkedin": 80,
    "indeed": 30,
    "hellowork": 10,
    "manual": 7
  },
  "timeline": [
    { "week": "2025-W10", "applications": 12, "interviews": 2 },
    { "week": "2025-W11", "applications": 15, "interviews": 1 }
  ],
  "top_companies": [
    { "name": "Acme Corp", "count": 5 },
    { "name": "TechCorp", "count": 4 }
  ]
}
```

## Dependances

- Bloque par : US-301, US-202
- Necessite : nouvelle route API `/api/applications/stats` (a ajouter dans EPIC 03)

## Estimation

Story points : 13
Complexite : Elevee

## Notes

- Les stats sont importantes pour la motivation de l'utilisateur
- Ajouter des insights intelligents (ex: "Votre taux de reponse a augmente de 12% ce mois-ci")
- Cache les stats cote backend (rafraichir toutes les heures)

---

# US-306 : Ajout manuel d'une candidature

## En tant que
Utilisateur

## Je veux
Ajouter une candidature manuellement depuis le dashboard

## Afin de
Sauvegarder une offre trouvee hors LinkedIn/Indeed/HelloWork

## Criteres d'acceptation

- [ ] Bouton "+" flottant (bottom right) sur toutes les pages du dashboard
- [ ] Clic sur "+" ouvre une modale "Ajouter une candidature"
- [ ] Formulaire avec champs :
  - Titre du poste (requis)
  - Entreprise (requis)
  - Localisation (requis)
  - URL de l'offre (requis, validation URL)
  - Description (optionnel, textarea)
  - Statut (dropdown, defaut: "A postuler")
  - Notes (optionnel, textarea)
- [ ] Validation front-end des champs requis
- [ ] Bouton "Annuler" ferme la modale
- [ ] Bouton "Ajouter" (desactive si formulaire invalide)
- [ ] Apres soumission :
  - Loader pendant l'envoi
  - Appel API POST `/api/applications` avec `source: 'manual'`
  - Si succes : toast "Candidature ajoutee", fermeture modale, refresh de la vue
  - Si doublon detecte : affichage du warning avec options
  - Si erreur : message d'erreur dans la modale

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (AddApplicationModal, form validation)
- [ ] Tests E2E (ajout manuel)
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/components/AddApplicationModal.jsx`
- Form library : React Hook Form ou Formik
- Validation : yup ou zod
- API call : POST `/api/applications`

## Dependances

- Bloque par : US-301, US-201

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Tres important pour les offres trouvees sur des sites non supportes
- Prevoir l'import en masse (CSV) en V2

---

# US-307 : Edition d'une candidature

## En tant que
Utilisateur

## Je veux
Modifier les informations d'une candidature existante

## Afin de
Corriger ou completer les donnees

## Criteres d'acceptation

- [ ] Dans la vue Liste ou Kanban, clic sur l'icone "editer" ouvre une modale
- [ ] Modale "Modifier la candidature" avec formulaire pre-rempli
- [ ] Champs modifiables : Titre, Entreprise, Localisation, URL, Description, Statut, Notes
- [ ] Validation identique a l'ajout manuel (US-306)
- [ ] Bouton "Annuler" ferme la modale sans sauvegarder
- [ ] Bouton "Enregistrer"
- [ ] Apres soumission :
  - Appel API PUT `/api/applications/{id}`
  - Si succes : toast "Candidature mise a jour", fermeture modale, refresh de la vue
  - Si erreur : message d'erreur dans la modale

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (EditApplicationModal)
- [ ] Tests E2E
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/components/EditApplicationModal.jsx`
- Reutilisation du meme formulaire que AddApplicationModal (composant generique)
- API call : PUT `/api/applications/{id}`

## Dependances

- Bloque par : US-301, US-204

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Mutualiser le formulaire entre Add et Edit pour eviter la duplication

---

# US-308 : Suppression d'une candidature

## En tant que
Utilisateur

## Je veux
Supprimer une candidature

## Afin de
Nettoyer ma liste

## Criteres d'acceptation

- [ ] Dans la vue Liste ou Kanban, clic sur l'icone "supprimer" ouvre une modale de confirmation
- [ ] Modale "Supprimer cette candidature ?"
  - Message : "Etes-vous sur de vouloir supprimer [Titre] chez [Entreprise] ? Cette action est irreversible."
  - Bouton "Annuler"
  - Bouton "Supprimer" (rouge)
- [ ] Apres confirmation :
  - Appel API DELETE `/api/applications/{id}`
  - Si succes : toast "Candidature supprimee", fermeture modale, refresh de la vue
  - Si erreur : toast d'erreur

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (DeleteConfirmationModal)
- [ ] Tests E2E
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/components/DeleteConfirmationModal.jsx`
- API call : DELETE `/api/applications/{id}`

## Dependances

- Bloque par : US-301, US-205

## Estimation

Story points : 3
Complexite : Faible

## Notes

- Prevoir un undo en V2 (soft delete)

---

# US-309 : Detail d'une candidature (modal)

## En tant que
Utilisateur

## Je veux
Consulter le detail complet d'une candidature

## Afin de
Voir toutes les informations et l'historique

## Criteres d'acceptation

- [ ] Dans la vue Kanban, Liste ou Timeline, clic sur une candidature ouvre une modale
- [ ] Modale "Detail de la candidature" affiche :
  - Titre du poste (grand, bold)
  - Entreprise (avec icone)
  - Localisation (avec icone)
  - URL de l'offre (lien cliquable, ouvre dans un nouvel onglet)
  - Description complete (avec scroll si long)
  - Statut actuel (badge colore)
  - Source (badge)
  - Date d'ajout
  - Date de candidature (`applied_at`) si applicable
  - Notes personnelles (avec icone)
  - Section "Historique" : liste des changements de statut avec dates
- [ ] Boutons d'action en footer :
  - "Modifier" (ouvre US-307)
  - "Supprimer" (ouvre US-308)
  - "Fermer"
- [ ] Navigation prev/next si ouverte depuis la Liste (fleches)

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (ApplicationDetailModal)
- [ ] Tests E2E
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/components/ApplicationDetailModal.jsx`
- API call : GET `/api/applications/{id}` (inclure l'historique)

## Dependances

- Bloque par : US-301, US-203, US-208

## Estimation

Story points : 8
Complexite : Moyenne

## Notes

- Modal large pour un confort de lecture
- Prevoir l'impression en PDF en V2

---

# US-310 : Recherche fulltext

## En tant que
Utilisateur

## Je veux
Rechercher une candidature par mot-cle

## Afin de
Trouver rapidement une offre specifique

## Criteres d'acceptation

- [ ] Barre de recherche dans le header (toujours visible)
- [ ] Placeholder : "Rechercher une candidature..."
- [ ] Recherche dans : Titre, Entreprise, Localisation, Description
- [ ] Affichage des resultats en temps reel (dropdown sous la barre)
- [ ] Chaque resultat affiche : Titre, Entreprise, Statut
- [ ] Clic sur un resultat ouvre le detail (US-309)
- [ ] Si aucun resultat : message "Aucune candidature trouvee"
- [ ] Debounce de 500ms pour eviter trop d'appels API
- [ ] Fermeture du dropdown si clic ailleurs

## Definition of Done

- [ ] Code developpe et teste
- [ ] Tests unitaires (SearchBar, SearchResults)
- [ ] Tests E2E
- [ ] Code review effectuee

## Contexte technique

**Frontend :**
- Composant : `src/components/SearchBar.jsx`
- API call : GET `/api/applications?search=keyword`
- Debounce : lodash.debounce ou custom hook

## Dependances

- Bloque par : US-301, US-202

## Estimation

Story points : 5
Complexite : Moyenne

## Notes

- Ajouter des raccourcis clavier (Ctrl+K ou Cmd+K) pour focus la recherche
- Mettre en evidence les mots-cles dans les resultats (highlight)
