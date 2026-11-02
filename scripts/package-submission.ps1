# Collects the Month 5 deliverables into submission/ with the required [name]-month5-* names.
#   powershell -File scripts/package-submission.ps1 [-Name lakshitha]
param([string]$Name = 'lakshitha')

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'submission'
$dockerDir = Join-Path $out "$Name-month5-dockerfiles"

New-Item -ItemType Directory -Force -Path $dockerDir | Out-Null

$files = @{
  'backend/Dockerfile'                       = 'backend.Dockerfile'
  'backend/.dockerignore'                    = 'backend.dockerignore'
  'frontend/Dockerfile'                      = 'frontend.Dockerfile'
  'frontend/.dockerignore'                   = 'frontend.dockerignore'
  'frontend/nginx/default.conf.template'     = 'frontend.nginx.default.conf.template'
  'frontend/nginx/15-resolver.envsh'         = 'frontend.nginx.15-resolver.envsh'
}
foreach ($src in $files.Keys) {
  Copy-Item (Join-Path $root $src) (Join-Path $dockerDir $files[$src]) -Force
}

Copy-Item (Join-Path $root 'docker-compose.yml') (Join-Path $out "$Name-month5-docker-compose.yml") -Force
Copy-Item (Join-Path $root '.github/workflows/ci-cd.yml') (Join-Path $out "$Name-month5-github-workflow.yml") -Force

Write-Host "Packaged into $out"
Get-ChildItem -Recurse $out | Select-Object -ExpandProperty FullName
if (-not (Test-Path (Join-Path $out "$Name-month5-monitoring.png"))) {
  Write-Warning "Missing $Name-month5-monitoring.png - take the Grafana screenshot (docs/09-monitoring.md)"
}
