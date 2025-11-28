# Script para instalar dependências e executar testes

Write-Host "📦 Instalando dependências do Jest..." -ForegroundColor Cyan
npm install jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest react-test-renderer --save-dev

Write-Host ""
Write-Host "📦 Instalando dependências do Selenium..." -ForegroundColor Cyan
Set-Location tests/selenium
npm install
Set-Location ../..

Write-Host ""
Write-Host "🧪 Executando testes Jest..." -ForegroundColor Yellow
npm test

Write-Host ""
Write-Host "✅ Concluído!" -ForegroundColor Green

