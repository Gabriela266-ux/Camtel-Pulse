# Guide d'utilisation et de fonctionnement
# User and Operating Guide

**Application : Financial Pulse by Camtel**  
**Version de référence : branche Dev111**  
**Application: Financial Pulse by Camtel**  
**Reference version: Dev111 branch**

---

## 1. Présentation de l'application
## 1. Application Overview

### Français

Financial Pulse est une plateforme de pilotage opérationnel et financier pour Camtel. Elle centralise la structure des centres, les partenaires, les DSM, les POS, les utilisateurs, les achats, les ventes, les stocks, les objectifs, les prévisions et les relevés journaliers.

L'application est composée de deux parties :

- **Frontend** : interface web utilisée dans un navigateur ;
- **Backend** : API sécurisée qui applique les règles d'accès, traite les données et communique avec la base SQLite locale.

Les données affichées doivent venir de la base et de l'API. L'interface ne doit pas inventer de données lorsque le backend ne fournit pas une information.

### English

Financial Pulse is an operational and financial management platform for Camtel. It centralizes centres, partners, DSMs, POSs, users, purchases, sales, stock, objectives, forecasts, and daily records.

The application has two parts:

- **Frontend**: the web interface used in a browser;
- **Backend**: the secured API that enforces access rules, processes data, and communicates with the local SQLite database.

Displayed data should come from the database and the API. The interface must not invent data when the backend does not provide it.

---

## 2. Fonctionnement général
## 2. General Operating Model

### Français

Le fonctionnement suit cette chaîne :

1. L'utilisateur ouvre le frontend dans son navigateur.
2. Il se connecte avec son matricule ou son email et son mot de passe.
3. Le backend vérifie le compte, le statut, le rôle et le périmètre organisationnel.
4. Un jeton JWT est délivré pour les appels protégés.
5. Le frontend demande les données autorisées pour le rôle et le centre de l'utilisateur.
6. Toute création, modification, suppression ou consultation sensible est contrôlée par l'API.
7. Les changements importants sont enregistrés dans le journal d'audit lorsque le module concerné le prévoit.

Un compte marqué **must_change_password** doit remplacer son mot de passe temporaire avant d'utiliser les autres fonctions de la plateforme.

### English

The operating flow is:

1. The user opens the frontend in a browser.
2. The user signs in with a matricule or email and a password.
3. The backend checks the account, status, role, and organizational scope.
4. A JWT token is issued for protected requests.
5. The frontend requests the data allowed for the user's role and centre.
6. Sensitive creation, update, deletion, and read operations are enforced by the API.
7. Important changes are recorded in the audit log when the relevant module supports it.

An account marked **must_change_password** must replace its temporary password before using the other platform features.

---

## 3. Démarrage et accès
## 3. Startup and Access

### Français

Prérequis :

- Node.js LTS ;
- npm ;
- un navigateur récent.

Lancement manuel :

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

Ouvrir ensuite : `http://localhost:5173`.

L'API locale est normalement disponible sur : `http://localhost:5000/api`.

Après le premier lancement, exécuter `npm run db:migrate` après une mise à jour du projet. Ne pas relancer les seeders sur une base contenant déjà des données réelles ou de démonstration à conserver.

### English

Requirements:

- Node.js LTS;
- npm;
- a recent browser.

Manual startup:

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open: `http://localhost:5173`.

The local API is normally available at: `http://localhost:5000/api`.

After the first startup, run `npm run db:migrate` after project updates. Do not run seeders again on a database containing real or retained demonstration data.

---

## 4. Les rôles et leurs responsabilités
## 4. Roles and Responsibilities

### 4.1 Super Admin / Super Administrator

#### Français

Le Super Admin possède une visibilité globale sur tous les centres. Il est responsable de la gouvernance de la plateforme et de la configuration multi-centres.

Il peut notamment :

- consulter la vue consolidée de tous les centres ;
- créer, modifier, activer ou désactiver un centre ;
- créer et gérer les administrateurs de centre ;
- consulter les demandes d'accès globales ;
- consulter les journaux d'audit ;
- supprimer définitivement un centre et les données dépendantes prévues par l'application.

La suppression définitive d'un centre est irréversible. Elle peut supprimer les utilisateurs rattachés, les partenaires, les DSM, les POS, les ventes, les stocks, les achats, les prévisions, les objectifs, les demandes, les snapshots et les archives d'audit associées.

Le Super Admin n'est pas rattaché à un centre unique. Il ne doit donc pas être utilisé pour saisir les opérations quotidiennes d'un centre.

#### English

