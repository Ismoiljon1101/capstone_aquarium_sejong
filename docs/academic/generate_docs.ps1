# generate_docs.ps1
# Generates Fishlinic academic documentation in DOCX and PDF formats.
# Run from the docs/academic/ directory or project root.
# Requirements: Pandoc installed (winget install JohnMacFarlane.Pandoc)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceFile = Join-Path $scriptDir "fishlinic_academic_doc.md"
$outputDocx = Join-Path $scriptDir "Fishlinic_Documentation.docx"
$outputPdf  = Join-Path $scriptDir "Fishlinic_Documentation.pdf"

Write-Host "=== Fishlinic Documentation Generator ===" -ForegroundColor Cyan
Write-Host "Source: $sourceFile"

# --- Verify source exists ---
if (-Not (Test-Path $sourceFile)) {
    Write-Error "Source file not found: $sourceFile"
    exit 1
}

# --- Verify pandoc is available ---
try {
    $pandocVersion = & pandoc --version 2>&1 | Select-Object -First 1
    Write-Host "Using: $pandocVersion" -ForegroundColor Green
} catch {
    Write-Error "Pandoc is not installed or not on PATH. Install via: winget install JohnMacFarlane.Pandoc"
    exit 1
}

# --- Generate DOCX ---
Write-Host "`nGenerating DOCX..." -ForegroundColor Yellow
& pandoc $sourceFile `
    --output $outputDocx `
    --from markdown+smart `
    --toc `
    --toc-depth=3 `
    --highlight-style=tango `
    --metadata title="Fishlinic Documentation"

if ($LASTEXITCODE -eq 0) {
    $size = [math]::Round((Get-Item $outputDocx).Length / 1KB, 1)
    Write-Host "  DOCX generated: $outputDocx ($size KB)" -ForegroundColor Green
} else {
    Write-Error "DOCX generation failed (exit code $LASTEXITCODE)"
}

# --- Generate PDF ---
Write-Host "`nGenerating PDF..." -ForegroundColor Yellow
# Try with weasyprint engine first (lightweight), fall back to wkhtmltopdf, then xelatex
$pdfEngines = @("weasyprint", "wkhtmltopdf", "xelatex", "pdflatex")
$pdfSuccess = $false

foreach ($engine in $pdfEngines) {
    $enginePath = Get-Command $engine -ErrorAction SilentlyContinue
    if ($enginePath) {
        Write-Host "  Using PDF engine: $engine"
        & pandoc $sourceFile `
            --output $outputPdf `
            --from markdown+smart `
            --pdf-engine=$engine `
            --toc `
            --toc-depth=3 `
            --highlight-style=tango `
            --variable geometry:margin=2.5cm `
            --variable fontsize=12pt `
            --variable linestretch=1.4

        if ($LASTEXITCODE -eq 0) {
            $size = [math]::Round((Get-Item $outputPdf).Length / 1KB, 1)
            Write-Host "  PDF generated: $outputPdf ($size KB)" -ForegroundColor Green
            $pdfSuccess = $true
            break
        }
    }
}

if (-Not $pdfSuccess) {
    Write-Warning "No supported PDF engine found (tried: $($pdfEngines -join ', '))."
    Write-Warning "DOCX was created successfully — open it in Word and export to PDF manually."
    Write-Warning "Or install wkhtmltopdf: https://wkhtmltopdf.org/downloads.html"
}

# --- Summary ---
Write-Host "`n=== Output Summary ===" -ForegroundColor Cyan
if (Test-Path $outputDocx) { Write-Host "  [OK] $outputDocx" -ForegroundColor Green }
if (Test-Path $outputPdf)  { Write-Host "  [OK] $outputPdf"  -ForegroundColor Green }
Write-Host "`nDone." -ForegroundColor Cyan
