module.exports = {
  // URL base da aplicação web
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:8081',
  
  // Timeout padrão para operações (em ms)
  timeout: 10000,
  
  // Configurações do navegador
  browser: process.env.TEST_BROWSER || 'chrome', // 'chrome' ou 'firefox'
  
  // Credenciais de teste
  testUsers: {
    paciente: {
      email: process.env.TEST_USER_EMAIL || 'teste@teste.com',
      password: process.env.TEST_USER_PASSWORD || 'senha123',
    },
    psicologo: {
      email: process.env.TEST_PSICOLOGO_EMAIL || 'psicologo@teste.com',
      password: process.env.TEST_PSICOLOGO_PASSWORD || 'senha123',
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin@teste.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'senha123',
    },
  },
  
  // Headless mode (sem interface gráfica)
  headless: process.env.HEADLESS === 'true',
};

