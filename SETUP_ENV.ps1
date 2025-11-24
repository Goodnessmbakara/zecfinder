# Quick setup script for GEMINI_API_KEY (PowerShell)

Write-Host "🔐 Setting up GEMINI_API_KEY securely..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path .env) {
    $overwrite = Read-Host "⚠️  .env file already exists! Overwrite? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Keeping existing .env file."
        exit
    }
}

# Get API key from user
$secureKey = Read-Host "Enter your Gemini API key (get it from https://ai.google.dev/)" -AsSecureString
$GEMINI_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
)

if ([string]::IsNullOrEmpty($GEMINI_KEY)) {
    Write-Host "❌ API key cannot be empty!" -ForegroundColor Red
    exit 1
}

# Create .env file
@"
# Google Gemini API Key
# Get your API key from: https://ai.google.dev/
GEMINI_API_KEY=$GEMINI_KEY

# Frontend URL (optional, defaults to http://localhost:5173)
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host "You can now run: docker-compose up -d" -ForegroundColor Yellow
