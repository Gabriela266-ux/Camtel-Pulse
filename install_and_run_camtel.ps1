$ErrorActionPreference = 'Stop'
$launcher = Join-Path $PSScriptRoot 'start-local.ps1'

Write-Host 'Ce projet utilise SQLite localement : MySQL et PostgreSQL ne sont pas nécessaires.' -ForegroundColor Cyan
& $launcher
