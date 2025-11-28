const { createDriver, quitDriver } = require('./helpers/driver');
const config = require('./config');

async function runTests() {
  console.log('🚀 Iniciando testes Selenium...');
  console.log(`📍 URL base: ${config.baseUrl}`);
  console.log(`🌐 Navegador: ${config.browser}`);
  console.log(`👁️  Headless: ${config.headless ? 'Sim' : 'Não'}\n`);

  let driver;

  try {
    driver = await createDriver();
    await driver.get(config.baseUrl);
    
    console.log('✅ Driver criado com sucesso');
    console.log('✅ Página carregada');
    console.log(`📍 URL atual: ${await driver.getCurrentUrl()}\n`);

    // Aqui você pode executar testes específicos
    console.log('📝 Para executar testes específicos, use:');
    console.log('   npm test -- login.test.js');
    console.log('   npm test -- register.test.js');
    console.log('   npm test -- agendamentos.test.js\n');

    await driver.sleep(2000);
    
  } catch (error) {
    console.error('❌ Erro ao executar testes:', error);
    process.exit(1);
  } finally {
    if (driver) {
      await quitDriver();
      console.log('✅ Driver encerrado');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

