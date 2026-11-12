# Deploy ADS RouteHub to Netlify (Private Repo - Free)
# This script deploys without needing GitHub connection

Write-Host "🚀 Deploying ADS RouteHub to Netlify..." -ForegroundColor Green
Write-Host ""

# Check if netlify-cli is installed
Write-Host "📦 Checking Netlify CLI..." -ForegroundColor Cyan
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue

if (-not $netlifyInstalled) {
    Write-Host "Installing Netlify CLI globally..." -ForegroundColor Yellow
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Netlify CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Netlify CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Netlify CLI already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔑 Logging into Netlify..." -ForegroundColor Cyan
netlify login

Write-Host ""
Write-Host "🏗️  Building the project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Deploying to Netlify..." -ForegroundColor Cyan
Write-Host "⚠️  You'll need to set environment variables in Netlify dashboard after first deploy:" -ForegroundColor Yellow
Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor Yellow
Write-Host "   - VITE_SUPABASE_PUBLISHABLE_KEY" -ForegroundColor Yellow
Write-Host ""

netlify deploy --prod --dir=dist

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "Don't forget to add environment variables in Netlify dashboard!" -ForegroundColor Yellow

