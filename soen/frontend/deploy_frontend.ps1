# deploy_frontend.ps1
Write-Host "🚀 Starting Frontend Deployment..." -ForegroundColor Cyan

# 1. Go to frontend directory
Set-Location "c:\Users\Vishal\OneDrive\Desktop\Dev_fusion\soen\frontend"

# 2. Install Dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
cmd /c "npm install"
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }

# 3. Build Project (Vite will use .env.production automatically)
Write-Host "🔨 Building for production..." -ForegroundColor Yellow
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) { Write-Error "npm run build failed"; exit 1 }

# 4. Verify Build
if (-not (Test-Path "dist\index.html")) {
    Write-Error "❌ Build failed: dist\index.html not found!"
    exit 1
}
Write-Host "✅ Build verified." -ForegroundColor Green

# 5. Generate Random Domain
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$domain = "devfusion-auto-$randomId.surge.sh"

# 6. Deploy to Surge
Write-Host "☁️ Deploying to Surge ($domain)..." -ForegroundColor Cyan

# Check login status (optional, but good for debugging output)
# cmd /c "npx surge whoami" 2>&1 | Out-Null

# Run Surge
# We accept the default behavior. If unauthenticated, this might prompt (and fail in non-interactive).
# But we assume the user might have logged in or we try our best.
cmd /c "npx surge ./dist --domain $domain"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment Success!" -ForegroundColor Green
    Write-Host "🌍 Live URL: http://$domain" -ForegroundColor Cyan
}
else {
    Write-Host "❌ Deployment failed. If this is an auth error, run 'npx surge login' manually first." -ForegroundColor Red
}
