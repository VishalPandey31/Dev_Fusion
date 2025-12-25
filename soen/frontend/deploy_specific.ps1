# deploy_specific.ps1
$ErrorActionPreference = "Stop"

Write-Host "Starting Deployment..." -ForegroundColor Cyan

# 1. Navigate
Set-Location "c:\Users\Vishal\OneDrive\Desktop\Dev_fusion\soen\frontend"

# 2. Install
Write-Host "Installing dependencies..." -ForegroundColor Yellow
cmd /c "npm install"
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

# 3. Build
Write-Host "Building for production..." -ForegroundColor Yellow
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

# 4. Fix SPA Routing
Write-Host "Creating 200.html..." -ForegroundColor Yellow
Copy-Item "dist\index.html" -Destination "dist\200.html" -Force

# 5. Deploy
$domain = "vishal-dev-fusion.surge.sh"
Write-Host "Deploying to $domain..." -ForegroundColor Cyan

cmd /c "npx surge ./dist --domain $domain"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Live URL: https://$domain" -ForegroundColor Green
}
else {
    Write-Host "FAILED." -ForegroundColor Red
    exit 1
}
