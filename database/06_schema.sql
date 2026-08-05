-- ============================================================================
-- CAMTEL-PULSE — Script de création de la base de données
-- Suivi des objectifs commerciaux (Glotelho & Master Color) — Centre 1 CDPSM
-- ----------------------------------------------------------------------------
-- SGBD : PostgreSQL
-- Exécution : directement dans pgAdmin (Query Tool)
-- Contenu : CREATE TABLE, PK, FK, UNIQUE, CHECK, DEFAULT, INDEX,
--           Vues, Données initiales, Commentaires pédagogiques
-- ============================================================================

-- BEGIN permet d'exécuter l'ensemble en une transaction (tout ou rien).
BEGIN;

-- ============================================================================
-- 0. Activation des extensions (optionnel)
--    pgcrypto : pour générer des identifiants ou des hash si besoin.
--    (Décommenter si disponible sur votre instance PostgreSQL)
-- ============================================================================
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. TABLE : entites
-- ----------------------------------------------------------------------------
-- Représente la hiérarchie commerciale complète : Centre, Client, DSM, POS.
-- Une seule table unifiée (plutôt que clients/dsm/pos séparés) pour :
--   - garantir une hiérarchie arborescente extensible (self-JOIN),
--   - assurer une vraie clé étrangère référentielle,
--   - permettre l'agrégation POS -> DSM -> Client -> Centre.
-- ============================================================================
CREATE TABLE entites (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code_identifiant    VARCHAR(20)  NOT NULL,
    type_entite         VARCHAR(10)  NOT NULL,
    nom                 VARCHAR(100) NOT NULL,
    parent_id           BIGINT,
    objectif_mensuel    NUMERIC(14,2),
    master_sim          VARCHAR(30),
    actif               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- Unicité du code de recherche (RG-31 / RG-40)
    CONSTRAINT uq_entites_code UNIQUE (code_identifiant),

    -- Unicité de la Master SIM : un client possède une seule Master SIM (RG-07)
    CONSTRAINT uq_entites_master_sim UNIQUE (master_sim),

    -- Type d'entité restreint aux 4 niveaux de la hiérarchie (RG-01)
    CONSTRAINT ck_entites_type CHECK (type_entite IN ('centre','client','dsm','pos')),

    -- L'objectif mensuel ne peut pas être négatif (RG-08)
    CONSTRAINT ck_entites_objectif CHECK (objectif_mensuel IS NULL OR objectif_mensuel >= 0),

    -- Auto-référence : le parent hiérarchique (RG-03 à RG-05)
    CONSTRAINT fk_entites_parent FOREIGN KEY (parent_id)
        REFERENCES entites (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Index pour accélérer la recherche par identifiant métier (RG-31)
CREATE INDEX idx_entites_code ON entites (code_identifiant);

-- Index pour l'agrégation hiérarchique (RG-32)
CREATE INDEX idx_entites_parent ON entites (parent_id);

-- Index pour filtrer par type (au niveau du dashboard)
CREATE INDEX idx_entites_type ON entites (type_entite);

-- Commentaires pédagogiques sur la table
COMMENT ON TABLE  entites IS
    'Hiérarchie commerciale unifiée : Centre (0), Client (1), DSM (2), POS (3).';
COMMENT ON COLUMN entites.code_identifiant IS
    'Code unique de recherche (ex. CLT-001, DSM-001, POS-001) — RG-40.';
COMMENT ON COLUMN entites.type_entite IS
    'Type : centre, client, dsm ou pos — RG-01.';
COMMENT ON COLUMN entites.parent_id IS
    'Parent hiérarchique. NULL pour le niveau racine (Centre).';
COMMENT ON COLUMN entites.objectif_mensuel IS
    'Objectif mensuel en FCFA, réservé aux clients (RG-08). NULL sinon.';
COMMENT ON COLUMN entites.master_sim IS
    'Master SIM du client, unique (RG-07). NULL pour centre/dsm/pos.';

-- ============================================================================
-- 2. TABLE : utilisateurs
-- ----------------------------------------------------------------------------
-- Comptes d'accès à l'application pour sécuriser la saisie (RG-35).
-- Décision : plusieurs comptes avec rôles (agent / admin).
-- Créée avant saisies_journalieres car celle-ci référence utilisateurs (saisie_par).
-- ============================================================================
CREATE TABLE utilisateurs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    actif           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,

    CONSTRAINT uq_utilisateurs_username UNIQUE (username),
    CONSTRAINT uq_utilisateurs_email UNIQUE (email),
    CONSTRAINT ck_utilisateurs_role CHECK (role IN ('agent','admin'))
);

CREATE INDEX idx_utilisateurs_username ON utilisateurs (username);
CREATE INDEX idx_utilisateurs_email ON utilisateurs (email);

COMMENT ON TABLE utilisateurs IS
    'Comptes d accès à l application (RG-35). Rôles : agent ou admin.';
COMMENT ON COLUMN utilisateurs.password_hash IS
    'Hash du mot de passe (bcrypt recommandé). Jamais en clair.';
COMMENT ON COLUMN utilisateurs.role IS
    'Rôle : agent (saisie) ou admin (administration).';

-- ============================================================================
-- 3. TABLE : saisies_journalieres
-- ----------------------------------------------------------------------------
-- Vente du jour saisie manuellement par l'agent, pour une entité donnée.
-- Le cumul et les écarts ne sont PAS stockés : ils sont recalculés côté
-- backend (Node.js/Express) à partir de cet historique (cohérence des données).
-- ============================================================================
CREATE TABLE saisies_journalieres (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entite_id    BIGINT         NOT NULL,
    date_saisie  DATE           NOT NULL,
    vente_jour   NUMERIC(14,2)  NOT NULL,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    saisie_par   BIGINT,

    -- Une seule saisie par entité et par jour (RG-33)
    CONSTRAINT uq_saisies_entite_date UNIQUE (entite_id, date_saisie),

    -- La vente du jour ne peut pas être négative (RG-34)
    CONSTRAINT ck_saisies_vente CHECK (vente_jour >= 0),

    -- Référence réelle vers l'entité concernée (client/DSM/POS)
    CONSTRAINT fk_saisies_entite FOREIGN KEY (entite_id)
        REFERENCES entites (id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- Traçabilité : qui a saisi (RG-35)
    CONSTRAINT fk_saisies_utilisateur FOREIGN KEY (saisie_par)
        REFERENCES utilisateurs (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index composite pour l'unicité + le calcul du cumul par entité/date
CREATE INDEX idx_saisies_entite_date ON saisies_journalieres (entite_id, date_saisie);

-- Index pour rechercher par période (graphique 7 jours, tableau de bord)
CREATE INDEX idx_saisies_date ON saisies_journalieres (date_saisie);

COMMENT ON TABLE saisies_journalieres IS
    'Saisie de la vente du jour par entité (RG-30). Cumul/écarts recalculés.';
COMMENT ON COLUMN saisies_journalieres.vente_jour IS
    'Quantité achetée par l entité ce jour-là, en FCFA (RG-30).';
COMMENT ON COLUMN saisies_journalieres.date_saisie IS
    'Date du jour concerné (J). Unicité sur (entite_id, date_saisie) — RG-33.';

-- ============================================================================
-- 4. TABLE : config_generale
-- ----------------------------------------------------------------------------
-- Paramètres métier globaux évolutifs (préparation de l'application web).
-- Ex. : jours_stock_securite = 3, jours_mois = 31, jours_tendance = 7.
-- ============================================================================
CREATE TABLE config_generale (
    cle          VARCHAR(50)  PRIMARY KEY,
    valeur       VARCHAR(255) NOT NULL,
    description  VARCHAR(255)
);

COMMENT ON TABLE config_generale IS
    'Paramètres globaux évolutifs (stock sécurité, jours/mois, tendance).';

-- ============================================================================
-- 5. DONNÉES INITIALES (jeu de référence)
-- ----------------------------------------------------------------------------
-- Insère le Centre 1 CDPSM et les deux clients Glotelho & Master Color.
-- Les DSM/POS seront ajoutés ultérieurement (renseignés par l'équipe).
-- ============================================================================

-- Centre 1 CDPSM : racine de la hiérarchie (niveau 0)
INSERT INTO entites (code_identifiant, type_entite, nom, parent_id)
VALUES ('CTR-001', 'centre', 'Centre 1 CDPSM', NULL);

-- Client Glotelho (niveau 1) + objectif mensuel + Master SIM
INSERT INTO entites (code_identifiant, type_entite, nom, parent_id, objectif_mensuel, master_sim)
VALUES ('CLT-001', 'client', 'Glotelho',
        (SELECT id FROM entites WHERE code_identifiant = 'CTR-001'),
        3100000.00, 'SIM-GLO-0001');

-- Client Master Color (niveau 1) + objectif mensuel + Master SIM
INSERT INTO entites (code_identifiant, type_entite, nom, parent_id, objectif_mensuel, master_sim)
VALUES ('CLT-002', 'client', 'Master Color',
        (SELECT id FROM entites WHERE code_identifiant = 'CTR-001'),
        2500000.00, 'SIM-MCO-0002');

-- Paramètres globaux par défaut
INSERT INTO config_generale (cle, valeur, description) VALUES
    ('jours_mois', '31', 'Nombre de jours retenu pour le calcul du stock de sécurité (RG-10).'),
    ('jours_stock_securite', '3', 'Nombre de jours de couverture du stock de sécurité (RG-10).'),
    ('jours_tendance', '7', 'Nombre de jours affichés dans le graphique du tableau de bord.');

-- ============================================================================
-- 6. VUES (préparation de l'application web / backend)
-- ----------------------------------------------------------------------------
-- Les vues ne stockent rien : elles exposent des données calculées à la volée.
-- ============================================================================

-- Vue : entités avec le nom/type/code du parent (affichage de l'arborescence)
CREATE VIEW v_entites_avec_parent AS
SELECT
    e.id,
    e.code_identifiant,
    e.type_entite,
    e.nom,
    e.objectif_mensuel,
    e.master_sim,
    e.actif,
    p.id          AS parent_id,
    p.nom         AS parent_nom,
    p.type_entite AS parent_type,
    p.code_identifiant AS parent_code
FROM entites e
LEFT JOIN entites p ON p.id = e.parent_id;

-- Vue : suivi journalier avec achats cumulés par entité (recaclul à la volée)
--   cumul(J) = cumul(J-1) + vente(J)  →  fonction fenêtre SUM(...) OVER
CREATE VIEW v_suivi_journalier AS
SELECT
    e.id               AS entite_id,
    e.code_identifiant,
    e.nom,
    e.type_entite,
    s.date_saisie,
    s.vente_jour,
    SUM(s.vente_jour) OVER (
        PARTITION BY s.entite_id
        ORDER BY s.date_saisie
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS achats_cumules
FROM saisies_journalieres s
JOIN entites e ON e.id = s.entite_id;

-- ============================================================================
-- 7. FONCTION : mise à jour automatique de updated_at
-- ----------------------------------------------------------------------------
-- Déclencheur pour maintenir la colonne updated_at de la table entites.
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entites_updated_at
    BEFORE UPDATE ON entites
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 8. FIN DE LA TRANSACTION
-- ============================================================================
COMMIT;

-- ============================================================================
-- RÉCAPITULATIF FINAL
-- Tables      : entites, saisies_journalieres, utilisateurs, config_generale
-- Vues        : v_entites_avec_parent, v_suivi_journalier
-- Fonctions   : set_updated_at (déclencheur)
-- Données init : Centre 1 CDPSM, Glotelho, Master Color, paramètres globaux
-- ============================================================================