The Super Administrator has global visibility across all centres. This role is responsible for platform governance and multi-centre configuration.

The role can generally:

- view the consolidated view of all centres;
- create, update, activate, or deactivate a centre;
- create and manage centre administrators;
- review global access requests;
- review audit logs;
- permanently delete a centre and the dependent data handled by the application.

Permanent centre deletion is irreversible. It may delete linked users, partners, DSMs, POSs, sales, stock, purchases, forecasts, objectives, requests, snapshots, and related audit archives.

The Super Administrator is not attached to one centre. This account should not be used for daily operational entry for a specific centre.

---

### 4.2 Administrateur de centre / Centre Administrator

#### Français

L'Administrateur gère un centre précis. Il ne doit voir ni administrer les données d'un autre centre, sauf action explicitement réservée au Super Admin.

Il peut notamment :

- gérer les utilisateurs autorisés de son centre ;
- créer ou gérer les comptes opérationnels selon les règles du backend ;
- gérer les partenaires, DSM et POS de son périmètre ;
- importer des partenaires, DSM et POS lorsque le module d'import est disponible ;
- consulter les tableaux de bord de son centre ;
- consulter les journaux et les demandes qui relèvent de son centre ;
- activer ou suspendre certains comptes selon les permissions prévues.

Il ne peut pas :

- créer un autre administrateur de centre dans le périmètre normal de gestion ;
- gérer le compte Super Admin ;
- accéder aux données d'un autre centre ;
- remplacer le Super Admin pour la création ou la suppression globale des centres.

#### English

The Centre Administrator manages one specific centre. The administrator must not view or manage another centre's data unless an action is explicitly reserved for the Super Administrator.

The role can generally:

- manage authorized users in the centre;
- create or manage operational accounts according to backend rules;
- manage partners, DSMs, and POSs in the assigned scope;
- import partners, DSMs, and POSs when the import module is available;
- view the centre dashboard;
- view logs and requests belonging to the centre;
- activate or suspend certain accounts when permitted.

The role cannot:

- create another centre administrator through the normal centre-management flow;
- manage the Super Administrator account;
- access another centre's data;
- replace the Super Administrator for global centre creation or deletion.

---

### 4.3 Manager

#### Français

Le Manager est un rôle de supervision et de lecture. Il suit les résultats et les indicateurs de son périmètre sans modifier les données opérationnelles sensibles.

Il peut notamment :

- consulter le tableau de bord ;
- suivre les achats, ventes, stocks, objectifs et indicateurs ;
- consulter les relevés journaliers et les snapshots enregistrés ;
- consulter les équipes et les données de son périmètre ;
- disposer d'une visibilité élargie dans son périmètre organisationnel, selon les contrôles de l'API.

Le Manager est en lecture seule pour l'enregistrement des tableaux de suivi. Il ne doit pas saisir ou corriger les opérations à la place d'un Opérationnel ou d'un Chef Opérationnel.

#### English

The Manager is a supervision and read-oriented role. The Manager monitors results and indicators within the allowed scope without changing sensitive operational data.

The role can generally:

- view the dashboard;
- monitor purchases, sales, stock, objectives, and indicators;
- view daily records and saved snapshots;
- view teams and data within the assigned scope;
- receive broader visibility within the organizational scope, subject to API checks.

The Manager is read-only when it comes to saving tracking tables. The Manager must not enter or correct operations on behalf of an Operational User or Operational Team Leader.

---

### 4.4 Chef Opérationnel / Operational Team Leader

#### Français

Le Chef Opérationnel encadre les utilisateurs opérationnels qui lui sont affectés et intervient dans la gestion quotidienne du réseau de son périmètre.

Il peut notamment :

- consulter les opérations et les affectations de son périmètre ;
- créer ou modifier des partenaires, DSM et POS lorsque la permission de l'API le permet ;
- affecter ou réaffecter les opérationnels et leurs périmètres autorisés ;
- saisir les relevés journaliers ;
- saisir les prévisions et les calendriers d'achat autorisés ;
- demander ou traiter les corrections prévues par le workflow ;
- suivre les opérationnels qui lui sont rattachés.

Il est limité à son centre et à son périmètre de responsabilité. Il ne peut pas administrer la plateforme entière ni gérer le compte Super Admin.

#### English

The Operational Team Leader supervises assigned operational users and manages the daily network activities within the allowed scope.

The role can generally:

- view operations and assignments within the scope;
- create or update partners, DSMs, and POSs when allowed by the API;
- assign or reassign operational users within the permitted scope;
- enter daily records;
- enter authorized forecasts and purchase calendars;
- request or process corrections provided by the workflow;
- monitor assigned operational users.

