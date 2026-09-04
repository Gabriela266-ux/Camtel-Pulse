$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$databasePath = Join-Path $backendPath 'camtel_pulse.db'

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'Node.js LTS et npm doivent être installés avant le lancement.'
}

if (-not (Test-Path (Join-Path $backendPath 'node_modules'))) {
    Push-Location $backendPath
    npm.cmd install
    Pop-Location
}

if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
    Push-Location $frontendPath
    npm.cmd install
    Pop-Location
}

Push-Location $backendPath
npm.cmd run db:migrate
if (-not (Test-Path $databasePath)) {
    throw "La base SQLite n'a pas pu être créée."
}
$seedCount = node -e "const sqlite3=require('sqlite3');const db=new sqlite3.Database('camtel_pulse.db');db.get('SELECT COUNT(*) AS total FROM utilisateur',(e,r)=>{if(e){console.error(e.message);process.exit(1)}console.log(r.total);db.close()})"
if ([int]$seedCount -eq 0) {
    npm.cmd run db:seed
}
Pop-Location

Start-Process -FilePath 'cmd.exe' -WindowStyle Hidden -WorkingDirectory $backendPath -ArgumentList '/c', 'npm.cmd run dev'
Start-Process -FilePath 'cmd.exe' -WindowStyle Hidden -WorkingDirectory $frontendPath -ArgumentList '/c', 'npm.cmd run dev -- --host 127.0.0.1'

Start-Sleep -Seconds 4
Start-Process 'http://localhost:5173'
