const { By } = require('selenium-webdriver');
const { createDriver, quitDriver, getDriver } = require('../helpers/driver');
const { waitForElement, waitForElementVisible } = require('../helpers/wait');
const config = require('../config');

describe('Testes de Cadastro', () => {
  let driver;

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    await driver.get(config.baseUrl);
    await driver.sleep(2000);
  });

  test('deve cadastrar novo paciente com sucesso', async () => {
    // Navegar para página de cadastro
    const registerLink = await waitForElement('a[href*="register"], button:contains("Cadastrar")');
    await registerLink.click();
    await driver.sleep(1000);

    // Preencher formulário
    const nomeInput = await waitForElement('input[name="nome"]');
    await nomeInput.sendKeys('Paciente Teste Selenium');

    const emailInput = await waitForElement('input[name="email"], input[type="email"]');
    const timestamp = Date.now();
    await emailInput.sendKeys(`teste${timestamp}@selenium.com`);

    const senhaInput = await waitForElement('input[name="senha"], input[type="password"]');
    await senhaInput.sendKeys('senha123456');

    const telefoneInput = await waitForElement('input[name="telefone"]');
    await telefoneInput.sendKeys('11999999999');

    // Selecionar tipo paciente (se houver)
    try {
      const pacienteOption = await driver.findElement(By.css('input[value="paciente"]'));
      await pacienteOption.click();
    } catch {
      // Se não houver opção, continua
    }

    // Submeter formulário
    const submitButton = await waitForElement('button[type="submit"], button:contains("Cadastrar")');
    await submitButton.click();

    // Aguardar redirecionamento
    await driver.sleep(3000);

    // Verificar sucesso
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('login') || expect(currentUrl).toContain('home');
  });

  test('deve cadastrar novo psicólogo com sucesso', async () => {
    const registerLink = await waitForElement('a[href*="register"], button:contains("Cadastrar")');
    await registerLink.click();
    await driver.sleep(1000);

    // Selecionar tipo psicólogo
    try {
      const psicologoOption = await driver.findElement(By.css('input[value="psicologo"], button:contains("Psicólogo")'));
      await psicologoOption.click();
      await driver.sleep(500);
    } catch {
      // Se não houver opção, continua
    }

    const nomeInput = await waitForElement('input[name="nome"]');
    await nomeInput.sendKeys('Psicólogo Teste Selenium');

    const emailInput = await waitForElement('input[name="email"], input[type="email"]');
    const timestamp = Date.now();
    await emailInput.sendKeys(`psicologo${timestamp}@selenium.com`);

    const senhaInput = await waitForElement('input[name="senha"], input[type="password"]');
    await senhaInput.sendKeys('senha123456');

    const crpInput = await waitForElement('input[name="crp"]');
    await crpInput.sendKeys(`12345${timestamp}`);

    const submitButton = await waitForElement('button[type="submit"], button:contains("Cadastrar")');
    await submitButton.click();

    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('login') || expect(currentUrl).toContain('home');
  });

  test('deve exibir erro ao cadastrar com email duplicado', async () => {
    const registerLink = await waitForElement('a[href*="register"], button:contains("Cadastrar")');
    await registerLink.click();
    await driver.sleep(1000);

    const nomeInput = await waitForElement('input[name="nome"]');
    await nomeInput.sendKeys('Teste Duplicado');

    const emailInput = await waitForElement('input[name="email"], input[type="email"]');
    await emailInput.sendKeys(config.testUsers.paciente.email); // Email já existente

    const senhaInput = await waitForElement('input[name="senha"], input[type="password"]');
    await senhaInput.sendKeys('senha123456');

    const submitButton = await waitForElement('button[type="submit"], button:contains("Cadastrar")');
    await submitButton.click();

    await driver.sleep(2000);

    // Verificar mensagem de erro
    const errorElements = await driver.findElements(By.css('.error, [role="alert"], .alert-danger'));
    expect(errorElements.length).toBeGreaterThan(0);
  });
});

if (require.main === module) {
  (async () => {
    try {
      const driver = await createDriver();
      await driver.get(config.baseUrl);
      console.log('✅ Testes de cadastro iniciados');
      await quitDriver();
    } catch (error) {
      console.error('❌ Erro nos testes:', error);
      await quitDriver();
      process.exit(1);
    }
  })();
}

