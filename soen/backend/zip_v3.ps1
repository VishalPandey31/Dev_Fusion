# Zip Script v3
$source = Get-Location
$tempDir = "$source\backend_temp_v3"
$zipFile = "$source\backend_v3.zip"

Write-Host "Preparing deployment package v3..." -ForegroundColor Cyan

if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files excluding node_modules
robocopy . $tempDir /E /XD node_modules .git .idea backend_temp_deploy backend_temp_v2 /XF *.zip *.log deploy.ps1 zip_project.ps1 zip_v2.ps1

Write-Host "Zipping files..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

Remove-Item $tempDir -Recurse -Force
Write-Host "✅ Created backend_v3.zip" -ForegroundColor Green
