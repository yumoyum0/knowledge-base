# init.ps1 — Windows PowerShell startup for Knowledge-Base
param([switch]$StartApp)

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# Work around git ownership mismatch via project-local config
$env:GIT_CONFIG_GLOBAL = Join-Path $rootDir ".gitconfig"

Write-Host "==> Working directory: $PWD"
Write-Host "==> Syncing dependencies"
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Host "==> Running baseline verification"
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed" }

Write-Host "==> Running lint"
npm run lint
if ($LASTEXITCODE -ne 0) { throw "npm run lint failed" }

Write-Host "==> Startup command: npm start"

if ($StartApp) {
  Write-Host "==> Starting the app"
  npm start
}
else {
  Write-Host "Pass -StartApp to launch the app directly."
}
