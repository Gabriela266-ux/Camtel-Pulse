DROP DATABASE IF EXISTS Camtel_pulse;

CREATE DATABASE IF NOT EXISTS Camtel_pulse;
USE Camtel_pulse;
# -----------------------------------------------------------------------------
#       TABLE : UTILISATEUR
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS UTILISATEUR
 (
   ID_UTILISATEUR VARCHAR(10) NOT NULL  ,
   ID_ROLE VARCHAR(10) NOT NULL  ,
   ID_ZONE VARCHAR(10) NOT NULL  ,
   MATRICULE VARCHAR(10) NOT NULL  ,
   NOM_COMPLET CHAR(32) NOT NULL  ,
   EMAIL VARCHAR(32) NOT NULL  ,
   T�L�PHONE BIGINT(9) NOT NULL  ,
   MOT_DE_PASSE VARCHAR(32) NOT NULL  ,
   STATUT BOOL NOT NULL  ,
   ID_MANAGER VARCHAR(32) NOT NULL  ,
   DATE_CONNEXION DATE NOT NULL  ,
   DERNIERE_CONNEXION DATE NOT NULL  
   , PRIMARY KEY (ID_UTILISATEUR) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE UTILISATEUR
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_UTILISATEUR_ROLE
     ON UTILISATEUR (ID_ROLE ASC);

CREATE  INDEX I_FK_UTILISATEUR_ZONE
     ON UTILISATEUR (ID_ZONE ASC);

# -----------------------------------------------------------------------------
#       TABLE : POS
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS POS
 (
   ID_POS VARCHAR(10) NOT NULL  ,
   ID_DSM VARCHAR(10) NOT NULL  ,
   ID_ZONE VARCHAR(10) NOT NULL  ,
   NOM_POS CHAR(32) NOT NULL  ,
   RAISON_SOCIALE CHAR(32) NOT NULL  ,
   ADRESSE VARCHAR(10) NOT NULL  ,
   STATUT BOOL NOT NULL  ,
   CONTACT BIGINT(9) NOT NULL  ,
   DATE_ADH�SION DATE NOT NULL  
   , PRIMARY KEY (ID_POS) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE POS
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_POS_DSM
     ON POS (ID_DSM ASC);

CREATE  INDEX I_FK_POS_ZONE
     ON POS (ID_ZONE ASC);

# -----------------------------------------------------------------------------
#       TABLE : ZONE
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ZONE
 (
   ID_ZONE VARCHAR(10) NOT NULL  ,
   NOM_ZONE VARCHAR(32) NOT NULL  ,
   REGION VARCHAR(10) NOT NULL  
   , PRIMARY KEY (ID_ZONE) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       TABLE : VENTE_DSM_AU_POS
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS VENTE_DSM_AU_POS
 (
   ID_VENTE VARCHAR(10) NOT NULL  ,
   ID_DSM VARCHAR(10) NOT NULL  ,
   ID_POS VARCHAR(10) NOT NULL  ,
   DATE_VENTE DATE NOT NULL  ,
   QUANTIT�_VENDU REAL(5,2) NOT NULL  ,
   MONTANT REAL(12,2) NOT NULL  ,
   DATE_SAISIE DATE NOT NULL  
   , PRIMARY KEY (ID_VENTE) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE VENTE_DSM_AU_POS
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_VENTE_DSM_AU_POS_DSM
     ON VENTE_DSM_AU_POS (ID_DSM ASC);

CREATE  INDEX I_FK_VENTE_DSM_AU_POS_POS
     ON VENTE_DSM_AU_POS (ID_POS ASC);

# -----------------------------------------------------------------------------
#       TABLE : OBJECTIF_MENSUEL
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS OBJECTIF_MENSUEL
 (
   ID_OBJECTIF VARCHAR(10) NOT NULL  ,
   ID_POS VARCHAR(10) NULL  ,
   ID_DA VARCHAR(10) NULL  ,
   ID_DSM VARCHAR(10) NULL  ,
   MOI_ANN�E DATE NOT NULL  ,
   MONTANT_OBJECTIF REAL(12,2) NOT NULL  ,
   STATUT BOOL NOT NULL  
   , PRIMARY KEY (ID_OBJECTIF) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE OBJECTIF_MENSUEL
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_OBJECTIF_MENSUEL_POS
     ON OBJECTIF_MENSUEL (ID_POS ASC);

CREATE  INDEX I_FK_OBJECTIF_MENSUEL_DA
     ON OBJECTIF_MENSUEL (ID_DA ASC);

CREATE  INDEX I_FK_OBJECTIF_MENSUEL_DSM
     ON OBJECTIF_MENSUEL (ID_DSM ASC);

# -----------------------------------------------------------------------------
#       TABLE : CENTRE
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS CENTRE
 (
   ID_CENTRE VARCHAR(10) NOT NULL  ,
   NOM_CENTRE CHAR(32) NOT NULL  ,
   REGION CHAR(32) NOT NULL  
   , PRIMARY KEY (ID_CENTRE) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       TABLE : STOCK
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS STOCK
 (
   ID_STOCK VARCHAR(10) NOT NULL  ,
   ID_POS VARCHAR(10) NOT NULL  ,
   ID_DA VARCHAR(10) NOT NULL  ,
   ID_DSM VARCHAR(10) NOT NULL  ,
   DATE_STOCK DATE NOT NULL  ,
   QUANTIT�_CR�DIT REAL(12,2) NOT NULL  ,
   STATUT BOOL NOT NULL  ,
   DATE_SAISIR DATE NOT NULL  
   , PRIMARY KEY (ID_STOCK) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE STOCK
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_STOCK_POS
     ON STOCK (ID_POS ASC);

CREATE  INDEX I_FK_STOCK_DA
     ON STOCK (ID_DA ASC);

CREATE  INDEX I_FK_STOCK_DSM
     ON STOCK (ID_DSM ASC);

# -----------------------------------------------------------------------------
#       TABLE : ACHAT_JOURNALIERE
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ACHAT_JOURNALIERE
 (
   ID_ACHAT VARCHAR(10) NOT NULL  ,
   ID_UTILISATEUR VARCHAR(10) NOT NULL  ,
   ID_DSM VARCHAR(10) NULL  ,
   ID_DA VARCHAR(10) NULL  ,
   ID_POS VARCHAR(10) NULL  ,
   DATE_ACHAT DATE NOT NULL  ,
   MONTANT_ACHAT REAL(12,2) NOT NULL  ,
   DATE_SAISIE DATE NOT NULL  
   , PRIMARY KEY (ID_ACHAT) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE ACHAT_JOURNALIERE
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_ACHAT_JOURNALIERE_UTILISATEUR
     ON ACHAT_JOURNALIERE (ID_UTILISATEUR ASC);

CREATE  INDEX I_FK_ACHAT_JOURNALIERE_DSM
     ON ACHAT_JOURNALIERE (ID_DSM ASC);

CREATE  INDEX I_FK_ACHAT_JOURNALIERE_DA
     ON ACHAT_JOURNALIERE (ID_DA ASC);

CREATE  INDEX I_FK_ACHAT_JOURNALIERE_POS
     ON ACHAT_JOURNALIERE (ID_POS ASC);

# -----------------------------------------------------------------------------
#       TABLE : ROLE
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ROLE
 (
   ID_ROLE VARCHAR(10) NOT NULL  ,
   LIBELL� CHAR(50) NOT NULL  ,
   DESCRIPTION CHAR(128) NOT NULL  
   , PRIMARY KEY (ID_ROLE) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       TABLE : DSM
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS DSM
 (
   ID_DSM VARCHAR(10) NOT NULL  ,
   ID_ZONE VARCHAR(10) NOT NULL  ,
   ID_DA VARCHAR(10) NOT NULL  ,
   NOM_DSM CHAR(32) NOT NULL  ,
   RAISON_SOCIALE CHAR(32) NOT NULL  ,
   ADRESSE VARCHAR(32) NOT NULL  ,
   STATUT BOOL NOT NULL  ,
   CONTACT BIGINT(9) NOT NULL  ,
   DATE_ADH�SION DATE NOT NULL  
   , PRIMARY KEY (ID_DSM) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE DSM
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_DSM_ZONE
     ON DSM (ID_ZONE ASC);

CREATE  INDEX I_FK_DSM_DA
     ON DSM (ID_DA ASC);

# -----------------------------------------------------------------------------
#       TABLE : DA
# -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS DA
 (
   ID_DA VARCHAR(10) NOT NULL  ,
   ID_ZONE VARCHAR(10) NOT NULL  ,
   ID_CENTRE VARCHAR(10) NOT NULL  ,
   NOM_DA CHAR(32) NOT NULL  ,
   RAISON_SOCIALE CHAR(100) NOT NULL  ,
   STATUT CHAR(10) NOT NULL  ,
   ADRESSE VARCHAR(128) NOT NULL  ,
   CONTACT INTEGER(9) NOT NULL  ,
   DATA_ADH�SION DATE NOT NULL  
   , PRIMARY KEY (ID_DA) 
 ) 
 comment = "";

# -----------------------------------------------------------------------------
#       INDEX DE LA TABLE DA
# -----------------------------------------------------------------------------


CREATE  INDEX I_FK_DA_ZONE
     ON DA (ID_ZONE ASC);

CREATE  INDEX I_FK_DA_CENTRE
     ON DA (ID_CENTRE ASC);


# -----------------------------------------------------------------------------
#       CREATION DES REFERENCES DE TABLE
# -----------------------------------------------------------------------------


ALTER TABLE UTILISATEUR 
  ADD FOREIGN KEY FK_UTILISATEUR_ROLE (ID_ROLE)
      REFERENCES ROLE (ID_ROLE) ;


ALTER TABLE UTILISATEUR 
  ADD FOREIGN KEY FK_UTILISATEUR_ZONE (ID_ZONE)
      REFERENCES ZONE (ID_ZONE) ;


ALTER TABLE POS 
  ADD FOREIGN KEY FK_POS_DSM (ID_DSM)
      REFERENCES DSM (ID_DSM) ;


ALTER TABLE POS 
  ADD FOREIGN KEY FK_POS_ZONE (ID_ZONE)
      REFERENCES ZONE (ID_ZONE) ;


ALTER TABLE VENTE_DSM_AU_POS 
  ADD FOREIGN KEY FK_VENTE_DSM_AU_POS_DSM (ID_DSM)
      REFERENCES DSM (ID_DSM) ;


ALTER TABLE VENTE_DSM_AU_POS 
  ADD FOREIGN KEY FK_VENTE_DSM_AU_POS_POS (ID_POS)
      REFERENCES POS (ID_POS) ;


ALTER TABLE OBJECTIF_MENSUEL 
  ADD FOREIGN KEY FK_OBJECTIF_MENSUEL_POS (ID_POS)
      REFERENCES POS (ID_POS) ;


ALTER TABLE OBJECTIF_MENSUEL 
  ADD FOREIGN KEY FK_OBJECTIF_MENSUEL_DA (ID_DA)
      REFERENCES DA (ID_DA) ;


ALTER TABLE OBJECTIF_MENSUEL 
  ADD FOREIGN KEY FK_OBJECTIF_MENSUEL_DSM (ID_DSM)
      REFERENCES DSM (ID_DSM) ;


ALTER TABLE STOCK 
  ADD FOREIGN KEY FK_STOCK_POS (ID_POS)
      REFERENCES POS (ID_POS) ;


ALTER TABLE STOCK 
  ADD FOREIGN KEY FK_STOCK_DA (ID_DA)
      REFERENCES DA (ID_DA) ;


ALTER TABLE STOCK 
  ADD FOREIGN KEY FK_STOCK_DSM (ID_DSM)
      REFERENCES DSM (ID_DSM) ;


ALTER TABLE ACHAT_JOURNALIERE 
  ADD FOREIGN KEY FK_ACHAT_JOURNALIERE_UTILISATEUR (ID_UTILISATEUR)
      REFERENCES UTILISATEUR (ID_UTILISATEUR) ;


ALTER TABLE ACHAT_JOURNALIERE 
  ADD FOREIGN KEY FK_ACHAT_JOURNALIERE_DSM (ID_DSM)
      REFERENCES DSM (ID_DSM) ;


ALTER TABLE ACHAT_JOURNALIERE 
  ADD FOREIGN KEY FK_ACHAT_JOURNALIERE_DA (ID_DA)
      REFERENCES DA (ID_DA) ;


ALTER TABLE ACHAT_JOURNALIERE 
  ADD FOREIGN KEY FK_ACHAT_JOURNALIERE_POS (ID_POS)
      REFERENCES POS (ID_POS) ;


ALTER TABLE DSM 
  ADD FOREIGN KEY FK_DSM_ZONE (ID_ZONE)
      REFERENCES ZONE (ID_ZONE) ;


ALTER TABLE DSM 
  ADD FOREIGN KEY FK_DSM_DA (ID_DA)
      REFERENCES DA (ID_DA) ;


ALTER TABLE DA 
  ADD FOREIGN KEY FK_DA_ZONE (ID_ZONE)
      REFERENCES ZONE (ID_ZONE) ;


ALTER TABLE DA 
  ADD FOREIGN KEY FK_DA_CENTRE (ID_CENTRE)
      REFERENCES CENTRE (ID_CENTRE) ;

