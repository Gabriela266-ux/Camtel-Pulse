# CAMTEL PULSE - SQLite

La version applicative actuelle utilise SQLite. Le schéma de référence contient
17 tables et ne crée aucun Partenaire, DSM, POS ou utilisateur factice.

## Fichiers

- `camtel_pulse_sqlite.sql` : création complète du schéma SQLite aligné sur les migrations backend.
- `test_camtel_pulse.py` : test de création, insertion et contraintes.
- `camtel_pulse.db` : base SQLite de validation générée par le test (distincte de `backend/camtel_pulse.db`).
- `06_schema.sql` : ancien prototype PostgreSQL conservé uniquement comme archive documentaire ; il n'est pas utilisé par l'application.

## Lancer

```bash
python test_camtel_pulse.py
```

Le test doit afficher `TEST GLOBAL : SUCCÈS`.

Pour mettre à jour la base réellement utilisée par l'application, exécuter les
migrations depuis le dossier `backend`. Ne pas importer automatiquement les
lignes du fichier Excel métier : ce fichier sert de référence de structure.
