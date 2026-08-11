<#
Install and run the Camtel PostgreSQL schema script.
Usage:
  1) Open PowerShell as Administrator.
  2) cd "C:\Users\TEMPEST\Desktop\camtel_db\Camtel-Pulse"
  3) .\install_and_run_camtel.ps1
#>

$ErrorActionPreference = 'Stop'

function Install-Postgres {
    Write-Host 'PostgreSQL not found. Installing via winget...' -ForegroundColor Yellow
    $candidates = @(
        'PostgreSQL.PostgreSQL.16',
        'PostgreSQL.PostgreSQL',
        'PostgreSQL.PostgreSQL.15',
        'PostgreSQL.PostgreSQL.14'
    )

    foreach ($id in $candidates) {
        try {
            Write-Host "Trying winget install $id..." -ForegroundColor Cyan
            winget install --id $id --exact --accept-package-agreements --accept-source-agreements
            return
        } catch {
            Write-Host "Package ID '$id' failed or is unavailable." -ForegroundColor DarkYellow
        }
    }

    throw 'Unable to install PostgreSQL via winget. Please install PostgreSQL manually.'
}

function Ensure-Postgres {
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Install-Postgres
        Write-Host 'PostgreSQL installed. Restart PowerShell and run this script again.' -ForegroundColor Green
        exit 0
    }
}

function Run-SqlScript {
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $sqlPath = Join-Path $projectRoot 'database\CAMTEL2_db.sql'

    if (-not (Test-Path $sqlPath)) {
        throw "SQL file not found: $sqlPath"
    }

    Write-Host "Using SQL file: $sqlPath" -ForegroundColor Green

    Write-Host 'Creating database suivi_camtel if it does not exist...' -ForegroundColor Cyan
    $createDbCommand = 'CREATE DATABASE suivi_camtel;'
    & psql -U postgres -c $createDbCommand

    Write-Host 'Executing CAMTEL2_db.sql in database suivi_camtel...' -ForegroundColor Cyan
    & psql -U postgres -d suivi_camtel -f $sqlPath
}

Write-Host 'Starting Camtel PostgreSQL install/run helper...' -ForegroundColor Green
Ensure-Postgres
Run-SqlScript
Write-Host 'Finished. If psql asked for a password, enter the postgres password you configured during installation.' -ForegroundColor Green
