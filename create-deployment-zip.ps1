# Create clean deployment package for Hostinger
$ErrorActionPreference = "Stop"

Write-Host "📦 Creating deployment package for Hostinger..." -ForegroundColor Cyan

# List of files/folders to include
$filesToInclude = @(
    "app",
    "components",
    "lib",
    "public",
    "contexts",
    "hooks",
    "styles",
    "scripts",
    "next.config.mjs",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "postcss.config.mjs",
    ".env.example",
    ".env.production.example",
    "eslint.config.mjs",
    "components.json",
    "next-env.d.ts"
)

# Clean up any existing zip
Get-ChildItem -Path "d:\App Enterprise\mudmy" -File | Where-Object { $_.Name -like "*.zip" } | Remove-Item -Force

# Create temporary directory
$tempDir = Join-Path $env:TEMP "mudmy-deploy-temp"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files to temp directory
Write-Host "Copying files..." -ForegroundColor Yellow
foreach ($file in $filesToInclude) {
    $source = Join-Path "d:\App Enterprise\mudmy" $file
    if (Test-Path $source) {
        $dest = Join-Path $tempDir $file
        if (Test-Path $source -PathType Container) {
            Copy-Item -Path $source -Destination $dest -Recurse -Force
            Write-Host "  ✓ Copied directory: $file"
        } else {
            Copy-Item -Path $source -Destination $dest -Force
            Write-Host "  ✓ Copied file: $file"
        }
    }
}

# Create zip file
Write-Host "Creating zip file..." -ForegroundColor Yellow
$zipPath = "d:\App Enterprise\mudmy\mudmy-hostinger-deployment.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Cleanup
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "✅ Deployment package created: $zipPath" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Instructions:" -ForegroundColor Cyan
Write-Host "   1. Upload mudmy-hostinger-deployment.zip to Hostinger"
Write-Host "   2. Extract it in public_html"
Write-Host "   3. Create .env file from .env.production.example"
Write-Host "   4. Run: chmod +x scripts/hostinger-fix.sh && ./scripts/hostinger-fix.sh"
Write-Host "   5. Run: npm install"
Write-Host "   6. Run: npm run build"
Write-Host "   7. Run: npm start"
