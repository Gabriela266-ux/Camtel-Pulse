# Camtel-Pulse

**Version Premium — Août 2026**
*(intègre les compléments du cahier des charges « PRO » : calendrier, champs dynamiques Prévision/Réalisation/Suivi, cascade de calcul du stock de sécurité)*

Application de suivi des objectifs commerciaux et de la performance des points de vente (POS) — CPDSM 1, Camtel Littoral (rattaché à la DRLM/DVBUM).

Camtel-Pulse remplace le suivi manuel par exports Excel (« Balance Overview ») par une plateforme web centralisée : saisie journalière, calendrier mensuel/hebdomadaire/journalier, calcul automatique des seuils, alertes visuelles, historisation complète et gestion fine des accès.

## Sommaire

- [Contexte](#contexte)
- [Terminologie — équivalences Cahier PRO / V2](#terminologie--équivalences-cahier-pro--v2)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Structure du dépôt](#structure-du-dépôt)
- [Modèle métier](#modèle-métier)
- [Rôles et accès](#rôles-et-accès)
- [Suivi journalier — Prévision / Réalisation / Suivi (Premium)](#suivi-journalier--prévision--réalisation--suivi-premium)
- [Calendrier mensuel, hebdomadaire et journalier](#calendrier-mensuel-hebdomadaire-et-journalier)
- [Cascade de calcul du stock de sécurité](#cascade-de-calcul-du-stock-de-sécurité)
- [Champs dynamiques et report de solde](#champs-dynamiques-et-report-de-solde)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts disponibles](#scripts-disponibles)
- [Règles métier de référence](#règles-métier-de-référence)
- [Roadmap](#roadmap)
- [Points encore à trancher avec l'encadreur](#points-encore-à-trancher-avec-lencadreur)
- [Documentation complémentaire](#documentation-complémentaire)

## Contexte

Le CPDSM 1 suit les objectifs commerciaux mensuels fixés par Camtel à ses partenaires stratégiques (Glotelho, Master Color), via un réseau structuré : **Centre → Client/Master SIM (DA) → DSM → POS** (avec de rares cas de Sous-POS rattachés à un autre POS).

Le cahier des charges « PRO » situe ce Centre au sein d'une organisation plus large : **DRLM → DVBUM → Centre (CDPSM) → DA/Master SIM → DSM → POS**. Cette racine DRLM/DVBUM est documentée pour préparer une éventuelle extension multi-centres, mais n'entre pas dans le périmètre fonctionnel du pilote Centre 1.

## Terminologie — équivalences Cahier PRO / V2

Les deux versions du cahier des charges désignent parfois les mêmes objets par des noms différents. Le tableau suivant sert de référence unique pour éviter toute ambiguïté dans le code et la documentation.

| Cahier PRO | Cahier V2 (utilisé dans le modèle de données) | Signification |
|---|---|---|
| DRLM / DVBUM | Camtel Littoral (racine) | Entité de tutelle au-dessus du Centre |
| DA (Master SIM) | Client / Master SIM | Partenaire (Glotelho, Master Color) |
| Chef SAT / Chef SGZDAV | Chef opérationnel | Rôle de pilotage du centre |
| Support informatique | Admin | Rôle de gestion technique |
| AT | Opérationnel | Rôle de saisie |

➡️ **Dans le code et les schémas, la terminologie V2 (Client, Chef opérationnel, Admin, Opérationnel) reste la référence.** Les termes PRO sont conservés ici à titre de glossaire de correspondance.

## Fonctionnalités principales

- Authentification et cycle de vie des comptes (demande → validation Admin sous 72 h → activation)
- Gestion hiérarchique du réseau (Centre, Client/DA, DSM, POS, Sous-POS)
- Import initial et incrémental depuis les exports « Balance Overview »
- **Construction automatique d'un calendrier mensuel, hebdomadaire et journalier** par entité (Client, DSM, POS), généré dès la création de la table d'achat du mois
- Saisie journalière des ventes par POS, avec calcul automatique :
  - `Stock de sécurité = (Objectif mensuel du client ÷ 31) × 3` (formule de référence Centre/Client)
  - Cascade affinée par DSM/POS (voir [Cascade de calcul du stock de sécurité](#cascade-de-calcul-du-stock-de-sécurité))
  - Cumul, écart du jour, écart cumulé
- **Champs Prévision / Réalisation / Suivi et leurs cumuls**, avec règles de modification dédiées (voir section Premium ci-dessous)
- **Report automatique du solde de fin de mois** vers le champ Suivi du mois suivant (champ dynamique)
- Système d'alertes CRITIQUE / NORMAL, avec propagation POS → DSM
- Demandes de correction (fenêtre 48 h) avec validation par le Chef opérationnel
- Réaffectation de POS et fusion de DSM, historisées et réservées à l'Admin
- Tableau de bord par rôle, recherche par identifiant, historique et graphiques
- Journal d'audit exhaustif et notifications

## Stack technique

| Bloc | Choix |
|---|---|
| Backend | Node.js + Express.js |
| ORM | Sequelize |
| Base de données | SQLite local (Sequelize) |
| Authentification | JWT (access + refresh token) |
| Frontend | React + React Router |
| État global | React Context / Redux Toolkit |
| HTTP client | Axios |
| UI Kit | Ant Design ou MUI |
| Validation | Joi/Zod (backend), React Hook Form + Yup (frontend) |
| Tests | Jest + Supertest (backend), React Testing Library (frontend) |
| Logs / Audit | Winston + table `audit_logs` |
| Import fichiers | Multer + csv-parse / xlsx |
| Planification / calendrier | Génération de table calendaire (jobs `jobs/generateMonthlyCalendar`, `jobs/carryOverBalance`) |

## Architecture

```
Client (React SPA)
   │  HTTPS (REST + JWT)
API Gateway (Express Router)
   │  Auth, RBAC+Scope, Validation, Rate-limit, Logging, Error handler
Couche services métier
   │  Organisation, Saisie, Calendrier, Calculs (Prévision/Réalisation/Suivi), Alertes, Corrections, Imports, Audit, Notifications
Couche accès données (Sequelize ORM)
   │
SQLite
```

**Principe non négociable** : le frontend n'est jamais la seule protection. Chaque route sensible du backend revérifie rôle + périmètre, même si l'UI cache déjà l'action.

## Structure du dépôt

```
camtel-pulse-backend/
├── src/
│   ├── config/            # connexion DB, env, sécurité JWT
│   ├── models/             # entités Sequelize
│   ├── repositories/       # requêtes complexes isolées des services
│   ├── services/           # logique métier (organisation, saisie, calendrier, calcul, alerte, correction, import, audit, notification)
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/        # auth, rbacScope, validate, errorHandler, auditLogger
│   ├── utils/               # formule seuils, fenêtres 72h/48h, csvParser
│   ├── jobs/                 # expireAccountRequests, recalculateAlerts, generateMonthlyCalendar, carryOverBalance
│   └── app.js
├── migrations/
├── seeders/
└── tests/

camtel-pulse-frontend/
├── src/
│   ├── api/                 # clients Axios par domaine
│   ├── auth/                # AuthContext, ProtectedRoute
│   ├── pages/                # auth/ admin/ manager/ chef-operationnel/ operationnel/
│   ├── components/           # dashboard/ forms/ calendrier/ common/
│   ├── hooks/
│   └── routes/
```

## Modèle métier

| Niveau | Entité | Rattachement |
|---|---|---|
| 0 | DRLM / DVBUM (racine PRO, hors périmètre pilote) | — |
| 0bis | Camtel Littoral | Racine (référence V2) |
| 1 | Centre (CDPSM) | Camtel Littoral |
| 2 | Client / Master SIM (DA) | Centre |
| 3 | DSM | Client |
| 4 | POS | DSM |
| 5 (rare) | Sous-POS | Autre POS |

**Règle** : un POS est rattaché de manière exclusive à un DSM (ou, cas rare, à un autre POS) à un instant donné. Toute réaffectation est exclusive et historisée (table `pos_assignment_history`).

Table complète du schéma (Sequelize) : voir `docs/Camtel-Pulse_Documentation_Projet.docx`, section 17.

## Rôles et accès

| Rôle | Droits |
|---|---|
| **Admin** | Gestion technique complète : utilisateurs, réseau, imports, fusion DSM, réattribution POS, audit, **mise à jour des objectifs mensuels**. Max 5 admins actifs. |
| **Manager** | Lecture seule : dashboard, alertes, graphiques, historique. |
| **Chef opérationnel** | Gère les opérationnels et clients de son centre, valide les corrections. |
| **Opérationnel** | Saisie/consultation selon son périmètre : Client, DSM ou POS. **Peut également mettre à jour les objectifs** dans le cadre défini par le cahier PRO ⚠️ *(point à confirmer, voir section Points à trancher)*. |

Contrôle d'accès à deux dimensions : **rôle + périmètre** (`user_scopes`), vérifié côté backend sur chaque requête sensible via `rbacScope.middleware`.

## Suivi journalier — Prévision / Réalisation / Suivi (Premium)

Le cahier PRO enrichit la saisie journalière avec trois champs distincts, chacun avec ses propres règles de création, de modification et de cumul. Ils remplacent/complètent la simple « vente du jour » de la version initiale.

| Champ | Définition | Qui le remplit | Quand | Modifiable par |
|---|---|---|---|---|
| **Prévision** | Objectif attendu pour le jour, dérivé de l'objectif mensuel du partenaire | Généré automatiquement à la création de la table d'achat du mois | À la création de la table d'achat mensuelle (obligatoire avant validation de la table) | Admin et Opérationnel uniquement — aucun autre rôle |
| **Réalisation** | Montant réellement encaissé, saisi chaque matin | Opérationnel | Chaque jour (matin) | Modifiable, **plafonné à 5 corrections** par saisie |
| **Suivi** | Équivaut au stock de sécurité ; sert de référence de comparaison | Calculé automatiquement par le système | Recalculé chaque jour | Champ **dynamique**, non saisi manuellement |
| **Cumul Prévision** | Somme des prévisions depuis le 1er du mois | Calculé automatiquement | En continu | Non modifiable |
| **Cumul Suivi** | Somme des valeurs de Suivi depuis le 1er du mois | Calculé automatiquement | En continu | Non modifiable |

Règles associées :

- La table de Prévision est générée **une seule fois par mois et par partenaire**, au moment de la création de la « table d'achat » — toutes les cases de Prévision doivent être remplies obligatoirement avant que la table puisse être validée.
- Le champ **Réalisation** est comparé chaque jour à la **Prévision** du même jour pour produire l'écart journalier.
- Au-delà de **5 modifications** sur une même Réalisation, le champ est verrouillé ; toute correction supplémentaire doit passer par le circuit standard de demande de correction (48 h, validation Chef opérationnel).
- Le résultat final par jour est consolidé dans une table unique comportant : **Stock (Suivi) / Achat (Réalisation) / Cumul Achat / Cumul Stock**, en plus des colonnes Prévision et Cumul Prévision déjà décrites.

## Calendrier mensuel, hebdomadaire et journalier

- À la création de la table d'achat d'un partenaire pour un mois donné, le système **génère automatiquement le calendrier complet du mois** (une ligne par jour).
- Ce calendrier est consultable selon trois granularités :
  - **Journalière** : saisie et consultation jour par jour (Prévision / Réalisation / Suivi du jour).
  - **Hebdomadaire** : agrégation des 7 jours, utile pour le pilotage à court terme du Chef opérationnel.
  - **Mensuelle** : vue globale avec cumuls (Cumul Prévision, Cumul Suivi) et statut global du mois.
- Le nombre de jours pris en compte dans les calculs de stock de sécurité correspond aux **jours ouvrés réels** du mois (et non plus systématiquement à 31, voir section suivante).

## Cascade de calcul du stock de sécurité

Le cahier PRO précise la répartition du stock de sécurité, jusqu'ici calculée uniquement au niveau Client. La cascade complète est la suivante :

1. **Niveau Client (Sale In)** : l'objectif mensuel du partenaire (Client/DA) est enregistré ; le stock de sécurité de référence est valorisé **au premier jour du calendrier du mois**, puis la table du mois est générée.
2. **Niveau DSM → POS (Sale Out)** :
   - On sélectionne le DSM concerné.
   - `Montant par POS = Objectif mensuel du DSM ÷ nombre de POS (n) rattachés à ce DSM`
   - `Stock de sécurité (POS) = (Montant par POS ÷ nombre de jours ouvrés de la période) × 3`
3. Une table est générée pour chaque entité avec les colonnes : **Stock, Achat, Cumul Achat, Cumul Stock**.

Formule de référence conservée (niveau Client, cas général) :

```
Stock de sécurité (Client) = (Objectif mensuel du Client ÷ 31) × 3
```

Formule affinée (niveau POS, cascade PRO) :

```
Stock de sécurité (POS) = ((Objectif mensuel du DSM ÷ nombre de POS n) ÷ nombre de jours ouvrés) × 3
```

⚠️ La coexistence des deux formules (31 jours fixes vs jours ouvrés réels) reste un point à trancher — voir [Points encore à trancher](#points-encore-à-trancher-avec-lencadreur).

## Champs dynamiques et report de solde

- **Report de solde de fin de mois** : si, au dernier jour d'un mois, il subsiste un solde non consommé sur le compte du client, ce montant est **automatiquement reporté** dans le champ **Suivi** du premier jour du mois suivant (champ dynamique, recalculé par le job `carryOverBalance`).
- Le champ Suivi n'est donc jamais figé : il dépend à la fois du calcul du stock de sécurité du jour **et** d'un éventuel report du mois précédent.

## Installation

```powershell
# Depuis la racine du dépôt
cd backend
npm install
Copy-Item .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Le backend est alors accessible sur `http://localhost:5000`. Aucun serveur
MySQL ou PostgreSQL n'est nécessaire : la base `camtel_pulse.db` reste locale
et n'est pas envoyée sur GitHub. Le frontend se récupère depuis la branche
`frontend` et se lance séparément sur `http://localhost:5173`.

## Variables d'environnement

| Variable | Description |
|---|---|
| `DB_STORAGE` | Chemin du fichier SQLite local (par défaut `./camtel_pulse.db`) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Signature des tokens |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Durées de validité |
| `ACCOUNT_REQUEST_WINDOW_HOURS` | Fenêtre de validation des comptes (72 h) |
| `CORRECTION_WINDOW_HOURS` | Fenêtre de correction des saisies (48 h) |
| `MAX_ACTIVE_ADMINS` | Plafond d'admins actifs (5) |
| `MAX_REALISATION_EDITS` | Nombre maximal de modifications autorisées sur le champ Réalisation (5) |

## Scripts disponibles

```bash
npm run dev            # démarrage en développement
npm run db:migrate     # appliquer les migrations SQLite
npm run db:seed        # installer le jeu initial local
npm test                # tests unitaires + intégration
npm run lint             # analyse statique
npx sequelize-cli db:migrate:undo   # rollback de la dernière migration
```

## Règles métier de référence

| ID | Règle |
|---|---|
| RB-01 | Maximum 5 Admins actifs |
| RB-02 | Validation d'une demande de compte par un Admin sous 72 h |
| RB-03 | Droits = rôle + affectation |
| RB-04 | Création technique des entités réservée à l'Admin |
| RB-05 | Un POS = une seule affectation DSM active |
| RB-06 | Toute réaffectation est historisée |
| RB-07 | Le premier import crée la structure + les soldes |
| RB-08 | Import partiel autorisé ; lignes valides conservées |
| RB-09 | Correction demandée par l'auteur uniquement |
| RB-10 | Validation de correction par le Chef opérationnel |
| RB-11 | Fenêtre de correction = 48 h |
| RB-12 / RB-13 | Inférieur au seuil = CRITIQUE ; égal/supérieur = NORMAL |
| RB-14 | Un seul POS sous seuil suffit à rendre le DSM CRITIQUE |
| RB-15 | Historique non destructif |
| RB-16 | La Prévision est générée à la création de la table d'achat mensuelle et doit être intégralement remplie avant validation |
| RB-17 | La Prévision n'est modifiable que par l'Admin ou l'Opérationnel |
| RB-18 | La Réalisation ne peut être modifiée plus de 5 fois ; au-delà, le circuit de correction standard (RB-09 à RB-11) s'applique |
| RB-19 | Le champ Suivi est calculé automatiquement (stock de sécurité + report éventuel) et n'est jamais saisi manuellement |
| RB-20 | Un solde résiduel en fin de mois est reporté automatiquement dans le Suivi du mois suivant |

## Roadmap

1. Cadrage — validation du cahier des charges et des règles métier
2. Conception — MCD/MLD, architecture technique, maquettage
3. Développement — auth, réseau, imports, saisie, calendrier, calculs (Prévision/Réalisation/Suivi), permissions
4. Reporting — dashboard, alertes, recherche, historique
5. Recette et mise en service — tests terrain, formation, déploiement pilote CPDSM 1

## Points encore à trancher avec l'encadreur

- Règle exacte de répartition du stock de sécurité vers les DSM/POS *(en partie clarifiée par la cascade PRO ci-dessus, à valider formellement)*
- Traitement définitif des POS rattachés à un autre POS
- Base partagée ou interopérable avec le projet CDSM/POSTRACK
- Mécanisme précis d'activation de compte après approbation (au-delà de la validation à 72 h)
- **Coexistence des deux formules de stock de sécurité** (÷31 jours fixes au niveau Client vs ÷jours ouvrés réels au niveau POS)
- **Droit de modification de la Prévision accordé à l'Opérationnel** : à confirmer, car il semble en tension avec le principe RB-04 (création technique réservée à l'Admin) et avec le tableau des droits par rôle
- Définition exacte de « jours ouvrés » utilisée dans la formule POS (jours calendaires du mois, jours hors week-end, jours hors fériés ?)
- Comportement attendu si le solde reporté (fin de mois) est négatif

## Documentation complémentaire

- `docs/Camtel-Pulse_Documentation_Projet.docx` — documentation fonctionnelle et technique complète
- `docs/Guide_Utilisateur_Camtel-Pulse.docx` — guide utilisateur par rôle
