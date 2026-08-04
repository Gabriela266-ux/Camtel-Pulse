# 01 — Dictionnaire des données — Camtel-Pulse

> Projet : **Camtel-Pulse** — Suivi des objectifs commerciaux (Glotelho & Master Color)
> Centre 1 CDPSM — Camtel
> Conçu à partir de l'analyse EXCLUSIVE des documents fournis (Cahier des charges, Contexte du projet, Structuration fonctionnelle).

---

## Conventions

- **NC** : Non Concerné (attribut non applicable à ce type d'entité)
- **PK** : Clé primaire
- **FK** : Clé étrangère
- Tous les montants sont exprimés en **FCFA** (décision validée).
- Les identifiants techniques sont des nombres auto-incrémentés ; les identifiants métier de recherche sont des codes uniques (`CLT-001`, `DSM-001`, `POS-001`).

---

## 1. Table `entites`

Table **unifiée** représentant l'ensemble de la hiérarchie commerciale : Centre, Client, DSM, POS.
Elle remplace les tables séparées `clients`, `dsm`, `pos` proposées dans le document de structuration, afin de garantir une hiérarchie extensible et des clés étrangères réelles.

### 1.1 Rôle de chaque type d'entité

| Type (`type_entite`) | Niveau | Rôle | Entité « centrée » |
|---|---|---|---|
| `centre` | 0 | Racine du périmètre, géré par l'agent | Centre 1 CDPSM |
| `client` | 1 | Objectif mensuel fixé par Camtel + Master SIM | Glotelho / Master Color |
| `dsm` | 2 | Distributeur rattaché à un client | DSM |
| `pos` | 3 | Point de vente rattaché à un DSM | POS |

### 1.2 Attributs

| Attribut | Code | Type SQL | Clé | Contrainte | Description |
|---|---|---|---|---|---|
| Identifiant technique | `id` | `BIGINT` | PK | Auto-incrément | Identifiant interne unique de l'entité |
| Code métier | `code_identifiant` | `VARCHAR(20)` | UK | UNIQUE, NOT NULL | Code unique de recherche (ex. `CLT-001`, `DSM-001`, `POS-001`) |
| Type d'entité | `type_entite` | `VARCHAR(10)` | — | NOT NULL, CHECK (centre, client, dsm, pos) | Type de l'entité dans la hiérarchie |
| Nom | `nom` | `VARCHAR(100)` | — | NOT NULL | Nom de l'entité (ex. Glotelho, Master Color) |
| Entité parente | `parent_id` | `BIGINT` | FK | FK → `entites(id)`, NULL pour le centre | Parent hiérarchique (client→centre, dsm→client, pos→dsm) |
| Objectif mensuel | `objectif_mensuel` | `NUMERIC(14,2)` | — | NULL, CHECK ≥ 0, réservé aux clients | Objectif mensuel fixé par Camtel (FCFA) |
| Master SIM | `master_sim` | `VARCHAR(30)` | — | NULL, UNIQUE, réservé aux clients | Numéro de la Master SIM du client (unique si renseigné) |
| Actif | `actif` | `BOOLEAN` | — | NOT NULL, DEFAULT TRUE | Indique si l'entité est active (désactivation possible) |
| Date de création | `created_at` | `TIMESTAMPTZ` | — | NOT NULL, DEFAULT now() | Date de création de l'enregistrement |
| Date de modification | `updated_at` | `TIMESTAMPTZ` | — | NOT NULL, DEFAULT now() | Date de dernière modification |

### 1.3 Règles de domaine (CHECK)

- `type_entite IN ('centre','client','dsm','pos')`
- `objectif_mensuel >= 0` (lorsque renseigné) — réservé au type `client`
- `master_sim` unique (lorsque renseigné) — réservé au type `client`

---

## 2. Table `saisies_journalieres`

Enregistre la **vente du jour** saisie manuellement par l'agent pour une entité donnée, à une date donnée.
Le cumul et les écarts **ne sont pas stockés** : ils sont recalculés côté backend à partir de cet historique (décision documentaire respectée).

### 2.1 Attributs

| Attribut | Code | Type SQL | Clé | Contrainte | Description |
|---|---|---|---|---|---|
| Identifiant technique | `id` | `BIGINT` | PK | Auto-incrément | Identifiant interne unique de la saisie |
| Entité concernée | `entite_id` | `BIGINT` | FK | FK → `entites(id)`, NOT NULL | Entité (client, DSM ou POS) à laquelle la vente du jour se rapporte |
| Date de saisie | `date_saisie` | `DATE` | — | NOT NULL | Date du jour concerné (J) |
| Vente du jour | `vente_jour` | `NUMERIC(14,2)` | — | NOT NULL, CHECK ≥ 0 | Quantité achetée par l'entité ce jour-là (FCFA) |
| Date de création | `created_at` | `TIMESTAMPTZ` | — | NOT NULL, DEFAULT now() | Date de création de l'enregistrement |

### 2.2 Contraintes

- **Unicité** : une seule saisie par entité et par date → `UNIQUE (entite_id, date_saisie)`
- **Domaine** : `vente_jour >= 0`

---

## 3. Table `utilisateurs`

Comptes d'accès à l'application pour sécuriser la saisie des données (décision validée : plusieurs comptes avec rôles).

### 3.1 Attributs

| Attribut | Code | Type SQL | Clé | Contrainte | Description |
|---|---|---|---|---|---|
| Identifiant technique | `id` | `BIGINT` | PK | Auto-incrément | Identifiant interne unique de l'utilisateur |
| Nom d'utilisateur | `username` | `VARCHAR(50)` | UK | UNIQUE, NOT NULL | Identifiant de connexion |
| Adresse e-mail | `email` | `VARCHAR(150)` | UK | UNIQUE, NOT NULL | E-mail de l'utilisateur (identifiant de connexion possible) |
| Mot de passe (hash) | `password_hash` | `VARCHAR(255)` | — | NOT NULL | Hash du mot de passe (bcrypt, etc.) |
| Rôle | `role` | `VARCHAR(20)` | — | NOT NULL, CHECK (agent, admin) | Rôle de l'utilisateur |
| Actif | `actif` | `BOOLEAN` | — | NOT NULL, DEFAULT TRUE | Compte actif ou désactivé |
| Date de création | `created_at` | `TIMESTAMPTZ` | — | NOT NULL, DEFAULT now() | Date de création du compte |
| Date de dernière connexion | `last_login_at` | `TIMESTAMPTZ` | — | NULL | Dernière connexion à l'application |

### 3.2 Règles de domaine

- `role IN ('agent','admin')`

---

## 4. Table `config_generale` (optionnelle — paramètres globaux)

Permet de stocker des paramètres métier globaux évolutifs (ex. nombre de jours pour le stock de sécurité, valeur de 31 jours/mois, jours de tendance du graphique). Évolutivité préparée pour la future application.

### 4.1 Attributs

| Attribut | Code | Type SQL | Clé | Contrainte | Description |
|---|---|---|---|---|---|
| Clé de paramètre | `cle` | `VARCHAR(50)` | PK | NOT NULL | Nom du paramètre (ex. `jours_mois`, `jours_stock_securite`) |
| Valeur | `valeur` | `VARCHAR(255)` | — | NOT NULL | Valeur du paramètre |
| Description | `description` | `VARCHAR(255)` | — | NULL | Explication du paramètre |

---

## 5. Récapitulatif des champs calculés (non stockés)

| Champ calculé | Formule | Source |
|---|---|---|
| Stock de sécurité (client) | `(objectif_mensuel / 31) × 3` | Règle de gestion RG-01 |
| Stock de sécurité (DSM/POS) | `stock_sécurité_client / nombre_entités_de_même niveau` (parts égales) | Règle RG-02 |
| Achats cumulés (J) | `Achats cumulés (J−1) + Vente du jour (J)` | Règle RG-03 |
| Écart du jour | `Vente du jour − Stock de sécurité` | Règle RG-04 |
| Écart cumulé | `Achats cumulés − Stock de sécurité` | Règle RG-05 |

> Ces calculs relèvent de la logique applicative (backend Node.js/Express) et ne sont pas matérialisés en colonnes, conformément aux documents (cohérence de l'historique).

---

## 6. Origine des données (traçabilité)

| Donnée | Source documentaire |
|---|---|
| Hiérarchie Centre/Client/DSM/POS | Cahier des charges §3, Contexte §2, Structuration §2 |
| Objectif mensuel + Master SIM par client | Cahier des charges §3, Contexte §2, Structuration §6 |
| Formule stock de sécurité | Cahier des charges §4.1, Contexte §3, Structuration §3.1 |
| Formule cumul / écarts / alertes | Cahier des charges §4.2 & §4.3, Contexte §3, Structuration §4 |
| Recherche par identifiant | Cahier des charges §5.1, Contexte §3, Structuration §5 |
| Saisie journalière manuelle | Cahier des charges §5.2, Structuration §4 |
| Cumul/écarts non stockés | Contexte §4, Structuration §7.2 |
| Répartition parts égales DSM/POS | Cahier des charges §10 (hypothèse maquette), Contexte §3 |
| Stack SQLite→PostgreSQL | Contexte §4, Structuration §7.2 |
