# Camtel-Pulse — Fonctionnalités Frontend

## Stack technique
- **React 18** + TypeScript
- **React Router** pour le routage
- **Recharts** pour les graphiques
- **Lucide React** pour les icônes
- **XLSX (SheetJS)** pour l'export Excel
- **Tailwind CSS** pour le style

---

## 1. Authentification et sécurité

### Page de connexion (`/login`)
- Formulaire email / mot de passe avec validation
- Appel API `/auth/login` via `apiService.login`
- Récupération du token JWT et de l'utilisateur
- Stockage dans `localStorage` (`cp_token`, `cp_user`)
- Redirection vers `/dashboard` après succès
- Gestion des erreurs avec message utilisateur
- Bouton de bascule thème clair/sombre

### AuthContext
- Contexte React global `useAuth()` exposant :
  - `user` : profil connecté (id, nom_complet, email, role, partenaireId)
  - `token` : JWT
  - `login(token, user)` / `logout()`
- Persistance automatique dans `localStorage`

### Routes protégées
- `ProtectedRoute` : redirection vers `/login` si pas de token
- `AdminRoute` : redirection vers `/dashboard` si le rôle n'est pas `ADMIN`
- Toutes les pages reçoivent `isDark` et `onToggleTheme` via props

### Rôles métier (4 rôles)
- `ADMIN` — Support informatique
- `MANAGER` — Lecture seule pilotage
- `CHEF_OPE` — Chef opérationnel
- `OPERATIONNEL` — Saisie terrain

---

## 2. Tableau de bord (`/dashboard`)

### Layout principal
- Sidebar collapsible (272px / 64px) avec arborescence réseau
- Header avec nom entité, sélecteur de date, bouton thème, badge utilisateur, déconnexion
- Contenu principal scrollable

### Espace par rôle (`RoleWorkspace`)
- Carte spécifique par rôle avec titre, badge, description et périmètre
- Pour `CHEF_OPE` : liste des opérationnels affectés avec bouton "Changer poste"

### Cartes KPI
- **Objectif mensuel** (FCFA) — modifiable par CHEF_OPE et OPERATIONNEL
- **Achat cumulé** (FCFA)
- **Stock de sécurité** (U) — calculé automatiquement
- **Consommation mensuelle** (U) — recalculée à chaque saisie
- **Statut réseau** — `Normal` / `Critique` selon `statut_alerte`

### Alertes dynamiques
- Bannière d'alerte si `statut_alerte !== 'NORMAL'`
- Lien vers `/modifications` pour voir les détails
- Badge "Statut Normal" si tout va bien

### Graphique de consommation (`ConsumptionChart`)
- Bar chart `recharts` : Consommation vs Stock de sécurité
- Périodes configurables : 7J, 14J, 30J
- Tooltip partagé, thème sombre/clair
- Rafraîchi à partir des `records` locaux

### Indicateurs hebdomadaires (`ProgressIndicators`)
- Taux de réalisation (Sale In) — barre de progression
- Stock journalier moyen hebdomadaire — barre de progression
- Actuellement à 0% en attendant les données backend

### Suivi journalier (`DailyTrackingTable`)
- Tableau inversé (du plus récent au plus ancien)
- Colonnes : Date, Calendrier d'Achat (U), Achat (U), Stock Journalier (U), Cumul achat (U), Écart jour, Statut
- Badge "AUJOURD'HUI" sur la ligne du jour
- Ligne colorée `NORMAL` / `CRITIQUE`
- Boutons d'action :
  - **+ Saisie journalière** (OPERATIONNEL, CHEF_OPE)
  - **+ Prévisions mensuelles** (OPERATIONNEL, CHEF_OPE)
  - **Excel** — export XLSX via SheetJS avec autofilter et format de date
  - **PDF** — impression navigateur via fenêtre dédiée

### Saisie journalière (`EntryModal`)
- Sélection de l'entité (DA, DSM, POS) dans la hiérarchie
- Date de référence, Stock journalier (U), Achat (U)
- Interdiction de modifier les jours passés
- Appel API `postSaisie` puis rechargement du dashboard
- Mise à jour locale des records avec recalcul du cumul et de la consommation

### Prévisions mensuelles (`ForecastModal`)
- Sélection du mois et de l'année
- Saisie jour par jour du Calendrier d'Achat (prévision)
- Sauvegarde dans l'état local (`setRecords`)
- Impact sur le tableau de suivi et le graphique

### Modification de l'objectif (`ObjectiveModal`)
- Saisie de la valeur cible mensuelle en FCFA
- Affichage automatique du stock de sécurité calculé
- Mise à jour immédiate des KPI dans l'état local

### Affectation opérationnel (`AssignmentModal`)
- Changement de partenaire/DSM/POS pour un opérationnel
- Listes cascade : partenaire → DSM → POS
- Disponible uniquement pour le rôle CHEF_OPE

---

## 3. Sidebar et hiérarchie réseau

### Sidebar
- Logo Camtel, nom du centre (CPDSM 1), rôle actif
- Badge de périmètre selon le rôle
- Bouton "Ajouter partenaire" (ADMIN, CHEF_OPE)
- Recherche Client/DSM/POS avec effacement
- Arborescence hiérarchique dépliante

