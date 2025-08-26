# Keystore Setup Script for Local Development
# Run this script to set up your local keystore configuration

Write-Host "Setting up keystore for local development..." -ForegroundColor Green

# Check if keystore file exists
if (-not (Test-Path "keystore/my-upload-key.keystore")) {
    Write-Host "ERROR: Keystore file not found!" -ForegroundColor Red
    Write-Host "Please ensure keystore/my-upload-key.keystore exists" -ForegroundColor Red
    exit 1
}

# Prompt for keystore details
$storePassword = Read-Host "Enter keystore password" -AsSecureString
$keyPassword = Read-Host "Enter key password" -AsSecureString
$keyAlias = Read-Host "Enter key alias"

# Convert secure strings to plain text for gradle
$storePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword))
$keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))

# Create keystore.properties
$keystoreContent = @"
storePassword=$storePasswordPlain
keyPassword=$keyPasswordPlain
keyAlias=$keyAlias
storeFile=keystore/my-upload-key.keystore
"@

$keystoreContent | Out-File -FilePath "keystore.properties" -Encoding UTF8

Write-Host "Keystore configuration created successfully!" -ForegroundColor Green
Write-Host "You can now run: .\gradlew.bat bundleRelease" -ForegroundColor Yellow
