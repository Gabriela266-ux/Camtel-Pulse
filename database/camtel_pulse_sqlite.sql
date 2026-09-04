-- =====================================================================
-- Camtel Pulse — Schéma SQLite aligné sur l'implémentation réelle
-- (backend/migrations/*) : 17 tables.
-- Généré pour remplacer l'ancien schéma à 11 tables désynchronisé.
-- =====================================================================
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS calendrier_achat;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS correction;
DROP TABLE IF EXISTS prevision_journaliere;
DROP TABLE IF EXISTS acht_journaliere;
DROP TABLE IF EXISTS vente_dsm_au_pos;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS objectif_mensuel;
DROP TABLE IF EXISTS demande_acces;
DROP TABLE IF EXISTS utilisateur;
DROP TABLE IF EXISTS poste;
DROP TABLE IF EXISTS pos;
DROP TABLE IF EXISTS dsm;
DROP TABLE IF EXISTS da;
DROP TABLE IF EXISTS centre;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS zone;

CREATE TABLE zone (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    nom_zone VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE role (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE centre (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    nom_centre VARCHAR(150) NOT NULL,
    region VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE da (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    centre_id VARCHAR(36) NOT NULL REFERENCES centre(id) ON DELETE CASCADE ON UPDATE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(150) NOT NULL,
    objectif_mensuel DECIMAL(15,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT 1,
    region VARCHAR(100),
    numero_sim VARCHAR(50) UNIQUE,
    code_zone VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dsm (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    da_id VARCHAR(36) NOT NULL REFERENCES da(id) ON DELETE CASCADE ON UPDATE CASCADE,
    zone_id VARCHAR(36) REFERENCES zone(id) ON DELETE SET NULL ON UPDATE CASCADE,
    nom VARCHAR(150) NOT NULL,
    numero_telephone VARCHAR(20) UNIQUE,
    code_dsm VARCHAR(50),
    code_zone VARCHAR(50),
    raison_sociale VARCHAR(150),
    adresse VARCHAR(255),
    contact VARCHAR(50),
    statut VARCHAR(50) NOT NULL DEFAULT 'actif',
    date_adhesion DATEONLY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pos (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    dsm_id VARCHAR(36) NOT NULL REFERENCES dsm(id) ON DELETE CASCADE ON UPDATE CASCADE,
    zone_id VARCHAR(36) REFERENCES zone(id) ON DELETE SET NULL ON UPDATE CASCADE,
    nom VARCHAR(150) NOT NULL,
    numero_telephone VARCHAR(20) UNIQUE,
    code_pos VARCHAR(50),
    code_dsm VARCHAR(50),
    code_zone VARCHAR(50),
    raison_sociale VARCHAR(150),
    adresse VARCHAR(255),
    contact VARCHAR(50),
    statut VARCHAR(50) NOT NULL DEFAULT 'actif',
    date_adhesion DATEONLY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE poste (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    role_id VARCHAR(36) NOT NULL REFERENCES role(id),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE INDEX idx_poste_role ON poste(role_id);

CREATE TABLE utilisateur (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    role_id VARCHAR(36) NOT NULL REFERENCES role(id),
    poste_id VARCHAR(36) REFERENCES poste(id),
    da_id VARCHAR(36) REFERENCES da(id),
    dsm_id VARCHAR(36) REFERENCES dsm(id),
    pos_id VARCHAR(36) REFERENCES pos(id),
    zone_id VARCHAR(36) REFERENCES zone(id),
    id_manager VARCHAR(36) REFERENCES utilisateur(id),
    matricule VARCHAR(50) NOT NULL UNIQUE,
    nom_complet VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telephone VARCHAR(50),
    mot_de_passe VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT 0,
    statut VARCHAR(50) NOT NULL DEFAULT 'actif',
    derniere_connexion DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE INDEX idx_utilisateur_role ON utilisateur(role_id);

-- Affectations métier explicites : plusieurs partenaires par opérationnel et
-- plusieurs opérationnels par partenaire. `utilisateur.da_id` reste uniquement
-- une colonne historique de compatibilité.
CREATE TABLE affectation_operationnel_partenaire (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    utilisateur_id VARCHAR(36) NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE ON UPDATE CASCADE,
    da_id VARCHAR(36) NOT NULL REFERENCES da(id) ON DELETE CASCADE ON UPDATE CASCADE,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    affecte_par VARCHAR(36) REFERENCES utilisateur(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (utilisateur_id, da_id)
);
CREATE INDEX idx_affectation_partenaire_statut ON affectation_operationnel_partenaire(da_id, statut);

CREATE TABLE demande_acces (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    utilisateur_id VARCHAR(36) REFERENCES utilisateur(id),
    poste_id VARCHAR(36) REFERENCES poste(id),
    role_id VARCHAR(36) NOT NULL REFERENCES role(id),
    nom_complet VARCHAR(150) NOT NULL,
    matricule VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telephone VARCHAR(50),
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    motif_refus TEXT,
    valide_par VARCHAR(36) REFERENCES utilisateur(id),
    valide_le DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE INDEX idx_demande_statut ON demande_acces(statut);
CREATE INDEX idx_demande_poste ON demande_acces(poste_id);
CREATE INDEX idx_demande_role ON demande_acces(role_id);

CREATE TABLE objectif_mensuel (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    da_id VARCHAR(36) REFERENCES da(id) ON DELETE CASCADE,
    dsm_id VARCHAR(36) REFERENCES dsm(id) ON DELETE CASCADE,
    pos_id VARCHAR(36) REFERENCES pos(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    mois INTEGER NOT NULL,
    montant_objectif DECIMAL(15,2) DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'en_cours',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE stock (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    da_id VARCHAR(36) REFERENCES da(id),
    dsm_id VARCHAR(36) REFERENCES dsm(id),
    pos_id VARCHAR(36) REFERENCES pos(id),
    utilisateur_id VARCHAR(36) REFERENCES utilisateur(id),
    date_stock DATEONLY NOT NULL,
    quantite_credit DECIMAL(15,2) DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'disponible',
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE vente_dsm_au_pos (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    dsm_id VARCHAR(36) NOT NULL REFERENCES dsm(id),
    pos_id VARCHAR(36) NOT NULL REFERENCES pos(id),
    utilisateur_id VARCHAR(36) REFERENCES utilisateur(id),
    date_vente DATEONLY NOT NULL,
    quantite_vendu INTEGER DEFAULT 0,
    montant DECIMAL(15,2) DEFAULT 0,
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

-- Table historique « acht_journaliere » : faute de frappe figée par la migration
-- 202608110010 (le modèle AchatJournaliere pointe vers ce nom de table).
CREATE TABLE acht_journaliere (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    da_id VARCHAR(36) NOT NULL REFERENCES da(id),
    dsm_id VARCHAR(36) REFERENCES dsm(id),
    scope_type VARCHAR(10) NOT NULL DEFAULT 'LEGACY',
    utilisateur_id VARCHAR(36) REFERENCES utilisateur(id),
    date_achat DATEONLY NOT NULL,
    montant_achat DECIMAL(15,2) DEFAULT 0,
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE prevision_journaliere (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    da_id VARCHAR(36) REFERENCES da(id),
    dsm_id VARCHAR(36) REFERENCES dsm(id),
    pos_id VARCHAR(36) REFERENCES pos(id),
    date_prevision DATEONLY NOT NULL,
    montant_prevision DECIMAL(15,2) NOT NULL DEFAULT 0,
    statut VARCHAR(30) NOT NULL DEFAULT 'brouillon',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE correction (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    vente_id VARCHAR(36) REFERENCES vente_dsm_au_pos(id),
    pos_id VARCHAR(36) NOT NULL REFERENCES pos(id),
    utilisateur_id VARCHAR(36) NOT NULL REFERENCES utilisateur(id),
    date_vente DATEONLY NOT NULL,
    ancienne_valeur DECIMAL(15,2) NOT NULL DEFAULT 0,
    nouvelle_valeur DECIMAL(15,2) NOT NULL DEFAULT 0,
    motif TEXT NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    valide_par VARCHAR(36) REFERENCES utilisateur(id),
    valide_le DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE audit_log (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    utilisateur_id VARCHAR(36) REFERENCES utilisateur(id),
    action VARCHAR(100) NOT NULL,
    entite VARCHAR(100),
    entite_id VARCHAR(36),
    details TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE calendrier_achat (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    da_id VARCHAR(36) REFERENCES da(id),
    dsm_id VARCHAR(36) REFERENCES dsm(id),
    pos_id VARCHAR(36) REFERENCES pos(id),
    utilisateur_id VARCHAR(36) REFERENCES utilisateur(id),
    date_prevue DATEONLY NOT NULL,
    quantite_prevue DECIMAL(15,2) DEFAULT 0,
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CHECK (
        (CASE WHEN da_id IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN dsm_id IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN pos_id IS NULL THEN 0 ELSE 1 END) = 1
    )
);

CREATE INDEX idx_da_centre ON da(centre_id);
CREATE INDEX idx_da_code_zone ON da(code_zone);
CREATE INDEX idx_dsm_da ON dsm(da_id);
CREATE UNIQUE INDEX uq_dsm_da_code ON dsm(da_id, code_dsm);
CREATE INDEX idx_dsm_code_zone ON dsm(code_zone);
CREATE INDEX idx_pos_dsm ON pos(dsm_id);
CREATE UNIQUE INDEX uq_pos_dsm_code ON pos(dsm_id, code_pos);
CREATE INDEX idx_pos_code_zone ON pos(code_zone);
CREATE INDEX idx_utilisateur_da ON utilisateur(da_id);
CREATE INDEX idx_objectif_pos ON objectif_mensuel(pos_id);
CREATE UNIQUE INDEX uq_prevision_pos_date ON prevision_journaliere(pos_id, date_prevision);
CREATE UNIQUE INDEX uq_prevision_dsm_date ON prevision_journaliere(dsm_id, date_prevision);
CREATE UNIQUE INDEX uq_prevision_da_date ON prevision_journaliere(da_id, date_prevision);
CREATE UNIQUE INDEX uq_calendrier_pos_date ON calendrier_achat(pos_id, date_prevue);
CREATE UNIQUE INDEX uq_calendrier_dsm_date ON calendrier_achat(dsm_id, date_prevue);
CREATE UNIQUE INDEX uq_calendrier_da_date ON calendrier_achat(da_id, date_prevue);
