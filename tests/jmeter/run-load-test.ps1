# Script PowerShell para executar testes de carga com JMeter
# Uso: .\run-load-test.ps1

param(
    [int]$Threads = 10,
    [int]$RampUp = 10,
    [int]$Loops = 1,
    [string]$OutputDir = "results"
)

Write-Host "🚀 Iniciando teste de carga com JMeter..." -ForegroundColor Green
Write-Host "📊 Configuração:" -ForegroundColor Yellow
Write-Host "   Threads (usuários): $Threads" -ForegroundColor Cyan
Write-Host "   Ramp-up (segundos): $RampUp" -ForegroundColor Cyan
Write-Host "   Loops: $Loops" -ForegroundColor Cyan
Write-Host ""

# Verificar se JMeter está instalado
$jmeterPath = Get-Command jmeter -ErrorAction SilentlyContinue
if (-not $jmeterPath) {
    Write-Host "❌ JMeter não encontrado no PATH!" -ForegroundColor Red
    Write-Host "   Por favor, instale o JMeter ou adicione ao PATH" -ForegroundColor Yellow
    Write-Host "   Download: https://jmeter.apache.org/download_jmeter.cgi" -ForegroundColor Yellow
    exit 1
}

# Criar diretório de resultados se não existir
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$resultsFile = "$OutputDir/results-$timestamp.jtl"
$reportDir = "$OutputDir/report-$timestamp"

Write-Host "📁 Arquivo de resultados: $resultsFile" -ForegroundColor Cyan
Write-Host "📁 Diretório de relatório: $reportDir" -ForegroundColor Cyan
Write-Host ""

# Executar JMeter
Write-Host "⏳ Executando teste..." -ForegroundColor Yellow
$jmeterScript = Join-Path $PSScriptRoot "psicocare-api-load-test.jmx"

jmeter -n `
    -t $jmeterScript `
    -l $resultsFile `
    -e -o $reportDir `
    -JTHREADS=$Threads `
    -JRAMP_UP=$RampUp `
    -JLOOPS=$Loops

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Teste concluído com sucesso!" -ForegroundColor Green
    Write-Host "📊 Abra o relatório HTML em: $reportDir\index.html" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erro ao executar teste!" -ForegroundColor Red
    exit 1
}