### Arborescence (`HierarchyTree`)
- Niveaux : Centre → DA (partenaire) → DSM → POS
- Dépliage/repliage indépendant par DA et DSM
- Sélection d'entité pour charger les KPI correspondants
- Actions contextuelles selon le rôle :
  - ADMIN / CHEF_OPE : Ajouter, Modifier, Supprimer DA, DSM, POS
  - CHEF_OPE : Déplacer un POS vers un autre DSM
- Filtrage par recherche sur le nom des nœuds

---

## 4. Page Administration (`/admin`)

Accessible uniquement au rôle `ADMIN`.

### Layout admin
- Sidebar admin avec 5 sections
- Header avec titre "Administration", thème, badge utilisateur, déconnexion

### Gestion des utilisateurs (`UserManagementPanel`)
- Tableau des utilisateurs : nom, email, rôle, statut actif
- Changement de rôle (ADMIN, MANAGER, CHEF_OPE, OPERATIONNEL)
- Activation/désactivation compte
- Workflow de validation :
  - Validation (passe actif)
  - Refus (suppression)
- Limite de 5 administrateurs actifs (alerte)

### Gestion réseau technique (`NetworkAdminPanel`)
- Placeholder — interface à implémenter
- Réaffectation POS, fusion DSM, correction rattachement

### Objectifs mensuels (`ObjectivesPanel`)
- Placeholder — interface à implémenter
- Définition/modification par partenaire, verrouillage/publication

### Imports CSV (`ImportsPanel`)
- Upload de fichier CSV via sélecteur ou drag & drop
- Affichage du nombre de lignes et de la taille
- Barre de progression simulée pendant l'import
- Appel API `/import/csv` via `apiService.importCsv`
- Gestion des erreurs et affichage du résultat (nombre d'enregistrements importés)

### Audit (`AuditLogsPanel`)
- Placeholder — interface à implémenter
- Journal des actions, filtres utilisateur/date/action

---

## 5. Historique des modifications (`/modifications`)

### Page de traçabilité
- Liste des modifications avec 7 colonnes : Date, Auteur, Action, Partenaire, Entité, Détails, Statut
- Types d'actions :
  - Ajout DSM
  - Ajout POS
  - Déplacement POS
  - Saisie journalière
  - Correction de saisie
  - Validation de correction
  - Affectation opérationnel
- Statuts : EFFECTUEE, EN_ATTENTE, VALIDEE, REFUSEE
- Filtres :
  - Période : Aujourd'hui, 7 derniers jours, Mois en cours, Toute la période
  - Type d'action (tous ou spécifique)
- Affichage avant/après pour les modifications avec ancienne et nouvelle valeur
- Filtrage automatique selon le rôle :
  - OPERATIONNEL : voit uniquement ses propres modifications sur son partenaire
  - Autres rôles : vue complète

---

## 6. Thème clair/sombre

- Bascule globale via `App.tsx` (`isDark` state)
- Persistance dans `localStorage` (`camtel-theme`)
- Classe `dark` ajoutée à `documentElement`
- Toutes les pages et composants supportent le thème sombre via props `isDark`
- Classes conditionnelles Tailwind pour chaque élément UI

---

## 7. API et services

### `apiService` (`/api/services.ts`)
- `login(email, password)` → `/auth/login`
- `getHierarchie()` → `/hierarchie`
- `getDashboard(type, id)` → `/dashboard?type=...&id=...`
- `postSaisie(payload)` → `/saisies` (POST)
- `importCsv(csvContent)` → `/import/csv` (POST, timeout 60s)

### Gestion des erreurs
- Classe `ApiError` avec status HTTP
- Timeout configurable (30s par défaut, 60s pour imports)
- Headers Authorization automatiques si token présent
- Parsing JSON sécurisé

---

## 8. Types TypeScript

### Entités métier
- `CentreHierarchy` : `{ id, nom, da: DANode[] }`
- `DANode` : `{ id, nom, dsm: DSMNode[] }`
- `DSMNode` : `{ id, nom, pos: POSNode[] }`
- `POSNode` : `{ id, nom }`
- `DashboardData` : `{ entite_id, nom_entite, kpi: { objectif_mensuel, achat_cumule, stock_securite, ecart_jour, ecart_cumule, statut_alerte, consommation } }`
- `DailyRecord` : `{ date, prevision_ca, achat, stock_journalier, cumul_achat, consommation, ecart_jour, ecart_cumule, statut }`
- `OperationalAssignment` : `{ userId, nomComplet, partenaireId, partenaireNom, dsmId?, posId? }`
- `EntitySelection` : `{ type: 'DA' | 'DSM' | 'POS', id, nom }`
- `AppRole` : `'ADMIN' | 'MANAGER' | 'CHEF_OPE' | 'OPERATIONNEL'`

---

## 9. Fonctionnalités transverses

### Gestion d'état locale
- `useState` pour tous les formulaires et modales
- `useEffect` pour le chargement initial de la hiérarchie et des KPI
- `useMemo` pour les filtres et les calculs dérivés (modifications, filteredDA)

### UX / UI
- Modales avec overlay et fermeture au clic extérieur
- Loading spinners et états désactivés
- Messages d'erreur inline
- Tooltips sur les boutons d'action
- Responsive : grilles adaptatives (`md:`, `xl:`)
- Transitions et animations CSS (hover, collapse sidebar)

### Persistance
- `localStorage` pour le token, l'utilisateur et le thème
- Pas de base de données frontend (état React uniquement)
