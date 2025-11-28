# Script para executar testes e mostrar resultados

Write-Host "🧪 Executando testes Jest..." -ForegroundColor Cyan
Write-Host ""

# Mudar para o diretório do projeto
Set-Location $PSScriptRoot\..

# Executar testes Jest
Write-Host "📋 Executando: npm test" -ForegroundColor Yellow
npm test

Write-Host ""
Write-Host "✅ Testes concluídos!" -ForegroundColor Green

