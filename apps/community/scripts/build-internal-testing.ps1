# Build for Play Store Internal Testing
# Run this script from the project root
# Prerequisites: npm install, eas login

Write-Host "=== Thamizh - Play Store Internal Testing Build ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Verify EAS login
Write-Host "Step 2: Verifying EAS login..." -ForegroundColor Yellow
eas whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged into EAS. Run 'eas login' first." -ForegroundColor Red
    exit 1
}

# Step 3: Build AAB for internal testing
Write-Host "Step 3: Building Android App Bundle for internal testing..." -ForegroundColor Yellow
eas build --platform android --profile internal-testing --non-interactive

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build succeeded!" -ForegroundColor Green
Write-Host ""
Write-Host "To submit to Play Store Internal Testing track:" -ForegroundColor Cyan
Write-Host "  eas submit --platform android --profile production" -ForegroundColor White
Write-Host ""
Write-Host "Or submit a specific build:" -ForegroundColor Cyan
Write-Host "  eas submit --platform android --profile production --id <build-id>" -ForegroundColor White
