# Instruções para Adicionar a Logo do PsicoCare

## Como adicionar a imagem da logo

1. **Salve a imagem da logo** no diretório:
   ```
   PsicoCare/assets/images/logo.png
   ```

2. **Formatos suportados:**
   - `logo.png` (recomendado)
   - `logo.jpg`
   - `psicocare-logo.png`

3. **Tamanho recomendado:**
   - Para melhor qualidade, use uma imagem com pelo menos 400x300 pixels
   - O componente ajusta automaticamente o tamanho conforme necessário

4. **Após adicionar a imagem:**
   - O componente `Logo.tsx` detectará automaticamente a imagem
   - Se a imagem não for encontrada, será exibido um fallback visual

## Onde a logo aparece

- ✅ Tela de Login (tamanho: large)
- ✅ Tela de Registro (tamanho: medium)
- ✅ AppHeader (opcional, tamanho: small)

## Como usar o componente Logo

```tsx
import Logo from '../components/Logo';

// Logo pequena
<Logo size="small" showText={true} />

// Logo média
<Logo size="medium" showText={true} />

// Logo grande
<Logo size="large" showText={true} />

// Apenas a imagem (sem texto)
<Logo size="medium" showText={false} />
```










