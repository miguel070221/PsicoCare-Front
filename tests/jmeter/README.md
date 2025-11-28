# Testes de Carga com JMeter

Este diretório contém os planos de teste JMeter para testar a performance e carga da API do PsicoCare.

## Pré-requisitos

1. **Java JDK 8+** instalado
   - Verificar: `java -version`

2. **Apache JMeter** instalado
   - Download: https://jmeter.apache.org/download_jmeter.cgi
   - Extrair e adicionar ao PATH (opcional)

3. **API rodando**
   - A API deve estar rodando em `http://localhost:3333`

## Como Usar

### Opção 1: Interface Gráfica (GUI)

1. Abrir JMeter:
   ```bash
   jmeter
   ```

2. Abrir o plano de teste:
   - File → Open → Selecionar `psicocare-api-load-test.jmx`

3. Configurar variáveis (se necessário):
   - Thread Group → User Defined Variables
   - Ajustar `API_BASE_URL` se a API estiver em outro endereço

4. Executar:
   - Clique no botão "Start" (▶️) na barra de ferramentas
   - Ou: Run → Start

5. Ver resultados:
   - View Results Tree: Ver requisições individuais
   - Summary Report: Ver estatísticas gerais
   - Graph Results: Ver gráficos de performance

### Opção 2: Linha de Comando (CLI)

```bash
# Executar teste sem GUI (mais rápido)
jmeter -n -t psicocare-api-load-test.jmx -l results/results.jtl -e -o results/report/

# Com mais threads (usuários simultâneos)
jmeter -n -t psicocare-api-load-test.jmx -l results/results.jtl -e -o results/report/ -Jthreads=50

# Com duração específica (em segundos)
jmeter -n -t psicocare-api-load-test.jmx -l results/results.jtl -e -o results/report/ -Jduration=300
```

### Opção 3: Script PowerShell (Windows)

```powershell
.\run-load-test.ps1
```

## Estrutura do Plano de Teste

O plano de teste inclui:

1. **Thread Group**: Configuração de usuários simultâneos
   - Número de threads (usuários)
   - Ramp-up period (tempo para iniciar todos os usuários)
   - Loop count (quantas vezes cada usuário executa o teste)

2. **HTTP Request Defaults**: Configuração base da API
   - Server Name: localhost
   - Port: 3333
   - Protocol: http

3. **Grupos de Teste**:
   - **Autenticação**: Login de pacientes, psicólogos e admin
   - **Agendamentos**: Criar, listar, atualizar, deletar
   - **Acompanhamentos**: Criar, listar, atualizar, deletar
   - **Notas e Sessões**: Criar, listar, atualizar, deletar
   - **Avaliações**: Criar e listar

4. **Listeners**: Para visualizar resultados
   - View Results Tree
   - Summary Report
   - Graph Results

## Configurações Recomendadas

### Teste Leve (Desenvolvimento)
- Threads: 10
- Ramp-up: 10 segundos
- Loop: 1

### Teste Médio (QA)
- Threads: 50
- Ramp-up: 30 segundos
- Loop: 5

### Teste Pesado (Produção)
- Threads: 100
- Ramp-up: 60 segundos
- Loop: 10

## Interpretando Resultados

### Métricas Importantes

- **Samples**: Número total de requisições
- **Average**: Tempo médio de resposta (ms)
- **Min/Max**: Tempo mínimo/máximo de resposta
- **Error %**: Percentual de erros
- **Throughput**: Requisições por segundo
- **KB/sec**: Taxa de transferência

### Valores Esperados

- **Tempo médio de resposta**: < 500ms (ideal)
- **Taxa de erro**: < 1%
- **Throughput**: Depende da capacidade do servidor

## Troubleshooting

### Erro: "Address already in use"
- A porta 3333 já está em uso
- Parar outros processos ou mudar a porta da API

### Erro: "Connection refused"
- API não está rodando
- Verificar se a API está em `http://localhost:3333`

### Testes muito lentos
- Reduzir número de threads
- Aumentar ramp-up period
- Verificar recursos do servidor (CPU, memória)

## Notas

- Os testes usam tokens de autenticação mockados
- Para testes reais, você pode configurar um CSV com credenciais válidas
- Os dados de teste são criados e deletados durante a execução
- Certifique-se de ter um banco de dados de teste separado

