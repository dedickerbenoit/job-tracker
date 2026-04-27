# Registre des traitements — JobTracker

**Responsable de traitement :** [Votre Nom / Raison sociale]
**Date de mise à jour :** 14 avril 2026
**Base réglementaire :** Règlement (UE) 2016/679 (RGPD), article 30

---

## Traitement 1 : Gestion des comptes utilisateurs

| Champ                       | Détail                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Finalité**                | Création et gestion des comptes utilisateurs pour accéder au service                                                  |
| **Base légale**             | Exécution du contrat (art. 6.1.b RGPD)                                                                                |
| **Catégories de données**   | Prénom, nom, adresse e-mail, mot de passe (haché), avatar URL                                                         |
| **Catégories de personnes** | Utilisateurs inscrits                                                                                                 |
| **Destinataires**           | Aucun tiers — administrateurs techniques uniquement                                                                   |
| **Transferts hors UE**      | Aucun                                                                                                                 |
| **Durée de conservation**   | Compte actif : durée d'utilisation du service. Après suppression : 30 jours (soft-delete) puis suppression définitive |
| **Mesures de sécurité**     | HTTPS, hachage bcrypt, tokens Sanctum, rate limiting, validation des entrées, CSRF, sessions sécurisées               |

---

## Traitement 2 : Suivi des candidatures

| Champ                       | Détail                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Finalité**                | Permettre à l'utilisateur de suivre ses candidatures professionnelles                                            |
| **Base légale**             | Exécution du contrat (art. 6.1.b RGPD)                                                                           |
| **Catégories de données**   | Titre du poste, entreprise, localisation, URL de l'offre, description, notes personnelles, statut, source, dates |
| **Catégories de personnes** | Utilisateurs inscrits                                                                                            |
| **Destinataires**           | Aucun tiers — données accessibles uniquement par l'utilisateur propriétaire                                      |
| **Transferts hors UE**      | Aucun                                                                                                            |
| **Durée de conservation**   | Tant que le compte est actif. Supprimées en cascade lors de la suppression définitive du compte                  |
| **Mesures de sécurité**     | Isolation par `user_id` (policy Laravel), HTTPS, validation des entrées, protection mass-assignment              |

---

## Traitement 3 : Journalisation et sécurité

| Champ                       | Détail                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Finalité**                | Sécurité de l'application, détection d'accès non autorisés, audit                                               |
| **Base légale**             | Intérêt légitime (art. 6.1.f RGPD)                                                                              |
| **Catégories de données**   | Adresse IP, user-agent, horodatage, identifiant utilisateur, type d'événement                                   |
| **Catégories de personnes** | Tous les utilisateurs (inscrits et visiteurs)                                                                   |
| **Destinataires**           | Aucun tiers — administrateurs techniques uniquement                                                             |
| **Transferts hors UE**      | Aucun                                                                                                           |
| **Durée de conservation**   | Sessions : 30 jours. Tokens Sanctum : 30 jours sans utilisation. Logs applicatifs : selon configuration serveur |
| **Mesures de sécurité**     | Accès restreint aux fichiers de logs, rotation automatique, chiffrement du disque serveur                       |

---

## Traitement 4 : Gestion du consentement

| Champ                       | Détail                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Finalité**                | Traçabilité du consentement RGPD (CGU et politique de confidentialité)                                                        |
| **Base légale**             | Obligation légale (art. 6.1.c RGPD) — preuve du consentement                                                                  |
| **Catégories de données**   | Identifiant utilisateur, type de consentement (CGU/privacy), date de consentement, adresse IP, user-agent, date de révocation |
| **Catégories de personnes** | Utilisateurs inscrits                                                                                                         |
| **Destinataires**           | Aucun tiers — administrateurs techniques et juridiques uniquement                                                             |
| **Transferts hors UE**      | Aucun                                                                                                                         |
| **Durée de conservation**   | 5 ans après la révocation ou la suppression du compte (obligation de preuve)                                                  |
| **Mesures de sécurité**     | Table dédiée `user_consents`, accès restreint, HTTPS                                                                          |

---

## Purges automatiques

| Données                         | Fréquence         | Commande                       |
| ------------------------------- | ----------------- | ------------------------------ |
| Comptes soft-deleted > 30 jours | Quotidien (02h00) | `app:cleanup-expired-accounts` |
| Sessions > 30 jours             | Quotidien (02h30) | `app:cleanup-sessions`         |
| Tokens inutilisés > 30 jours    | Quotidien (03h00) | `app:cleanup-tokens`           |

---

## Droits des personnes concernées

Les utilisateurs peuvent exercer leurs droits via :

- **Page « Mon compte »** (`/dashboard/account`) : export de données (JSON), suppression de compte
- **Contact direct** : [email@example.com]
- **Réclamation CNIL** : [www.cnil.fr](https://www.cnil.fr/fr/plaintes)
