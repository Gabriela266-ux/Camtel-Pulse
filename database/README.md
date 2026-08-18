**Camtel Pulse — Aperçu**
- **Description:** Interface Flask minimale pour explorer une base SQLite contenant les données commerciales (zones, centres, DSM, POS, ventes, stocks, objectifs, utilisateurs).
- **But:** Permet de lister les tables et d'afficher le contenu d'une table via une interface web simple.

**Pré-requis**
- **Python:** 3.8+
- **Packages:** `Flask` (installer via `pip install flask`). SQLite est fourni avec Python.

**Installation rapide**
- Créer un environnement virtuel et installer Flask:

```bash
python -m venv venv
venv\Scripts\activate
pip install flask
```

**Initialiser la base de données**
- Le schéma SQLite est fourni dans le fichier [camtel_pulse_sqlite.sql](camtel_pulse_sqlite.sql). Un petit script de test qui crée `camtel_pulse.db` et insère des données d'exemple est disponible: [test_camtel_pulse.py](test_camtel_pulse.py).

Pour créer la base et peupler des données d'exemple, exécutez:

```bash
python test_camtel_pulse.py
```

Après exécution, le fichier de base `camtel_pulse.db` sera créé à la racine du projet.

**Exécution de l'application**
- L'application Flask se trouve dans [Camtel_pulse.py](Camtel_pulse.py). Lancez-la ainsi:

```bash
python Camtel_pulse.py
```

Puis ouvrez `http://127.0.0.1:5000/` dans votre navigateur.

**Fichiers importants**
- [Camtel_pulse.py](Camtel_pulse.py): application Flask principale.
- [camtel_pulse_sqlite.sql](camtel_pulse_sqlite.sql): schéma SQLite.
- [Camtel_pulse.SQL](Camtel_pulse.SQL): schéma/DDL orienté MySQL/MariaDB.
- [test_camtel_pulse.py](test_camtel_pulse.py): script de génération de la base et tests basiques.

**Templates attendus**
- L'application utilise `render_template` pour `index.html` et `table.html`. Placez des fichiers HTML dans un dossier `templates/` (ex: `templates/index.html`, `templates/table.html`).

Exemples minimaux (à créer si absent) :

`templates/index.html` — lister les tables.

`templates/table.html` — afficher les colonnes et les lignes d'une table.

**Tests**
- Le script `test_camtel_pulse.py` vérifie la création du schéma, l'insertion d'exemples et l'intégrité des clés étrangères. Lancez-le avec:

```bash
python test_camtel_pulse.py
```

**Notes & améliorations possibles**
- Ajouter un `requirements.txt` pour figer les dépendances.
- Fournir des templates HTML plus complets et des routes d'API JSON.
- Ajouter gestion d'erreurs, pagination et authentification.

Si vous voulez, je peux générer des templates `index.html` et `table.html` minimaux et ajouter un `requirements.txt`.

**Tables et attributs (extrait du schéma SQLite)**

- `ZONE`
	- `ID_ZONE` TEXT PRIMARY KEY
	- `NOM_ZONE` TEXT
	- `REGION` TEXT

- `CENTRE`
	- `ID_CENTRE` TEXT PRIMARY KEY
	- `NOM_CENTRE` TEXT
	- `REGION` TEXT

- `ROLE`
	- `ID_ROLE` TEXT PRIMARY KEY
	- `LIBELLE` TEXT
	- `DESCRIPTION` TEXT

- `DA`
	- `ID_DA` TEXT PRIMARY KEY
	- `ID_ZONE` TEXT (FK → `ZONE`)
	- `ID_CENTRE` TEXT (FK → `CENTRE`)
	- `NOM_DA` TEXT
	- `RAISON_SOCIALE` TEXT
	- `STATUT` TEXT
	- `ADRESSE` TEXT
	- `CONTACT` TEXT
	- `DATE_ADHESION` TEXT

- `DSM`
	- `ID_DSM` TEXT PRIMARY KEY
	- `ID_ZONE` TEXT (FK → `ZONE`)
	- `ID_DA` TEXT (FK → `DA`)
	- `NOM_DSM` TEXT
	- `RAISON_SOCIALE` TEXT
	- `ADRESSE` TEXT
	- `STATUT` INTEGER (0/1)
	- `CONTACT` TEXT
	- `DATE_ADHESION` TEXT

- `POS`
	- `ID_POS` TEXT PRIMARY KEY
	- `ID_DSM` TEXT (FK → `DSM`)
	- `ID_ZONE` TEXT (FK → `ZONE`)
	- `NOM_POS` TEXT
	- `RAISON_SOCIALE` TEXT
	- `ADRESSE` TEXT
	- `STATUT` INTEGER (0/1)
	- `CONTACT` TEXT
	- `DATE_ADHESION` TEXT