The role is limited to its centre and responsibility scope. It cannot administer the entire platform or manage the Super Administrator account.

---

### 4.5 Opérationnel / Operational User

#### Français

L'Opérationnel est l'utilisateur chargé de la saisie et du suivi des activités quotidiennes qui lui sont attribuées.

Il peut notamment :

- consulter son périmètre affecté ;
- saisir les relevés journaliers ;
- saisir les informations d'achat, de stock et de prévision autorisées ;
- consulter les partenaires, DSM ou POS qui lui sont affectés ;
- demander une correction lorsqu'une donnée doit être rectifiée.

Il ne peut pas :

- consulter librement les autres centres ;
- gérer les comptes utilisateurs ;
- modifier la structure organisationnelle ;
- créer, supprimer ou désactiver un centre ;
- modifier les affectations sans autorisation ;
- accéder aux fonctions d'administration.

Lorsqu'un Opérationnel est affecté à un partenaire ou à un périmètre précis, l'API limite ses données à cette affectation.

#### English

The Operational User is responsible for entering and monitoring assigned daily activities.

The role can generally:

- view the assigned scope;
- enter daily records;
- enter authorized purchase, stock, and forecast information;
- view assigned partners, DSMs, or POSs;
- request a correction when data must be fixed.

The role cannot:

- freely view other centres;
- manage user accounts;
- change the organizational structure;
- create, delete, or deactivate a centre;
- change assignments without authorization;
- access administration functions.

When an Operational User is assigned to a specific partner or scope, the API limits the data to that assignment.

---

## 5. Règles d'accès et restrictions
## 5. Access Rules and Restrictions

### Français

Les règles principales sont les suivantes :

- l'authentification est obligatoire pour les routes protégées ;
- l'API utilise un jeton JWT dans l'en-tête `Authorization: Bearer <token>` ;
- un compte doit être actif pour se connecter ;
- un compte suspendu, en attente ou inactif ne peut pas utiliser les fonctions normales ;
- le rôle est contrôlé côté backend, et pas uniquement masqué dans le frontend ;
- un utilisateur non Super Admin doit normalement avoir un centre rattaché ;
- les comptes non rattachés à un centre sont refusés pour les rôles qui exigent un centre ;
- les données sont filtrées par centre, partenaire, DSM, POS ou responsable selon le rôle ;
- les routes publiques sont limitées aux informations nécessaires à une demande d'accès, comme la liste des centres actifs et les rôles demandables ;
- le compte Super Admin ne peut pas être géré par les actions ordinaires de gestion des comptes ;
- les suppressions définitives doivent être réservées à une action explicitement autorisée et confirmée.

### English

The main rules are:

- authentication is required for protected routes;
- the API uses a JWT in the `Authorization: Bearer <token>` header;
- an account must be active to sign in;
- a suspended, pending, or inactive account cannot use normal features;
- the role is enforced by the backend, not merely hidden in the frontend;
- a non-Super-Administrator user normally needs an assigned centre;
- accounts without a centre are rejected for roles that require one;
- data is filtered by centre, partner, DSM, POS, or supervisor according to the role;
- public routes are limited to information needed for an access request, such as active centres and requestable roles;
- the Super Administrator account cannot be managed through ordinary account-management actions;
- permanent deletion must be restricted to an explicitly authorized and confirmed action.

---

## 6. Comptes, mots de passe et obligations de sécurité
## 6. Accounts, Passwords, and Security Obligations

### Français

Chaque utilisateur doit :

- garder son identifiant et son mot de passe confidentiels ;
- ne pas partager son compte ;
- changer immédiatement un mot de passe temporaire ;
- choisir un nouveau mot de passe d'au moins 8 caractères, avec au moins une lettre et un chiffre ;
- se déconnecter après utilisation sur un poste partagé ;
- signaler immédiatement un accès suspect ou une perte d'identifiants ;
- utiliser uniquement les données correspondant à son travail réel.

Le mot de passe temporaire n'est pas permanent. Lorsqu'un administrateur crée ou réinitialise un compte, le mot de passe généré doit être transmis de manière confidentielle et utilisé une seule fois pour le changement initial.

Les fichiers `.env`, la base SQLite active et les secrets JWT ne doivent pas être publiés dans Git ou envoyés à des personnes non autorisées.

### English

Every user must:

- keep login credentials confidential;
- never share the account;
- immediately replace a temporary password;
- choose a new password of at least 8 characters containing at least one letter and one number;
- sign out after using a shared computer;
- immediately report suspicious access or lost credentials;
- use only data relevant to the actual job.

