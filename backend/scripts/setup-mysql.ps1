$ErrorActionPreference = 'Stop'
$backendPath = Split-Path -Parent $PSScriptRoot
Set-Location $backendPath

Write-Host 'Nom historique du script : la version actuelle utilise SQLite, pas MySQL.' -ForegroundColor Yellow
Write-Host 'Installation des dépendances...' -ForegroundColor Cyan
npm.cmd install

Write-Host 'Application des migrations SQLite...' -ForegroundColor Cyan
npm.cmd run db:migrate

$userCount = node -e "const sqlite3=require('sqlite3');const db=new sqlite3.Database('camtel_pulse.db');db.get('SELECT COUNT(*) AS total FROM utilisateur',(e,r)=>{if(e){console.error(e.message);process.exit(1)}console.log(r.total);db.close()})"
if ([int]$userCount -eq 0) {
    Write-Host 'Chargement des données initiales...' -ForegroundColor Cyan
    npm.cmd run db:seed
}

Write-Host 'Base SQLite prête. Lancez le backend avec npm run dev.' -ForegroundColor Green
