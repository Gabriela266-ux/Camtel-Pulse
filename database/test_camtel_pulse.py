import sqlite3
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent
DB = BASE / "camtel_pulse.db"
SCHEMA = BASE / "camtel_pulse_sqlite.sql"

NOW = "2026-08-24 12:00:00"
TODAY = date.today().isoformat()

if DB.exists():
    DB.unlink()

conn = sqlite3.connect(DB)
conn.execute("PRAGMA foreign_keys = ON")

with open(SCHEMA, encoding="utf-8") as f:
    conn.executescript(f.read())

def insert(table, **cols):
    cols_str = ", ".join(cols)
    marks = ", ".join("?" for _ in cols)
    conn.execute(f"INSERT INTO {table} ({cols_str}) VALUES ({marks})", list(cols.values()))

# --- Référentiels ---
insert("zone", id="Z001", nom_zone="Zone Littoral", region="Littoral", created_at=NOW, updated_at=NOW)
insert("centre", id="C001", nom_centre="Centre 1 CDPSM", region="Littoral", created_at=NOW, updated_at=NOW)
insert("role", id="R001", libelle="Admin", description="Administrateur", created_at=NOW, updated_at=NOW)

# --- Réseau ---
insert("da", id="DA001", centre_id="C001", code="DA-001", nom="Glotelho",
       objectif_mensuel=3400000, active=1, region="Littoral", numero_sim="237690000001",
       created_at=NOW, updated_at=NOW)
insert("dsm", id="DSM001", da_id="DA001", zone_id="Z001", nom="DSM Glotelho 1",
       raison_sociale="Glotelho SARL", adresse="Douala", contact="+237690000010",
       statut="actif", date_adhesion=TODAY, created_at=NOW, updated_at=NOW)
insert("pos", id="POS001", dsm_id="DSM001", zone_id="Z001", nom="POS Glotelho 1A",
       raison_sociale="Point Glotelho 1A", adresse="Douala", contact="+237690000014",
       statut="actif", date_adhesion=TODAY, created_at=NOW, updated_at=NOW)

# --- Utilisateur ---
insert("utilisateur", id="USR001", role_id="R001", da_id=None, dsm_id=None, pos_id=None,
       zone_id="Z001", id_manager=None, matricule="ADM-001", nom_complet="Admin Principal",
       email="admin@camtel.local", telephone="690000001", mot_de_passe="hash_bcrypt_test",
       statut="actif", derniere_connexion=None, created_at=NOW, updated_at=NOW)

# --- Données métier ---
annee, mois = TODAY[:4], int(TODAY[5:7])
insert("vente_dsm_au_pos", id="V001", dsm_id="DSM001", pos_id="POS001", utilisateur_id="USR001",
       date_vente=TODAY, quantite_vendu=25, montant=25000.0, date_saisir=NOW,
       created_at=NOW, updated_at=NOW)
insert("objectif_mensuel", id="OBJ001", da_id=None, dsm_id=None, pos_id="POS001",
       annee=int(annee), mois=mois, montant_objectif=600000.0, statut="en_cours",
       created_at=NOW, updated_at=NOW)
insert("stock", id="ST001", dsm_id="DSM001", pos_id="POS001", utilisateur_id="USR001",
       date_stock=TODAY, quantite_credit=1000.0, statut="disponible", date_saisir=NOW,
       created_at=NOW, updated_at=NOW)
insert("acht_journaliere", id="ACH001", da_id="DA001", utilisateur_id="USR001",
       date_achat=TODAY, montant_achat=15000.0, date_saisir=NOW, created_at=NOW, updated_at=NOW)
insert("prevision_journaliere", id="PRE001", da_id=None, dsm_id=None, pos_id="POS001",
       date_prevision=TODAY, montant_prevision=20000.0, statut="brouillon",
       created_at=NOW, updated_at=NOW)
insert("correction", id="COR001", vente_id="V001", pos_id="POS001", utilisateur_id="USR001",
       date_vente=TODAY, ancienne_valeur=25000.0, nouvelle_valeur=27000.0,
       motif="Erreur de saisie", statut="en_attente", valide_par=None, valide_le=None,
       created_at=NOW, updated_at=NOW)
insert("audit_log", id="AUD001", utilisateur_id="USR001", action="saisie_creee",
       entite="pos", entite_id="POS001", details='{"vente_jour": 15000}',
       created_at=NOW, updated_at=NOW)
insert("calendrier_achat", id="CAL001", dsm_id="DSM001", pos_id="POS001", utilisateur_id="USR001",
       date_prevue=TODAY, quantite_prevue=22000.0, date_saisir=NOW, created_at=NOW, updated_at=NOW)

conn.commit()

tables = conn.execute("""
SELECT name FROM sqlite_master
WHERE type='table' AND name NOT LIKE 'sqlite_%'
ORDER BY name
""").fetchall()

fk_errors = conn.execute("PRAGMA foreign_key_check").fetchall()

assert len(tables) == 15, f"Nombre de tables incorrect: {len(tables)}"
assert not fk_errors, fk_errors

print("=== CAMTEL PULSE - TEST SQLITE ===")
print(f"Base créée : {DB.name}")
print(f"Nombre de tables : {len(tables)}")

for (name,) in tables:
    n = conn.execute(f"SELECT COUNT(*) FROM [{name}]").fetchone()[0]
    print(f"  OK {name}: {n} ligne(s)")

vente = conn.execute("""
SELECT v.id, d.nom, p.nom, v.montant
FROM vente_dsm_au_pos v
JOIN dsm d ON d.id=v.dsm_id
JOIN pos p ON p.id=v.pos_id
""").fetchone()

corrections_ouvertes = conn.execute(
    "SELECT COUNT(*) FROM correction WHERE statut NOT IN ('validee','refusee')"
).fetchone()[0]

print("Vérification relation Vente -> DSM -> POS :", vente)
print("Corrections ouvertes (champ 'corrections' du dashboard) :", corrections_ouvertes)
print("Vérification des clés étrangères : OK")
print("\nTEST GLOBAL : SUCCÈS")

conn.close()