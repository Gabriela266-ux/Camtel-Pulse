-- =====================================================================
-- Camtel Pulse — Schéma MySQL aligné sur l'implémentation réelle
-- (backend/migrations/*) : 15 tables.
-- =====================================================================
DROP DATABASE IF EXISTS Camtel_pulse;
CREATE DATABASE IF NOT EXISTS Camtel_pulse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Camtel_pulse;

CREATE TABLE zone (
    id VARCHAR(36) PRIMARY KEY,
    nom_zone VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE role (
    id VARCHAR(36) PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE centre (
    id VARCHAR(36) PRIMARY KEY,
    nom_centre VARCHAR(150) NOT NULL,
    region VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE da (
    id VARCHAR(36) PRIMARY KEY,
    centre_id VARCHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(150) NOT NULL,
    objectif_mensuel DECIMAL(15,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    region VARCHAR(100),
    numero_sim VARCHAR(50) UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centre_id) REFERENCES centre(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dsm (
    id VARCHAR(36) PRIMARY KEY,
    da_id VARCHAR(36) NOT NULL,
    zone_id VARCHAR(36),
    nom VARCHAR(150) NOT NULL,
    raison_sociale VARCHAR(150),
    adresse VARCHAR(255),
    contact VARCHAR(50),
    statut VARCHAR(50) NOT NULL DEFAULT 'actif',
    date_adhesion DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (da_id) REFERENCES da(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zone(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pos (
    id VARCHAR(36) PRIMARY KEY,
    dsm_id VARCHAR(36) NOT NULL,
    zone_id VARCHAR(36),
    nom VARCHAR(150) NOT NULL,
    raison_sociale VARCHAR(150),
    adresse VARCHAR(255),
    contact VARCHAR(50),
    statut VARCHAR(50) NOT NULL DEFAULT 'actif',
    date_adhesion DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dsm_id) REFERENCES dsm(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zone(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE poste (
    id VARCHAR(36) PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    role_id VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id)
) ENGINE=InnoDB;

CREATE TABLE utilisateur (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL,
    poste_id VARCHAR(36),
    da_id VARCHAR(36),
    dsm_id VARCHAR(36),
    pos_id VARCHAR(36),
    zone_id VARCHAR(36),
    id_manager VARCHAR(36),
    matricule VARCHAR(50) NOT NULL UNIQUE,
    nom_complet VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telephone VARCHAR(50),
    mot_de_passe VARCHAR(255) NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'actif',
    derniere_connexion DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (poste_id) REFERENCES poste(id),
    FOREIGN KEY (da_id) REFERENCES da(id),
    FOREIGN KEY (dsm_id) REFERENCES dsm(id),
    FOREIGN KEY (pos_id) REFERENCES pos(id),
    FOREIGN KEY (zone_id) REFERENCES zone(id),
    FOREIGN KEY (id_manager) REFERENCES utilisateur(id)
) ENGINE=InnoDB;

CREATE TABLE demande_acces (
    id VARCHAR(36) PRIMARY KEY,
    utilisateur_id VARCHAR(36) NOT NULL,
    poste_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    nom_complet VARCHAR(150) NOT NULL,
    matricule VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telephone VARCHAR(50),
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    motif_refus TEXT,
    valide_par VARCHAR(36),
    valide_le DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
    FOREIGN KEY (poste_id) REFERENCES poste(id),
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (valide_par) REFERENCES utilisateur(id)
) ENGINE=InnoDB;

CREATE TABLE objectif_mensuel (
    id VARCHAR(36) PRIMARY KEY,
    da_id VARCHAR(36),
    dsm_id VARCHAR(36),
    pos_id VARCHAR(36),
    annee INT NOT NULL,
    mois INT NOT NULL,
    montant_objectif DECIMAL(15,2) DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'en_cours',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (da_id) REFERENCES da(id) ON DELETE CASCADE,
    FOREIGN KEY (dsm_id) REFERENCES dsm(id) ON DELETE CASCADE,
    FOREIGN KEY (pos_id) REFERENCES pos(id) ON DELETE CASCADE
CREATE TABLE stock (
    id VARCHAR(36) PRIMARY KEY,
    dsm_id VARCHAR(36),
    pos_id VARCHAR(36),
    utilisateur_id VARCHAR(36),
    date_stock DATE NOT NULL,
    quantite_credit DECIMAL(15,2) DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'disponible',
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (dsm_id) REFERENCES dsm(id),
    FOREIGN KEY (pos_id) REFERENCES pos(id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
) ENGINE=InnoDB;

CREATE TABLE vente_dsm_au_pos (
    id VARCHAR(36) PRIMARY KEY,
    dsm_id VARCHAR(36) NOT NULL,
    pos_id VARCHAR(36) NOT NULL,
    utilisateur_id VARCHAR(36),
    date_vente DATE NOT NULL,
    quantite_vendu INT DEFAULT 0,
    montant DECIMAL(15,2) DEFAULT 0,
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (dsm_id) REFERENCES dsm(id),
    FOREIGN KEY (pos_id) REFERENCES pos(id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
) ENGINE=InnoDB;

-- Faute de frappe figée par la migration 202608110010 (modèle AchatJournaliere).
CREATE TABLE acht_journaliere (
    id VARCHAR(36) PRIMARY KEY,
    da_id VARCHAR(36) NOT NULL,
    utilisateur_id VARCHAR(36),
    date_achat DATE NOT NULL,
    montant_achat DECIMAL(15,2) DEFAULT 0,
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (da_id) REFERENCES da(id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
) ENGINE=InnoDB;
) ENGINE=InnoDB;
CREATE TABLE prevision_journaliere (
    id VARCHAR(36) PRIMARY KEY,
    da_id VARCHAR(36),
    dsm_id VARCHAR(36),
    pos_id VARCHAR(36),
    date_prevision DATE NOT NULL,
    montant_prevision DECIMAL(15,2) NOT NULL DEFAULT 0,
    statut VARCHAR(30) NOT NULL DEFAULT 'brouillon',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uq_prevision_pos_date (pos_id, date_prevision),
    FOREIGN KEY (da_id) REFERENCES da(id),
    FOREIGN KEY (dsm_id) REFERENCES dsm(id),
    FOREIGN KEY (pos_id) REFERENCES pos(id)
) ENGINE=InnoDB;

CREATE TABLE correction (
    id VARCHAR(36) PRIMARY KEY,
    vente_id VARCHAR(36),
    pos_id VARCHAR(36) NOT NULL,
    utilisateur_id VARCHAR(36) NOT NULL,
    date_vente DATE NOT NULL,
    ancienne_valeur DECIMAL(15,2) NOT NULL DEFAULT 0,
    nouvelle_valeur DECIMAL(15,2) NOT NULL DEFAULT 0,
    motif TEXT NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    valide_par VARCHAR(36),
    valide_le DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (vente_id) REFERENCES vente_dsm_au_pos(id),
    FOREIGN KEY (pos_id) REFERENCES pos(id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
    FOREIGN KEY (valide_par) REFERENCES utilisateur(id)
) ENGINE=InnoDB;

CREATE TABLE audit_log (
    id VARCHAR(36) PRIMARY KEY,
    utilisateur_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entite VARCHAR(100),
    entite_id VARCHAR(36),
    details TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
) ENGINE=InnoDB;

CREATE TABLE calendrier_achat (
    id VARCHAR(36) PRIMARY KEY,
    dsm_id VARCHAR(36),
    pos_id VARCHAR(36) NOT NULL,
    utilisateur_id VARCHAR(36),
    date_prevue DATE NOT NULL,
    quantite_prevue DECIMAL(15,2) DEFAULT 0,
    date_saisir DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uq_calendrier_pos_date (pos_id, date_prevue),
    FOREIGN KEY (dsm_id) REFERENCES dsm(id),
    FOREIGN KEY (pos_id) REFERENCES pos(id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
) ENGINE=InnoDB;