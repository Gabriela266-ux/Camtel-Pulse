# Setup MySQL local - Camtel Pulse

## 1) Vérifier MySQL

Assurez-vous que MySQL 8 est installé et démarré localement.

## 2) Configurer l’environnement

Le fichier .env est déjà prêt dans le projet.

Variables importantes :
- DB_HOST=127.0.0.1
- DB_PORT=3306
- DB_NAME=camtel_pulse
- DB_USER=root
- DB_PASSWORD=

## 3) Créer la base et exécuter les migrations

PowerShell :

```powershell
Set-Location 'e:\CAMTEL PULSE\backend'
node .\node_modules\sequelize-cli\lib\sequelize db:create --env development
node .\node_modules\sequelize-cli\lib\sequelize db:migrate --env development
node .\node_modules\sequelize-cli\lib\sequelize db:seed:all --env development
```

## 4) Lancer le backend

```powershell
npm run dev
```

## 5) Vérifier les endpoints

- http://localhost:5000/api/health
- http://localhost:5000/api/auth/login
