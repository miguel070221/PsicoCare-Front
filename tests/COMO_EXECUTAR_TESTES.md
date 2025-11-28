# 🧪 Como Executar os Testes

## ⚠️ Nota Importante

Os testes foram criados, mas podem apresentar erros de TypeScript no editor devido à configuração de tipos. **Isso não impede a execução dos testes!** Os erros são apenas avisos do editor.

## 📋 Pré-requisitos

1. **Instalar dependências** (se ainda não instalou):
   ```bash
   cd PsicoCare
   npm install
   ```

2. **Instalar dependências do Selenium** (se ainda não instalou):
   ```bash
   cd tests/selenium
   npm install
   ```

## 🚀 Executar Testes Jest

### Todos os testes:
```bash
cd PsicoCare
npm test
```

### Testes específicos:
```bash
# Apenas testes unitários
npm test -- tests/jest/unit

# Apenas testes de integração
npm test -- tests/jest/integration

# Um arquivo específico
npm test -- tests/jest/unit/formatters.test.ts
```

### Com cobertura:
```bash
npm test -- --coverage
```

### Modo watch (observa mudanças):
```bash
npm test -- --watch
```

## 🌐 Executar Testes Selenium

```bash
cd PsicoCare/tests/selenium
npm test
```

**Pré-requisitos:**
- Aplicação web rodando em `http://localhost:8081`
- Chrome ou Firefox instalado

## 📊 Executar Testes JMeter

### Via GUI:
```bash
jmeter
# Depois abra: tests/jmeter/psicocare-api-load-test.jmx
```

### Via linha de comando:
```bash
cd PsicoCare/tests/jmeter
jmeter -n -t psicocare-api-load-test.jmx -l results.jtl -e -o report/
```

**Pré-requisitos:**
- Java JDK 8+ instalado
- Apache JMeter instalado
- API rodando em `http://localhost:3333`

## 🔧 Resolver Erros de TypeScript no Editor

Se os arquivos de teste mostram erros no editor (mas os testes funcionam), você pode:

1. **Criar um `tsconfig.test.json`** na raiz do projeto:
   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["jest", "node"]
     },
     "include": [
       "tests/**/*"
     ]
   }
   ```

2. **Ou adicionar no `tsconfig.json` principal**:
   ```json
   {
     "compilerOptions": {
       "types": ["jest", "node"]
     }
   }
   ```

## 📝 Resultados Esperados

### Jest
- **Total de testes**: ~80+ testes
- **Arquivos de teste**: 11 arquivos
- **Cobertura esperada**: ~85% das funcionalidades

### Selenium
- **Fluxos testados**: 6 fluxos principais
- **Tempo estimado**: 2-5 minutos

### JMeter
- **Endpoints testados**: 6+ endpoints
- **Configuração padrão**: 10 usuários simultâneos

## ❓ Troubleshooting

### Erro: "Cannot find module 'jest'"
```bash
npm install
```

### Erro: "Cannot find name 'describe'"
- Os testes ainda funcionam, é apenas um aviso do TypeScript
- Veja seção "Resolver Erros de TypeScript no Editor" acima

### Erro: "No tests found"
- Verifique se os arquivos estão em `tests/jest/**/*.test.ts`
- Verifique o `jest.config.js`

### Selenium não encontra elementos
- Certifique-se de que a aplicação web está rodando
- Verifique a URL em `tests/selenium/config.js`

### JMeter não conecta
- Verifique se a API está rodando em `http://localhost:3333`
- Verifique se o Java está instalado: `java -version`