A temporary password is not permanent. When an administrator creates or resets an account, the generated password must be shared confidentially and used only once for the initial password change.

`.env` files, the active SQLite database, and JWT secrets must not be committed to Git or shared with unauthorized people.

---

## 7. Modules fonctionnels
## 7. Functional Modules

### Français

Selon le rôle, l'application peut proposer les modules suivants :

- **Authentification** : connexion, déconnexion et changement de mot de passe ;
- **Centres** : création, modification, activation, désactivation et gouvernance globale ;
- **Organisation** : partenaires/DA, DSM, POS, zones et hiérarchie ;
- **Utilisateurs** : comptes, rôles, postes, affectations et statuts ;
- **Tableau de bord** : indicateurs, revenus, consommation, stock et suivi ;
- **Saisie journalière** : relevés d'activité par date et périmètre ;
- **Achats et ventes** : enregistrement et consultation des opérations ;
- **Objectifs et prévisions** : définition et suivi des objectifs autorisés ;
- **Corrections** : demandes et validation des corrections ;
- **Snapshots** : sauvegarde et consultation de tableaux de suivi ;
- **Import** : import de données organisationnelles lorsque le module est activé ;
- **Audit** : suivi des actions importantes.

Les modules visibles dans l'interface dépendent du rôle et des droits retournés par le backend.

### English

Depending on the role, the application may provide:

- **Authentication**: sign-in, sign-out, and password change;
- **Centres**: creation, update, activation, deactivation, and global governance;
- **Organization**: partners/DAs, DSMs, POSs, zones, and hierarchy;
- **Users**: accounts, roles, positions, assignments, and statuses;
- **Dashboard**: indicators, revenue, consumption, stock, and monitoring;
- **Daily entry**: activity records by date and scope;
- **Purchases and sales**: recording and viewing operations;
- **Objectives and forecasts**: defining and monitoring authorized objectives;
- **Corrections**: correction requests and approval;
- **Snapshots**: saving and viewing tracking tables;
- **Import**: importing organizational data when enabled;
- **Audit**: tracking important actions.

The modules displayed in the interface depend on the role and permissions returned by the backend.

---

## 8. Obligations de gestion des données
## 8. Data Management Obligations

### Français

Les responsables doivent :

- vérifier les matricules, emails, centres et affectations avant validation ;
- éviter les doublons de comptes et d'entités réseau ;
- désactiver un compte ou un centre avant de prendre une décision de suppression ;
- vérifier les impacts avant toute suppression définitive ;
- conserver une trace des décisions importantes ;
- ne jamais utiliser un compte partagé pour contourner les permissions ;
- vérifier les relevés avant de les enregistrer ou de les corriger.

La désactivation est préférable à la suppression lorsqu'une donnée doit être conservée pour l'historique ou le contrôle. Une suppression définitive ne doit être utilisée que lorsqu'elle est réellement nécessaire et autorisée.

### English

Managers and administrators must:

- verify matricules, emails, centres, and assignments before approval;
- avoid duplicate accounts and network entities;
- deactivate an account or centre before deciding to delete it;
- check the impact before any permanent deletion;
- keep a record of important decisions;
- never use a shared account to bypass permissions;
- verify records before saving or correcting them.

Deactivation is preferable to deletion when data is needed for history or control. Permanent deletion should be used only when truly necessary and authorized.

---

## 9. Procédure en cas de problème
## 9. Troubleshooting Procedure

### Français

1. Vérifier que le backend répond sur `http://localhost:5000/api/health`.
2. Vérifier que le frontend est lancé sur `http://localhost:5173`.
3. Vérifier l'identifiant et le mot de passe sans espace supplémentaire.
4. Si le compte est nouveau, utiliser le mot de passe temporaire reçu puis le remplacer.
5. Vérifier que le compte est actif et rattaché au bon centre.
6. Consulter la réponse affichée par l'API ou le terminal backend.
7. Ne pas modifier directement la base de production ou la base de démonstration sans sauvegarde et autorisation.

### English

1. Check that the backend responds at `http://localhost:5000/api/health`.
2. Check that the frontend is running at `http://localhost:5173`.
3. Check the username and password without extra spaces.
4. For a new account, use the received temporary password and then replace it.
5. Check that the account is active and assigned to the correct centre.
6. Review the API response or backend terminal output.
7. Do not modify a production or demonstration database directly without a backup and authorization.

---

## 10. FAQ
## 10. FAQ

### Q1. Pourquoi ne puis-je pas voir un autre centre ?

