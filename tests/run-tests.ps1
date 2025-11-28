# Script para executar testes e salvar resultados

$ErrorActionPreference = "Continue"
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🧪 Iniciando execução dos testes..." -ForegroundColor Cyan

# Mudar para o diretório do projeto
Set-Location $PSScriptRoot\..

# Executar testes e capturar saída
Write-Host "📋 Executando Jest..." -ForegroundColor Yellow

try {
    $result = npm test 2>&1 | Out-String
    Write-Host $result
    $result | Out-File -FilePath "tests/test-results.txt" -Encoding UTF8
    Write-Host "✅ Resultados salvos em tests/test-results.txt" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao executar testes: $_" -ForegroundColor Red
    $_ | Out-File -FilePath "tests/test-errors.txt" -Encoding UTF8
}

