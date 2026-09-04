# Financial Pulse — lancement local complet

Cette branche contient les trois parties nécessaires au projet :

- `frontend` : application React/TypeScript ;
- `backend` : API Node.js/Express ;
- `database` : documentation, schémas SQL et modèle de données.

La base exécutée par l'application est une base SQLite locale. La branche
contient une base de démonstration historique pour faciliter le démarrage, puis
le lanceur lui applique automatiquement toutes les migrations récentes. La base
active de la machine de développement, les fichiers `.env` et `node_modules`
ne sont jamais copiés : les comptes et données d'activité réels restent privés.

## Prérequis

- Node.js LTS ;
- npm, installé avec Node.js ;
- un navigateur récent.

VS Code, Git, MySQL et PostgreSQL ne sont pas nécessaires pour exécuter une
copie déjà téléchargée du projet.

## Premier lancement sous Windows

Le plus simple est d'exécuter :

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

Le script installe ce qui manque, prépare SQLite, lance les deux serveurs en
arrière-plan et ouvre l'application. Pour un lancement manuel :

Depuis PowerShell, à la racine du projet :

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run db:migrate
npm run db:seed

cd ..\frontend
npm install
npm run dev
```

Dans une seconde fenêtre PowerShell :

```powershell
cd backend
npm run dev
```

Ouvrir ensuite `http://localhost:5173`.

Après le premier lancement, exécuter uniquement `npm run db:migrate` après un
pull. Ne pas relancer `npm run db:seed` sur une base qui contient déjà des
données.