- `UTILISATEUR`
	- `ID_UTILISATEUR` TEXT PRIMARY KEY
	- `ID_ROLE` TEXT (FK → `ROLE`)
	- `ID_ZONE` TEXT (FK → `ZONE`)
	- `MATRICULE` TEXT
	- `NOM_COMPLET` TEXT
	- `EMAIL` TEXT
	- `TELEPHONE` TEXT
	- `MOT_DE_PASSE` TEXT
	- `STATUT` INTEGER (0/1)
	- `ID_MANAGER` TEXT (FK → `UTILISATEUR`)
	- `DATE_CONNEXION` TEXT
	- `DERNIERE_CONNEXION` TEXT

- `VENTE_DSM_AU_POS`
	- `ID_VENTE` TEXT PRIMARY KEY
	- `ID_DSM` TEXT (FK → `DSM`)
	- `ID_POS` TEXT (FK → `POS`)
	- `DATE_VENTE` TEXT
	- `QUANTITE_VENDU` REAL
	- `MONTANT` REAL
	- `DATE_SAISIE` TEXT

- `OBJECTIF_MENSUEL`
	- `ID_OBJECTIF` TEXT PRIMARY KEY
	- `ID_POS` TEXT (FK → `POS`, NULLABLE)
	- `ID_DA` TEXT (FK → `DA`, NULLABLE)
	- `ID_DSM` TEXT (FK → `DSM`, NULLABLE)
	- `MOIS_ANNEE` TEXT
	- `MONTANT_OBJECTIF` REAL
	- `STATUT` INTEGER (0/1)

- `STOCK`
	- `ID_STOCK` TEXT PRIMARY KEY
	- `ID_POS` TEXT (FK → `POS`)
	- `ID_DA` TEXT (FK → `DA`)
	- `ID_DSM` TEXT (FK → `DSM`)
	- `DATE_STOCK` TEXT
	- `QUANTITE_CREDIT` REAL
	- `STATUT` INTEGER (0/1)
	- `DATE_SAISIR` TEXT

- `ACHAT_JOURNALIERE`
	- `ID_ACHAT` TEXT PRIMARY KEY
	- `ID_UTILISATEUR` TEXT (FK → `UTILISATEUR`)
	- `ID_DSM` TEXT (FK → `DSM`)
	- `ID_DA` TEXT (FK → `DA`)
	- `ID_POS` TEXT (FK → `POS`)
	- `DATE_ACHAT` TEXT
	- `MONTANT_ACHAT` REAL
	- `DATE_SAISIE` TEXT

**Exécution en ligne / hébergement**

Oui — avec les templates fournis l'application peut fonctionner sur un hébergeur web qui supporte les applications Python/Flask. Points importants :


```bash
pip install -r requirements.txt gunicorn
gunicorn --bind 0.0.0.0:$PORT Camtel_pulse:app
```


**API (endpoints utiles pour un frontend / intégration backend)**

L'application expose des routes HTML par défaut. Pour une intégration programmatique (frontend JS, mobile ou autres services), vous pouvez utiliser ces endpoints JSON proposés :

- `GET /api/tables`
	- Description : liste les tables disponibles.
	- Réponse (200) : JSON { "tables": ["ZONE","CENTRE", ...] }

- `GET /api/table/<table_name>`
	- Description : récupère les lignes d'une table.
	- Query params facultatifs : `limit` (int), `offset` (int)
	- Réponse (200) : JSON { "table": "ZONE", "columns": ["ID_ZONE","NOM_ZONE",...], "rows": [ {"ID_ZONE":"Z001","NOM_ZONE":"Littoral",...}, ... ] }
	- Erreurs : 404 si la table n'existe pas.

- `GET /api/table/<table_name>/count`
	- Description : renvoie le nombre de lignes (utile pour pagination).
	- Réponse (200) : JSON { "table": "ZONE", "count": 42 }

Notes d'implémentation et bonnes pratiques :
- Content-Type : `application/json` pour ces endpoints.
- CORS : si votre frontend est servi depuis un autre domaine, activez CORS (`flask-cors`) ou configurez les en-têtes.
- Sécurité : ces endpoints sont publics par défaut — ajoutez authentification (token, sessions) si les données sont sensibles.
- Pagination : utilisez `limit`/`offset` pour éviter de renvoyer trop de lignes.
- Préférez les requêtes préparées et l'escape des noms de table/colonnes pour éviter les injections SQL. Limitez les tables accessibles si nécessaire.

Exemple minimal côté client (fetch) :

```js
// lister les tables
fetch('/api/tables').then(r=>r.json()).then(console.log)

// récupérer 10 lignes de ZONE
fetch('/api/table/ZONE?limit=10').then(r=>r.json()).then(data=>{
	console.log(data.columns, data.rows)
})
```

Si vous souhaitez, je peux :
- ajouter ces endpoints JSON directement dans `Camtel_pulse.py`,
- ou fournir une version séparée `api.py` avec routes JSON et laisser les templates pour l'interface.


Si vous voulez, je peux :
- préparer un `Procfile`/fichier de déploiement pour un service (ex. Heroku/Render)
- convertir la configuration pour utiliser une variable d'environnement `DATABASE_URL` et un pilote `psycopg2` pour PostgreSQL.

