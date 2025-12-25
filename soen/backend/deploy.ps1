# Deploy Script for Google Cloud Run
# Usage: ./deploy.ps1 -ProjectId "your-project-id"

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

Write-Host "🚀 Starting Deployment to Google Cloud Run..." -ForegroundColor Cyan

# 1. Check for .env file
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# 2. Read .env and construct environment variables string
Write-Host "reading .env file..." -ForegroundColor Yellow
$envContent = Get-Content .env
$envVars = @()
foreach ($line in $envContent) {
    if ($line -match "^[^#]*=.*") {
         # Key=Value pair, simple trim
         $envVars += $line.Trim()
    }
}
$envString = $envVars -join ","

if (-not $envString) {
    Write-Host "⚠ Warning: No environment variables found in .env" -ForegroundColor Yellow
}

# 3. Configure Google Cloud Project
Write-Host "Setting Google Cloud Project to: $ProjectId" -ForegroundColor Yellow
gcloud config set project $ProjectId

# 4. Deploy
Write-Host "Deploying..." -ForegroundColor Cyan
Write-Host "Command: gcloud run deploy backend --source . --region us-central1 --allow-unauthenticated --set-env-vars [HIDDEN]" -ForegroundColor DarkGray

# Using Invoke-Expression or direct execution
# Note: We use --source . so Google Cloud Build handles the Docker build remotely.
# We map simple env vars. 
# CAUTION: This creates a new revision with the env vars.
$deployCmd = "gcloud run deploy backend --source . --region us-central1 --allow-unauthenticated --set-env-vars ""$envString"""

Invoke-Expression $deployCmd

if ($?) {
    Write-Host "✅ Deployment Complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment Failed." -ForegroundColor Red
}
