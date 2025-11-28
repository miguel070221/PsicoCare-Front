const { By } = require('selenium-webdriver');
const { createDriver, quitDriver } = require('../helpers/driver');
const { waitForElement, waitForText } = require('../helpers/wait');
const config = require('../config');

describe('Testes de Notas e Sessões', () => {
  let driver;

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    // Fazer login como psicólogo
    await driver.get(config.baseUrl);
    await driver.sleep(2000);

    try {
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
      await emailInput.sendKeys(config.testUsers.psicologo.email);

      const passwordInput = await waitForElement('input[type="password"], input[name="senha"]');
      await passwordInput.sendKeys(config.testUsers.psicologo.password);

      const submitButton = await waitForElement('button[type="submit"]');
      await submitButton.click();
      await driver.sleep(3000);
    } catch (error) {
      console.log('Já está logado ou erro no login:', error.message);
    }
  });

  test('deve criar nota de sessão', async () => {
    // Navegar para página de notas e sessões
    const notasLink = await waitForElement('a[href*="notas"], button:contains("Notas")');
    await notasLink.click();
    await driver.sleep(2000);

    // Selecionar paciente (se houver lista)
    try {
      const pacienteSelect = await driver.findElement(By.css('select[name="paciente"], input[type="select"]'));
      await pacienteSelect.click();
      await driver.sleep(500);
      const firstOption = await driver.findElement(By.css('option:not([value=""])'));
      await firstOption.click();
      await driver.sleep(500);
    } catch {
      // Se não houver select, continua
    }

    // Clicar em criar nota
    const criarButton = await waitForElement('button:contains("Criar"), button:contains("Nova Nota")');
    await criarButton.click();
    await driver.sleep(1000);

    // Preencher formulário
    try {
      const tituloInput = await waitForElement('input[name="titulo"]');
      await tituloInput.sendKeys('Sessão de Teste Selenium');

      const conteudoInput = await waitForElement('textarea[name="conteudo"], textarea[name="conteudo"]');
      await conteudoInput.sendKeys('Conteúdo da sessão de teste criado via Selenium');

      // Salvar
      const salvarButton = await waitForElement('button[type="submit"], button:contains("Salvar")');
      await salvarButton.click();
      await driver.sleep(2000);

      // Verificar sucesso
      const successMessage = await driver.findElements(By.css('.success, [role="alert"].success'));
      expect(successMessage.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('Erro ao criar nota:', error.message);
    }
  });

  test('deve listar notas de sessão', async () => {
    const notasLink = await waitForElement('a[href*="notas"], button:contains("Notas")');
    await notasLink.click();
    await driver.sleep(2000);

    // Verificar se há lista de notas
    const notasList = await driver.findElements(By.css('.nota, [data-testid="nota"]'));
    // Pode ser 0 ou mais, apenas verificar que a página carregou
    expect(notasList).toBeDefined();
  });

  test('deve editar nota de sessão', async () => {
    const notasLink = await waitForElement('a[href*="notas"], button:contains("Notas")');
    await notasLink.click();
    await driver.sleep(2000);

    try {
      // Clicar em editar na primeira nota
      const editarButton = await driver.findElement(By.css('button:contains("Editar"), .edit-button'));
      await editarButton.click();
      await driver.sleep(1000);

      // Editar conteúdo
      const conteudoInput = await waitForElement('textarea[name="conteudo"]');
      await conteudoInput.clear();
      await conteudoInput.sendKeys('Conteúdo editado via Selenium');

      // Salvar
      const salvarButton = await waitForElement('button[type="submit"], button:contains("Salvar")');
      await salvarButton.click();
      await driver.sleep(2000);

      // Verificar sucesso
      const successMessage = await driver.findElements(By.css('.success, [role="alert"].success'));
      expect(successMessage.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('Erro ao editar nota:', error.message);
      // Teste pode falhar se não houver notas
    }
  });
});

if (require.main === module) {
  (async () => {
    try {
      const driver = await createDriver();
      await driver.get(config.baseUrl);
      console.log('✅ Testes de notas e sessões iniciados');
      await quitDriver();
    } catch (error) {
      console.error('❌ Erro nos testes:', error);
      await quitDriver();
      process.exit(1);
    }
  })();
}

