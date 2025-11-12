# 👤 Como Criar um Usuário Administrador

Existem duas formas de criar um usuário admin. Escolha a que preferir:

## Método 1: Via API (Recomendado) ✅

Este é o método mais simples e seguro, pois a senha será criptografada automaticamente.

### Passo 1: Certifique-se de que a API está rodando

```bash
cd PsicoCare-API
npm start
```

### Passo 2: Faça uma requisição POST

Use Postman, Insomnia, curl ou qualquer cliente HTTP:

**URL:** `http://localhost:3000/api/admin/register`

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nome": "Administrador",
  "email": "admin@psicocare.com",
  "senha": "admin123"
}
```

### Exemplo com curl:
```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Administrador","email":"admin@psicocare.com","senha":"admin123"}'
```

### Resposta esperada:
```json
{
  "id": 1,
  "nome": "Administrador",
  "email": "admin@psicocare.com"
}
```

---

## Método 2: Via SQL (Alternativo) 📝

Se preferir criar diretamente no banco de dados:

### Passo 1: Execute o script SQL

Abra o phpMyAdmin ou seu cliente MySQL e execute o arquivo:
```
PsicoCare-API/src/scripts/criar_admin_pronto.sql
```

Ou execute diretamente:

```sql
INSERT INTO administradores (nome, email, senha, data_criacao)
VALUES (
    'Administrador',
    'admin@psicocare.com',
    '$2b$10$WGyzMfgPJUG4mdXbU0.L4eE36F.eqQjajMiPJGLPlUhGy1XANmoxa',
    NOW()
)
ON DUPLICATE KEY UPDATE 
    nome = VALUES(nome),
    senha = VALUES(senha);
```

---

## 🔐 Credenciais Padrão

Após criar o admin usando qualquer um dos métodos acima:

- **Email:** `admin@psicocare.com`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login por segurança!

---

## 🧪 Testar o Login

Após criar o admin, teste o login:

**URL:** `http://localhost:3000/api/admin/login`

**Método:** `POST`

**Body (JSON):**
```json
{
  "email": "admin@psicocare.com",
  "senha": "admin123"
}
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "admin",
  "nome": "Administrador",
  "email": "admin@psicocare.com"
}
```

Use este `token` no header `Authorization: Bearer <token>` para acessar as rotas administrativas.

---

## 🔍 Verificar se o Admin Foi Criado

Execute no MySQL:

```sql
SELECT id, nome, email, data_criacao 
FROM administradores 
WHERE email = 'admin@psicocare.com';
```

---

## 📝 Notas

- O endpoint `/api/admin/register` **não requer autenticação**, então qualquer pessoa pode criar um admin. Em produção, você deve proteger este endpoint ou removê-lo.
- A senha é criptografada automaticamente usando bcrypt (custo 10).
- O email deve ser único (UNIQUE constraint).







