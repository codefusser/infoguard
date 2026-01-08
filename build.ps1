param(
    [string]$version = "1.0.0",
    [switch]$help
)

if ($help) {
    Write-Host @"
InfoGuard Extension Build Script
================================

Usage: .\build.ps1 [-version "1.0.0"] [-help]

Options:
  -version    Specify version number (default: 1.0.0)
  -help       Show this help message

Examples:
  .\build.ps1                    # Build with default version
  .\build.ps1 -version "1.0.1"   # Build with custom version
"@
    exit
}

Write-Host "🔨 Building InfoGuard Extension v$version" -ForegroundColor Cyan

# Validate manifest.json exists
if (-not (Test-Path "manifest.json")) {
    Write-Host "❌ Error: manifest.json not found in current directory" -ForegroundColor Red
    exit 1
}

# Create temp build directory
$buildDir = "build-temp"
if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force -Confirm:$false
}
New-Item -ItemType Directory -Path $buildDir | Out-Null
Write-Host "✓ Created build directory" -ForegroundColor Green

# Copy essential files
Write-Host "📋 Copying files..."
Copy-Item manifest.json $buildDir/manifest.json
Copy-Item src $buildDir/src -Recurse
Copy-Item assets $buildDir/assets -Recurse

# Verify required icon sizes
$requiredIcons = @("16", "48", "128")
$iconDir = "$buildDir/assets/icons"
foreach ($size in $requiredIcons) {
    $iconFile = "$iconDir/icon-$size.png"
    if (-not (Test-Path $iconFile)) {
        Write-Host "⚠️  Warning: icon-$size.png not found" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Found icon-$size.png" -ForegroundColor Green
    }
}

# Verify required files
$requiredFiles = @(
    "manifest.json",
    "src/background.js",
    "src/content.js",
    "src/popup.html",
    "src/popup.js",
    "src/options.html",
    "src/options.js"
)

Write-Host "✓ Verifying manifest structure..."
foreach ($file in $requiredFiles) {
    $fullPath = "$buildDir/$file"
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length / 1KB
        Write-Host "  ✓ $file ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $file" -ForegroundColor Red
    }
}

# Create ZIP archive
$zipName = "InfoGuard-v$version.zip"
Write-Host "📦 Creating package: $zipName..."

try {
    # Use 7-Zip if available for better compression
    $sevenZip = "C:\Program Files\7-Zip\7z.exe"
    if (Test-Path $sevenZip) {
        & $sevenZip a -tzip $zipName "$buildDir\*" | Out-Null
        Write-Host "✓ Package created with 7-Zip" -ForegroundColor Green
    } else {
        Compress-Archive -Path "$buildDir\*" -DestinationPath $zipName -Force
        Write-Host "✓ Package created with PowerShell compression" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error creating ZIP: $_" -ForegroundColor Red
    Remove-Item $buildDir -Recurse -Force -Confirm:$false
    exit 1
}

# Get file size
$zipSize = (Get-Item $zipName).Length / 1MB
Write-Host "📊 Package size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan

# Cleanup
Remove-Item $buildDir -Recurse -Force -Confirm:$false
Write-Host "✓ Cleaned up temporary files" -ForegroundColor Green

# Checksum
$checksum = (Get-FileHash $zipName -Algorithm SHA256).Hash
Write-Host ""
Write-Host "✅ Build Complete!" -ForegroundColor Green
Write-Host "📦 Package: $zipName"
Write-Host "🔐 SHA256: $checksum"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload to Chrome Web Store: https://chrome.google.com/webstore/devconsole/"
Write-Host "2. Upload to Edge Add-ons: https://partner.microsoft.com/dashboard/microsoftedge"
Write-Host ""