**Français :** Le filtrage par centre est une règle de sécurité. Seul le Super Admin dispose d'une visibilité globale, selon les routes concernées.  
**English:** Centre-based filtering is a security rule. Only the Super Administrator has global visibility, for the relevant routes.

### Q2. Pourquoi la connexion me demande-t-elle de changer mon mot de passe ?

**Français :** Le compte possède un mot de passe temporaire ou a été réinitialisé. Saisissez le mot de passe temporaire, puis créez un mot de passe d'au moins 8 caractères avec une lettre et un chiffre.  
**English:** The account has a temporary or reset password. Enter the temporary password, then create a password of at least 8 characters with a letter and a number.

### Q3. Un Manager peut-il modifier un tableau de suivi ?

**Français :** Non. Le Manager consulte les tableaux et indicateurs ; la saisie et la sauvegarde opérationnelles sont réservées aux rôles autorisés par le workflow.  
**English:** No. The Manager views tables and indicators; operational entry and saving are reserved for roles authorized by the workflow.

### Q4. Un Opérationnel peut-il gérer les utilisateurs ?

**Français :** Non. Il travaille sur son périmètre opérationnel affecté et ne possède pas les fonctions d'administration.  
**English:** No. The Operational User works within the assigned operational scope and has no administration functions.

### Q5. Qui peut créer un centre ?

**Français :** Le Super Admin est le rôle prévu pour la création et la gouvernance globale des centres.  
**English:** The Super Administrator is the role intended for global centre creation and governance.

### Q6. La suppression d'un centre peut-elle être annulée ?

**Français :** Non. La suppression définitive est irréversible dans l'application. Il faut vérifier les données et disposer d'une sauvegarde avant confirmation.  
**English:** No. Permanent deletion is irreversible in the application. Verify the data and keep a backup before confirming.

### Q7. Pourquoi un bouton ou un écran n'est-il pas disponible ?

**Français :** L'interface adapte les écrans au rôle, au statut et au périmètre. Une fonction masquée peut aussi être refusée par l'API même si elle est appelée manuellement.  
**English:** The interface adapts screens to the role, status, and scope. A hidden function may also be rejected by the API even if called manually.

### Q8. Que faire après une réinitialisation de mot de passe ?

**Français :** Utiliser le nouveau mot de passe temporaire transmis par l'administrateur, se connecter, puis le remplacer immédiatement.  
**English:** Use the new temporary password provided by the administrator, sign in, and replace it immediately.

### Q9. Puis-je relancer les seeders à chaque démarrage ?

**Français :** Non. Les seeders peuvent ajouter ou modifier des données de démonstration. Après le premier démarrage, utiliser les migrations et sauvegarder la base avant toute opération sensible.  
**English:** No. Seeders may add or change demonstration data. After the first startup, use migrations and back up the database before sensitive operations.

### Q10. Où demander de l'aide ?

**Français :** Fournir le rôle, le centre, l'action tentée, le message d'erreur et l'heure du problème. Ne jamais envoyer un mot de passe ou un secret JWT.  
**English:** Provide the role, centre, attempted action, error message, and time of the problem. Never send a password or JWT secret.

---

## 11. Résumé des obligations par rôle
## 11. Role Obligation Summary

| Rôle / Role | Périmètre / Scope | Responsabilité principale / Main responsibility | Restriction principale / Main restriction |
|---|---|---|---|
| Super Admin | Tous les centres / All centres | Gouvernance globale / Global governance | Suppression irréversible et accès sensible / Irreversible deletion and sensitive access |
| Admin | Un centre / One centre | Administration du centre / Centre administration | Pas de gouvernance globale / No global governance |
| Manager | Périmètre de supervision / Supervision scope | Lecture et pilotage / Read and monitor | Lecture seule pour les snapshots / Read-only for snapshots |
| Chef Opérationnel | Centre et équipe affectée / Centre and assigned team | Encadrement et opérations / Team and operations | Pas d'administration globale / No global administration |
| Opérationnel | Affectation personnelle / Personal assignment | Saisie quotidienne / Daily entry | Pas de gestion des comptes ou centres / No account or centre management |

---

## 12. Clause finale
## 12. Final Notice

### Français

Les règles de ce guide expliquent le fonctionnement attendu de l'application. En cas de différence entre l'interface et l'API, la règle appliquée par le backend fait foi pour la sécurité et les permissions. Toute évolution importante doit être accompagnée d'une mise à jour de ce guide.

### English

This guide explains the intended operation of the application. If the interface and API differ, the backend rule prevails for security and permissions. Any important change should be accompanied by an update to this guide.
