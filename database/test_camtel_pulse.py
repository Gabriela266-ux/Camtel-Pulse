import sqlite3
from pathlib import Path

BASE = Path(__file__).resolve().parent
DB = BASE / "camtel_pulse.db"
SCHEMA = BASE / "camtel_pulse_sqlite.sql"

if DB.exists():
    DB.unlink()

conn = sqlite3.connect(DB)
conn.execute("PRAGMA foreign_keys = ON")

with open(SCHEMA, encoding="utf-8") as f:
    conn.executescript(f.read())

conn.execute("INSERT INTO ZONE VALUES (?, ?, ?)", ("Z001", "Littoral", "Littoral"))
conn.execute("INSERT INTO CENTRE VALUES (?, ?, ?)", ("C001", "Centre Douala", "Littoral"))
conn.execute("INSERT INTO ROLE VALUES (?, ?, ?)", ("R001", "Administrateur", "Gestion de la plateforme"))

conn.execute("INSERT INTO DA VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
             ("DA001","Z001","C001","DA Douala","Camtel DA","ACTIF","Douala","690000001","2026-08-11"))

conn.execute("INSERT INTO DSM VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
             ("DSM001","Z001","DA001","DSM Douala","DSM Camtel","Douala",1,"690000002","2026-08-11"))

conn.execute("INSERT INTO POS VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
             ("POS001","DSM001","Z001","POS Douala","POS Camtel","Douala",1,"690000003","2026-08-11"))

conn.execute("INSERT INTO UTILISATEUR VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
             ("USR001","R001","Z001","MAT001","Utilisateur Test","test@camtel.cm",
              "690000004","mot_de_passe_test",1,"USR001","2026-08-11","2026-08-11"))

conn.execute("INSERT INTO VENTE_DSM_AU_POS VALUES (?, ?, ?, ?, ?, ?, ?)",
             ("V001","DSM001","POS001","2026-08-11",25.0,25000.0,"2026-08-11"))

conn.execute("INSERT INTO OBJECTIF_MENSUEL VALUES (?, ?, ?, ?, ?, ?, ?)",
             ("OBJ001","POS001",None,None,"2026-08-01",500000.0,1))

conn.execute("INSERT INTO STOCK VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
             ("ST001","POS001","DA001","DSM001","2026-08-11",1000.0,1,"2026-08-11"))

conn.execute("INSERT INTO ACHAT_JOURNALIERE VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
             ("ACH001","USR001","DSM001","DA001","POS001","2026-08-11",15000.0,"2026-08-11"))

conn.commit()

tables = conn.execute("""
SELECT name FROM sqlite_master
WHERE type='table' AND name NOT LIKE 'sqlite_%'
ORDER BY name
""").fetchall()

fk_errors = conn.execute("PRAGMA foreign_key_check").fetchall()

assert len(tables) == 11, f"Nombre de tables incorrect: {len(tables)}"
assert not fk_errors, fk_errors

print("=== CAMTEL PULSE - TEST SQLITE ===")
print(f"Base créée : {DB.name}")
print(f"Nombre de tables : {len(tables)}")

for (name,) in tables:
    n = conn.execute(f"SELECT COUNT(*) FROM [{name}]").fetchone()[0]
    print(f"  ✓ {name}: {n} ligne(s)")

vente = conn.execute("""
SELECT v.ID_VENTE, d.NOM_DSM, p.NOM_POS, v.MONTANT
FROM VENTE_DSM_AU_POS v
JOIN DSM d ON d.ID_DSM=v.ID_DSM
JOIN POS p ON p.ID_POS=v.ID_POS
""").fetchone()

print("Vérification relation Vente → DSM → POS :", vente)
print("Vérification des clés étrangères : OK")
print("\nTEST GLOBAL : SUCCÈS")

conn.close()
