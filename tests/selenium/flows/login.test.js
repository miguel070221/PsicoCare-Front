const { By, until } = require('selenium-webdriver');
const { createDriver, quitDriver, getDriver } = require('../helpers/driver');
const { waitForElement, waitForElementVisible, waitForText } = require('../helpers/wait');
const config = require('../config');

describe('Testes de Login', () => {
  let driver;

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    await driver.get(config.baseUrl);
    // Aguardar página carregar
    await driver.sleep(2000);
  });

  test('deve fazer login como paciente com sucesso', async () => {
    // Navegar para página de login
    const loginLink = await waitForElement('a[href*="login"], button:contains("Login")');
    await loginLink.click();

    // Preencher email
    const emailInput = await waitForElement('input[type="email"], input[name="email"]');
    await emailInput.clear();
    await emailInput.sendKeys(config.testUsers.paciente.email);

    // Preencher senha
    const passwordInput = await waitForElement('input[type="password"], input[name="senha"]');
    await passwordInput.clear();
    await passwordInput.sendKeys(config.testUsers.paciente.password);

    // Clicar em entrar
    const submitButton = await waitForElement('button[type="submit"], button:contains("Entrar")');
    await submitButton.click();

    // Aguardar redirecionamento ou mensagem de sucesso
    await driver.sleep(3000);

    // Verificar se foi redirecionado para dashboard
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('home') || expect(currentUrl).toContain('dashboard');
  });

  test('deve exibir erro com credenciais inválidas', async () => {
    const loginLink = await waitForElement('a[href*="login"], button:contains("Login")');
    await loginLink.click();

    const emailInput = await waitForElement('input[type="email"], input[name="email"]');
    await emailInput.clear();
    await emailInput.sendKeys('email-invalido@teste.com');

    const passwordInput = await waitForElement('input[type="password"], input[name="senha"]');
    await passwordInput.clear();
    await passwordInput.sendKeys('senha-errada');

    const submitButton = await waitForElement('button[type="submit"], button:contains("Entrar")');
    await submitButton.click();

    // Aguardar mensagem de erro
    await driver.sleep(2000);

    // Verificar se há mensagem de erro
    const errorMessage = await driver.findElements(By.css('.error, [role="alert"], .alert-danger'));
    expect(errorMessage.length).toBeGreaterThan(0);
  });

  test('deve fazer login como psicólogo com sucesso', async () => {
    const loginLink = await waitForElement('a[href*="login"], button:contains("Login")');
    await loginLink.click();

    // Selecionar tipo de usuário (se houver)
    try {
      const psicologoOption = await driver.findElement(By.css('input[value="psicologo"], button:contains("Psicólogo")'));
      await psicologoOption.click();
      await driver.sleep(500);
    } catch {
      // Se não houver opção, continua
    }

    const emailInput = await waitForElement('input[type="email"], input[name="email"]');
    await emailInput.clear();
    await emailInput.sendKeys(config.testUsers.psicologo.email);

    const passwordInput = await waitForElement('input[type="password"], input[name="senha"]');
    await passwordInput.clear();
    await passwordInput.sendKeys(config.testUsers.psicologo.password);

    const submitButton = await waitForElement('button[type="submit"], button:contains("Entrar")');
    await submitButton.click();

    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('home') || expect(currentUrl).toContain('psicologo');
  });
});

// Executar testes
if (require.main === module) {
  (async () => {
    try {
      const driver = await createDriver();
      await driver.get(config.baseUrl);
      console.log('✅ Testes de login iniciados');
      // Executar testes aqui ou usar framework de testes
      await quitDriver();
    } catch (error) {
      console.error('❌ Erro nos testes:', error);
      await quitDriver();
      process.exit(1);
    }
  })();
}

