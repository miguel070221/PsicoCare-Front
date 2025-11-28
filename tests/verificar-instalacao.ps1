# Script para verificar se todas as dependências de teste estão instaladas

Write-Host "🔍 Verificando instalação das dependências de teste..." -ForegroundColor Cyan
Write-Host ""

$erros = 0

# Verificar Jest
Write-Host "📦 Verificando Jest..." -ForegroundColor Yellow
try {
    $jestVersion = npm list jest --depth=0 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Jest instalado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Jest NÃO instalado" -ForegroundColor Red
        $erros++
    }
} catch {
    Write-Host "   ❌ Erro ao verificar Jest" -ForegroundColor Red
    $erros++
}

# Verificar @testing-library/react-native
Write-Host "📦 Verificando @testing-library/react-native..." -ForegroundColor Yellow
try {
    $testingLib = npm list @testing-library/react-native --depth=0 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ @testing-library/react-native instalado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ @testing-library/react-native NÃO instalado" -ForegroundColor Red
        $erros++
    }
} catch {
    Write-Host "   ❌ Erro ao verificar @testing-library/react-native" -ForegroundColor Red
    $erros++
}

# Verificar Selenium
Write-Host "📦 Verificando Selenium..." -ForegroundColor Yellow
Push-Location "tests/selenium"
try {
    if (Test-Path "node_modules") {
        $selenium = npm list selenium-webdriver --depth=0 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Selenium instalado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Selenium NÃO instalado" -ForegroundColor Red
            $erros++
        }
    } else {
        Write-Host "   ❌ node_modules não encontrado em tests/selenium" -ForegroundColor Red
        $erros++
    }
} catch {
    Write-Host "   ❌ Erro ao verificar Selenium" -ForegroundColor Red
    $erros++
}
Pop-Location

Write-Host ""
if ($erros -eq 0) {
    Write-Host "✅ Todas as dependências estão instaladas!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Executar testes Jest: npm test" -ForegroundColor White
    Write-Host "   2. Executar testes Selenium: cd tests/selenium && npm test" -ForegroundColor White
    Write-Host "   3. Executar testes JMeter: jmeter (abrir psicocare-api-load-test.jmx)" -ForegroundColor White
} else {
    Write-Host "❌ Encontrados $erros erro(s). Instalando dependências..." -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Instalando dependências do Jest..." -ForegroundColor Yellow
    npm install jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest react-test-renderer --save-dev
    
    Write-Host "📦 Instalando dependências do Selenium..." -ForegroundColor Yellow
    Push-Location "tests/selenium"
    npm install selenium-webdriver
    Pop-Location
    
    Write-Host ""
    Write-Host "✅ Instalação concluída! Execute este script novamente para verificar." -ForegroundColor Green
}

