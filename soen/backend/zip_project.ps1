$source = Get-Location
$tempDir = "$source\backend_temp_deploy"
$zipFile = "$source\backend.zip"

Write-Host "Preparing deployment package..." -ForegroundColor Cyan

# Remove old zip if exists
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
# Remove old temp dir if exists
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

# Create Temp Dir
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files excluding node_modules and other clutter
# Note: Copy-Item -Recurse is simple but doesn't handle complex excludes well on all PS versions.
# We will use robocopy for speed and reliability in exclusion
robocopy . $tempDir /E /XD node_modules .git .idea /XF *.zip *.log deploy.ps1

# Zip the content of temp dir
Write-Host "Zipping files..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

# Cleanup
Remove-Item $tempDir -Recurse -Force

Write-Host "✅ Created backend.zip successfully!" -ForegroundColor Green
Write-Host "Location: $zipFile" -ForegroundColor Yellow
