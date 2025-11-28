# Testes do PsicoCare

Este diretório contém todos os testes do projeto, organizados por tipo de teste.

## Estrutura

```
tests/
├── jest/              # Testes unitários e de integração (Jest)
├── selenium/          # Testes end-to-end para versão web (Selenium)
└── jmeter/            # Testes de carga/performance da API (JMeter)
```

## Como Executar

### Jest (Testes Unitários)

```bash
# Instalar dependências (se ainda não instalou)
npm install

# Executar todos os testes
npm test

# Executar testes em modo watch
npm test -- --watch

# Executar testes com cobertura
npm test -- --coverage

# Executar um arquivo específico
npm test -- api.test.ts
```

### Selenium (Testes E2E Web)

```bash
# Instalar dependências do Selenium (se ainda não instalou)
cd tests/selenium
npm install

# Executar todos os testes
npm test

# Executar um teste específico
npm test -- login.test.js
```

**Pré-requisitos:**
- Node.js instalado
- Chrome ou Firefox instalado
- ChromeDriver ou GeckoDriver (instalado automaticamente via selenium-webdriver)

### JMeter (Testes de Carga)

```bash
# Abrir JMeter GUI
jmeter

# Ou executar via linha de comando (sem GUI)
jmeter -n -t tests/jmeter/psicocare-api-load-test.jmx -l results.jtl -e -o report/
```

**Pré-requisitos:**
- Java JDK 8+ instalado
- Apache JMeter instalado
- API rodando em http://localhost:3333

## Estrutura dos Testes

### Jest
- `unit/` - Testes unitários de funções puras
- `integration/` - Testes de integração
- `components/` - Testes de componentes React Native
- `utils/` - Testes de utilitários

### Selenium
- `flows/` - Fluxos completos de usuário
- `pages/` - Page Objects para organização
- `helpers/` - Funções auxiliares

### JMeter
- `psicocare-api-load-test.jmx` - Plano de teste principal
- `results/` - Resultados dos testes (gerado automaticamente)

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.test` na raiz do projeto:

```env
EXPO_PUBLIC_API_URL=http://localhost:3333
TEST_USER_EMAIL=teste@teste.com
TEST_USER_PASSWORD=senha123
TEST_PSICOLOGO_EMAIL=psicologo@teste.com
TEST_PSICOLOGO_PASSWORD=senha123
```

## Cobertura de Testes

Os testes Jest geram relatórios de cobertura em `coverage/`. Abra `coverage/lcov-report/index.html` no navegador para ver o relatório detalhado.

## Notas

- Os testes Selenium assumem que a aplicação web está rodando em `http://localhost:8081` (porta padrão do Expo Web)
- Os testes JMeter assumem que a API está rodando em `http://localhost:3333`
- Certifique-se de que o banco de dados de teste está configurado antes de executar os testes

