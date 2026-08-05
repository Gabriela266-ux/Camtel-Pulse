# TODO — Conception de la base de données Camtel-Pulse

> Projet : **Camtel-Pulse** — Suivi des objectifs commerciaux (Glotelho & Master Color)
> Centre 1 CDPSM — Camtel

## État d'avancement

- [x] Analyse intégrale des documents fournis
- [x] Validation des points ouverts avec l'utilisateur
- [x] **01. Dictionnaire des données** (`01_dictionnaire_donnees.md`)
- [x] **02. Règles de gestion** (`02_regles_gestion.md`)
- [x] **03. MCD** (`03_mcd.md`)
- [x] **04. MLD** (`04_mld.md`)
- [x] **05. MPD PostgreSQL** (`05_mpd.md`)
- [x] **06. Script SQL PostgreSQL** (`06_schema.sql`)
- [x] **07. README / synthèse** (`README.md`)
- [x] Vérification finale de la cohérence du script SQL

## Décisions validées

| Point | Décision |
|---|---|
| Modèle cible | Uni-modèle : `entites` + `saisies_journalieres` + `utilisateurs` |
| Répartition stock sécurité DSM/POS | Parts égales depuis l'objectif du client |
| Identifiant métier | Code unique auto-généré par type : `CLT-001`, `DSM-001`, `POS-001` |
| Authentification | Comptes utilisateurs avec rôles (agent / admin) |
| Nom officiel | **Camtel-Pulse** |
| Monnaie | FCFA |
