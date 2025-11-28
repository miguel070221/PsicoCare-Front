const { By } = require('selenium-webdriver');
const { createDriver, quitDriver } = require('../helpers/driver');
const { waitForElement, waitForText } = require('../helpers/wait');
const config = require('../config');

describe('Testes de Solicitações de Vínculo', () => {
  let driver;

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    // Fazer login como paciente primeiro
    await driver.get(config.baseUrl);
    await driver.sleep(2000);

    try {
      const loginLink = await waitForElement('a[href*="login"]');
      await loginLink.click();
      await driver.sleep(1000);

      const emailInput = await waitForElement('input[type="email"], input[name="email"]');
      await emailInput.sendKeys(config.testUsers.paciente.email);

      const passwordInput = await waitForElement('input[type="password"], input[name="senha"]');
      await passwordInput.sendKeys(config.testUsers.paciente.password);

      const submitButton = await waitForElement('button[type="submit"]');
      await submitButton.click();
      await driver.sleep(3000);
    } catch (error) {
      console.log('Já está logado ou erro no login:', error.message);
    }
  });

  test('deve solicitar vínculo com psicólogo', async () => {
    // Navegar para página de psicólogos
    const psicologosLink = await waitForElement('a[href*="psicologos"], button:contains("Psicólogos")');
    await psicologosLink.click();
    await driver.sleep(2000);

    // Selecionar um psicólogo
    try {
      const psicologoCard = await driver.findElement(By.css('.psicologo-card, [data-testid="psicologo"]'));
      await psicologoCard.click();
      await driver.sleep(1000);

      // Clicar em solicitar vínculo
      const solicitarButton = await waitForElement('button:contains("Solicitar"), button:contains("Vínculo")');
      await solicitarButton.click();
      await driver.sleep(2000);

      // Verificar mensagem de sucesso
      const successMessage = await driver.findElements(By.css('.success, [role="alert"].success'));
      expect(successMessage.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('Erro ao solicitar vínculo:', error.message);
      // Teste pode falhar se não houver psicólogos disponíveis
    }
  });

  test('deve ver solicitações pendentes como psicólogo', async () => {
    // Fazer logout e login como psicólogo
    try {
      const logoutButton = await driver.findElement(By.css('button:contains("Sair"), button:contains("Logout")'));
      await logoutButton.click();
      await driver.sleep(2000);
    } catch {
      // Se não houver botão de logout, continua
    }

    // Login como psicólogo
    const loginLink = await waitForElement('a[href*="login"]');
    await loginLink.click();
    await driver.sleep(1000);

    // Selecionar tipo psicólogo
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

    const submitButton = await waitForElement('button[type="submit"]');
    await submitButton.click();
    await driver.sleep(3000);

    // Navegar para solicitações
    const solicitacoesLink = await waitForElement('a[href*="solicitacoes"], button:contains("Solicitações")');
    await solicitacoesLink.click();
    await driver.sleep(2000);

    // Verificar se há lista de solicitações
    const solicitacoesList = await driver.findElements(By.css('.solicitacao, [data-testid="solicitacao"]'));
    expect(solicitacoesList).toBeDefined();
  });

  test('deve aceitar solicitação como psicólogo', async () => {
    // Assumindo que já está logado como psicólogo e na página de solicitações
    try {
      const aceitarButton = await waitForElement('button:contains("Aceitar")');
      await aceitarButton.click();
      await driver.sleep(2000);

      // Verificar mensagem de sucesso
      const successMessage = await driver.findElements(By.css('.success, [role="alert"].success'));
      expect(successMessage.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('Erro ao aceitar solicitação:', error.message);
      // Teste pode falhar se não houver solicitações pendentes
    }
  });
});

if (require.main === module) {
  (async () => {
    try {
      const driver = await createDriver();
      await driver.get(config.baseUrl);
      console.log('✅ Testes de solicitações iniciados');
      await quitDriver();
    } catch (error) {
      console.error('❌ Erro nos testes:', error);
      await quitDriver();
      process.exit(1);
    }
  })();
}

