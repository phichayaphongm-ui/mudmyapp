# Deployment script for Mudmy - Hostinger (PowerShell)
# This script creates a clean build and packages it for deployment

Write-Host "🚀 Starting Mudmy Deployment Preparation..." -ForegroundColor Cyan
Write-Host ""

# Remove old builds
Write-Host "🧹 Cleaning old builds..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "mudmy-deployment.zip") { Remove-Item -Force "mudmy-deployment.zip" }
Write-Host "✅ Clean complete" -ForegroundColor Green
Write-Host ""

# Build the project
Write-Host "🔨 Building Next.js project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Build failed! Please fix the errors first." -ForegroundColor Red
  exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

$compressParams = @{
  Path = "next.config.*", "package.json", "package-lock.json", "public", ".next", "lib", "components", "app"
  DestinationPath = "mudmy-deployment.zip"
  Exclude = "*.DS_Store", "node_modules/*", ".git/*", ".env*.local", "__pycache__/*"
}

Compress-Archive @compressParams -Force

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✅ Deployment package created: mudmy-deployment.zip" -ForegroundColor Green
  Write-Host ""
  Write-Host "📋 Next steps for Hostinger deployment:" -ForegroundColor Cyan
  Write-Host "   1. Upload mudmy-deployment.zip to your Hostinger file manager"
  Write-Host "   2. Extract the zip file"
  Write-Host "   3. Go to the site dashboard and click 'Manage'"
  Write-Host "   4. Create .env file with your Supabase credentials"
  Write-Host "   5. Run 'npm install' in the terminal"
  Write-Host "   6. Run 'npm start' or set up as Node.js application"
  Write-Host ""
  Write-Host "🎉 Ready to deploy!" -ForegroundColor Green
} else {
  Write-Host "❌ Failed to create deployment package" -ForegroundColor Red
  exit 1
}
