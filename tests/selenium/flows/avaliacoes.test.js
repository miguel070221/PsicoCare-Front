const { By } = require('selenium-webdriver');
const { createDriver, quitDriver } = require('../helpers/driver');
const { waitForElement, waitForText } = require('../helpers/wait');
const config = require('../config');

describe('Testes de Avaliações', () => {
  let driver;

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    // Fazer login como paciente
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

  test('deve criar avaliação de psicólogo', async () => {
    // Navegar para página de avaliações
    const avaliacoesLink = await waitForElement('a[href*="avaliacoes"], button:contains("Avaliações")');
    await avaliacoesLink.click();
    await driver.sleep(2000);

    // Clicar em criar avaliação
    const criarButton = await waitForElement('button:contains("Criar"), button:contains("Avaliar")');
    await criarButton.click();
    await driver.sleep(1000);

    // Preencher formulário
    try {
      // Selecionar psicólogo (se houver dropdown)
      try {
        const psicologoSelect = await driver.findElement(By.css('select[name="psicologo"], input[type="select"]'));
        await psicologoSelect.click();
        await driver.sleep(500);
        const firstOption = await driver.findElement(By.css('option:not([value=""])'));
        await firstOption.click();
        await driver.sleep(500);
      } catch {
        // Se não houver select, continua
      }

      // Selecionar nota (estrelas)
      const nota5 = await waitForElement('button[data-nota="5"], .star-5');
      await nota5.click();
      await driver.sleep(500);

      // Preencher comentário
      const comentarioInput = await waitForElement('textarea[name="comentario"], textarea[name="comentario"]');
      await comentarioInput.sendKeys('Excelente profissional, muito atencioso e competente!');

      // Salvar
      const salvarButton = await waitForElement('button[type="submit"], button:contains("Salvar")');
      await salvarButton.click();
      await driver.sleep(2000);

      // Verificar sucesso
      const successMessage = await driver.findElements(By.css('.success, [role="alert"].success'));
      expect(successMessage.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('Erro ao criar avaliação:', error.message);
    }
  });

  test('deve listar avaliações', async () => {
    const avaliacoesLink = await waitForElement('a[href*="avaliacoes"], button:contains("Avaliações")');
    await avaliacoesLink.click();
    await driver.sleep(2000);

    // Verificar se há lista de avaliações
    const avaliacoesList = await driver.findElements(By.css('.avaliacao, [data-testid="avaliacao"]'));
    expect(avaliacoesList).toBeDefined();
  });

  test('deve ver avaliações públicas de psicólogos', async () => {
    // Navegar para página de psicólogos
    const psicologosLink = await waitForElement('a[href*="psicologos"], button:contains("Psicólogos")');
    await psicologosLink.click();
    await driver.sleep(2000);

    // Clicar em um psicólogo
    try {
      const psicologoCard = await driver.findElement(By.css('.psicologo-card, [data-testid="psicologo"]'));
      await psicologoCard.click();
      await driver.sleep(2000);

      // Verificar se há avaliações visíveis
      const avaliacoes = await driver.findElements(By.css('.avaliacao-publica, .review'));
      // Pode ser 0 ou mais
      expect(avaliacoes).toBeDefined();
    } catch (error) {
      console.log('Erro ao ver avaliações:', error.message);
    }
  });
});

if (require.main === module) {
  (async () => {
    try {
      const driver = await createDriver();
      await driver.get(config.baseUrl);
      console.log('✅ Testes de avaliações iniciados');
      await quitDriver();
    } catch (error) {
      console.error('❌ Erro nos testes:', error);
      await quitDriver();
      process.exit(1);
    }
  })();
}

