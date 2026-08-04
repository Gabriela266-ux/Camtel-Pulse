# 05 — Modèle Physique des Données (MPD) PostgreSQL — Camtel-Pulse

> Projet : **Camtel-Pulse** — Suivi des objectifs commerciaux (Glotelho & Master Color)
> Méthode Merise — Modèle Physique des Données (PostgreSQL)

---

## 1. Choix techniques

| Élément | Choix | Justification |
|---|---|---|
| SGBD | PostgreSQL | Cible de déploiement (Contexte §4) ; intégrité référentielle réelle |
| Identifiants | `BIGSERIAL` / `GENERATED ALWAYS AS IDENTITY` | Clés primaires auto-incrémentées robustes |
| Montants | `NUMERIC(14,2)` | Précision décimale exacte pour les montants FCFA |
| Dates | `DATE` (date de saisie) / `TIMESTAMPTZ` (horodatage) | Cohérence temporelle et fuseaux |
| Codes | `VARCHAR(20)` | Identifiants métier de recherche (`CLT-001`, `DSM-001`, `POS-001`) |
| Mot de passe | `VARCHAR(255)` | Hash sécurisé (bcrypt) |

---

## 2. Tables physiques

### Table `entites`

| Colonne | Type | Nullable | Contrainte | Description |
|---|---|---|---|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | Non | PK | Identifiant technique |
| `code_identifiant` | `VARCHAR(20)` | Non | UNIQUE | Code de recherche (CLT/DSM/POS-###) |
| `type_entite` | `VARCHAR(10)` | Non | CHECK (centre,client,dsm,pos) | Type d'entité |
| `nom` | `VARCHAR(100)` | Non | — | Nom de l'entité |
| `parent_id` | `BIGINT` | Oui | FK → entites(id) | Parent hiérarchique |
| `objectif_mensuel` | `NUMERIC(14,2)` | Oui | CHECK ≥ 0, réservé client | Objectif mensuel |
| `master_sim` | `VARCHAR(30)` | Oui | UNIQUE, réservé client | Master SIM |
| `actif` | `BOOLEAN` | Non | DEFAULT TRUE | Entité active |
| `created_at` | `TIMESTAMPTZ` | Non | DEFAULT now() | Création |
| `updated_at` | `TIMESTAMPTZ` | Non | DEFAULT now() | Modification |

### Table `saisies_journalieres`

| Colonne | Type | Nullable | Contrainte | Description |
|---|---|---|---|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | Non | PK | Identifiant technique |
| `entite_id` | `BIGINT` | Non | FK → entites(id) | Entité concernée |
| `date_saisie` | `DATE` | Non | — | Jour de la saisie |
| `vente_jour` | `NUMERIC(14,2)` | Non | CHECK ≥ 0 | Vente du jour |
| `created_at` | `TIMESTAMPTZ` | Non | DEFAULT now() | Création |
| `saisie_par` | `BIGINT` | Oui | FK → utilisateurs(id) | Utilisateur créateur |

### Table `utilisateurs`

| Colonne | Type | Nullable | Contrainte | Description |
|---|---|---|---|---|
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | Non | PK | Identifiant technique |
| `username` | `VARCHAR(50)` | Non | UNIQUE | Nom d'utilisateur |
| `email` | `VARCHAR(150)` | Non | UNIQUE | E-mail |
| `password_hash` | `VARCHAR(255)` | Non | — | Hash du mot de passe |
| `role` | `VARCHAR(20)` | Non | CHECK (agent,admin) | Rôle |
| `actif` | `BOOLEAN` | Non | DEFAULT TRUE | Compte actif |
| `created_at` | `TIMESTAMPTZ` | Non | DEFAULT now() | Création |
| `last_login_at` | `TIMESTAMPTZ` | Oui | — | Dernière connexion |

### Table `config_generale`

| Colonne | Type | Nullable | Contrainte | Description |
|---|---|---|---|---|
| `cle` | `VARCHAR(50)` | Non | PK | Clé du paramètre |
| `valeur` | `VARCHAR(255)` | Non | — | Valeur |
| `description` | `VARCHAR(255)` | Oui | — | Description |

---

## 3. Contraintes transactionnelles (CHECK)

1. **`type_entite`** : `IN ('centre','client','dsm','pos')`
2. **`objectif_mensuel`** : `>= 0` (lorsque renseigné)
3. **`vente_jour`** : `>= 0`
4. **`role`** : `IN ('agent','admin')`
5. **`master_sim`** : unique (lorsque renseigné)
6. **`code_identifiant`** : unique

---

## 4. Index

| Index | Table | Colonnes | Type | Justification |
|---|---|---|---|---|
| `idx_entites_code` | entites | code_identifiant | UNIQUE | Recherche rapide par identifiant (RG-31) |
| `idx_entites_parent` | entites | parent_id | B-tree | Agrégation hiérarchique (RG-32) |
| `idx_entites_type` | entites | type_entite | B-tree | Filtrage par type |
| `idx_saisies_entite_date` | saisies_journalieres | (entite_id, date_saisie) | UNIQUE | Unicité saisie + calcul du cumul |
| `idx_saisies_date` | saisies_journalieres | date_saisie | B-tree | Recherche par période |
| `idx_utilisateurs_username` | utilisateurs | username | UNIQUE | Authentification |
| `idx_utilisateurs_email` | utilisateurs | email | UNIQUE | Authentification |

---

## 5. Vues utiles (préparation application web)

### Vue `v_entites_avec_parent`
Ajoute le nom et le type du parent pour faciliter l'affichage de l'arborescence.

### Vue `v_suivi_journalier` (exemple)
Reconstitue le cumul par entité et par date (fonction fenêtre `SUM ... OVER`), sans stocker les données dérivées.

```sql
CREATE VIEW v_suivi_journalier AS
SELECT
    e.id AS entite_id,
    e.code_identifiant,
    e.nom,
    s.date_saisie,
    s.vente_jour,
    SUM(s.vente_jour) OVER (PARTITION BY s.entite_id
                            ORDER BY s.date_saisie
                            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS achats_cumules
FROM saisies_journalieres s
JOIN entites e ON e.id = s.entite_id;
```

---

## 6. Récapitulatif MPD

| Table | PK | FK | UK | CHECK |
|---|---|---|---|---|
| entites | id | parent_id | code_identifiant, master_sim | type_entite, objectif_mensuel ≥ 0 |
| saisies_journalieres | id | entite_id, saisie_par | (entite_id, date_saisie) | vente_jour ≥ 0 |
| utilisateurs | id | — | username, email | role |
| config_generale | cle | — | — | — |
