$ErrorActionPreference = 'Stop'

$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location $projectPath

Write-Host 'Vérification de la configuration .env...' -ForegroundColor Cyan
if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host 'Fichier .env créé depuis .env.example' -ForegroundColor Yellow
}

Write-Host 'Installation des dépendances...' -ForegroundColor Cyan
npm install

Write-Host 'Création de la base MySQL si elle existe...' -ForegroundColor Cyan
node .\node_modules\sequelize-cli\lib\sequelize db:create --env development

Write-Host 'Exécution des migrations...' -ForegroundColor Cyan
node .\node_modules\sequelize-cli\lib\sequelize db:migrate --env development

Write-Host 'Chargement des seeders...' -ForegroundColor Cyan
node .\node_modules\sequelize-cli\lib\sequelize db:seed:all --env development

Write-Host 'Base prête. Vous pouvez lancer le backend avec: npm run dev' -ForegroundColor Green
