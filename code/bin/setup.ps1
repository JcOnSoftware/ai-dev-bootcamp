# setup.ps1 — Adds the aidev CLI to your PATH on Windows (PowerShell).
# Safe to run multiple times (idempotent).

$BinDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if already in PATH
if ($env:PATH -split ';' | Where-Object { $_ -eq $BinDir }) {
    Write-Host "✓ aidev is already in your PATH." -ForegroundColor Green
    Write-Host "  Try: aidev --help"
    exit 0
}

# Add to current session
$env:PATH = "$BinDir;$env:PATH"

# Add to user PATH permanently (persists across sessions)
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -split ';' | Where-Object { $_ -eq $BinDir }) {
    Write-Host "✓ PATH entry already exists in user environment." -ForegroundColor Green
} else {
    [Environment]::SetEnvironmentVariable("PATH", "$BinDir;$currentPath", "User")
    Write-Host "✓ Added to user PATH:" -ForegroundColor Green
    Write-Host "  $BinDir"
}

Write-Host ""

# Verify
if (Get-Command aidev -ErrorAction SilentlyContinue) {
    Write-Host "✓ aidev is ready! Try: aidev --help" -ForegroundColor Green
} else {
    Write-Host "→ Restart your terminal to use 'aidev' directly." -ForegroundColor Yellow
}
