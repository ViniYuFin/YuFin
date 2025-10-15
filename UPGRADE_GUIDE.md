# 🚀 GUIA DE UPGRADE - YuFin 2.0

## 📋 O QUE FOI IMPLEMENTADO

### ✅ Segurança (CRÍTICO)
- 🔐 Sistema de refresh tokens
- 🚦 Rate limiting completo
- 🛡️ Helmet (headers de segurança)
- 🧼 Sanitização de dados (NoSQL injection)
- 🔍 Logger de segurança

### ⚡ Performance
- 📊 Índices otimizados no MongoDB
- 💾 Estrutura para cache (pronta para implementar)

### 📚 Documentação
- 📖 Guia completo de segurança
- 📝 .env.example atualizado
- 🔧 Scripts de manutenção

---

## 🔧 PASSO A PASSO DE ATUALIZAÇÃO

### 1️⃣ **Instalar Novas Dependências**

```bash
cd backend
npm install helmet express-rate-limit express-mongo-sanitize hpp cookie-parser
```

**Resultado esperado:**
```
added 14 packages
```

---

### 2️⃣ **Atualizar Variáveis de Ambiente**

Copie o arquivo `env.example.txt` e renomeie para `.env`, depois adicione:

```bash
# ADICIONAR ao seu .env existente:

# JWT Secrets (GERE NOVOS VALORES!)
JWT_SECRET=seu-secret-aqui-64-caracteres
REFRESH_SECRET=outro-secret-diferente-64-caracteres

# Duração dos tokens
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=30d

# Rate Limiting (opcional, já tem defaults)
RATE_LIMIT_GENERAL=100
RATE_LIMIT_LOGIN=5
RATE_LIMIT_REGISTER=3
```

**Como gerar secrets fortes:**
```bash
# No terminal (Linux/Mac/Git Bash)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

### 3️⃣ **Criar Índices no MongoDB**

```bash
cd backend
node scripts/create-indexes.js
```

**Resultado esperado:**
```
🔌 Conectando ao MongoDB...
✅ Conectado ao MongoDB

📊 Criando índices de Users...
  ✅ email (unique)
  ✅ playerId (unique, sparse)
  ✅ role + schoolId
  ...
✅ Todos os índices foram criados com sucesso!
```

⏱️ **Tempo estimado:** 30-60 segundos

---

### 4️⃣ **Atualizar Frontend (Cliente)**

#### A) **Atualizar Lógica de Auth**

Edite seu arquivo de autenticação (ex: `src/utils/auth.js`):

```javascript
// ANTES
const response = await axios.post('/auth/login', { email, password, role });
localStorage.setItem('token', response.data.token);

// DEPOIS
const response = await axios.post('/auth/login', { email, password, role });
localStorage.setItem('accessToken', response.data.accessToken);
localStorage.setItem('refreshToken', response.data.refreshToken);
```

#### B) **Adicionar Interceptor para Refresh Token**

Crie `src/utils/axios-interceptor.js`:

```javascript
import axios from 'axios';

// Interceptor para renovar token automaticamente
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Se token expirou e ainda não tentou refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/token/refresh', { refreshToken });

        // Salvar novos tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Atualizar header e retentar
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, fazer logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
```

#### C) **Atualizar Imports**

Em todos os arquivos que usam axios:

```javascript
// ANTES
import axios from 'axios';

// DEPOIS
import axios from './utils/axios-interceptor';
```

---

### 5️⃣ **Testar o Sistema**

#### A) **Health Check**
```bash
curl https://yufin-backend.vercel.app/health
```

**Resultado esperado:**
```json
{
  "status": "OK",
  "version": "2.0.0",
  "security": {
    "helmet": "✅",
    "rateLimit": "✅",
    "sanitization": "✅",
    "refreshTokens": "✅"
  }
}
```

#### B) **Testar Login**
```bash
curl -X POST https://yufin-backend.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

**Resultado esperado:**
```json
{
  "message": "Login realizado com sucesso",
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 900,
  "user": { ... }
}
```

#### C) **Testar Rate Limiting**
```bash
# Fazer 10 requests rápidas (deve bloquear após 5)
for i in {1..10}; do 
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'; 
done
```

**Resultado esperado:** Após 5 tentativas, erro 429:
```json
{
  "error": "Muitas tentativas de login. Aguarde 15 minutos.",
  "code": "LOGIN_RATE_LIMIT_EXCEEDED"
}
```

---

## 🚀 DEPLOY EM PRODUÇÃO

### Vercel (Recomendado)

#### 1. **Atualizar Variáveis de Ambiente**

No dashboard da Vercel:
1. Acesse seu projeto backend
2. Settings → Environment Variables
3. Adicione:

```
JWT_SECRET=<gerar-novo-64-chars>
REFRESH_SECRET=<gerar-outro-64-chars>
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=30d
MONGODB_URI=<sua-uri-mongodb-atlas>
NODE_ENV=production
```

#### 2. **Deploy**

```bash
cd backend
git add .
git commit -m "feat: implementar segurança 2.0 com refresh tokens"
git push
```

Vercel fará deploy automático! 🎉

#### 3. **Rodar Script de Índices**

```bash
# Localmente, apontando para produção
MONGODB_URI=<mongodb-production-uri> node scripts/create-indexes.js
```

---

## ⚠️ POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema 1: "Module not found: helmet"
**Solução:**
```bash
cd backend
npm install
```

### Problema 2: "JWT_SECRET is not defined"
**Solução:**
- Verificar se `.env` existe no backend
- Verificar se variáveis estão configuradas na Vercel

### Problema 3: "Token inválido após atualização"
**Solução:**
- Tokens antigos não são compatíveis
- Usuários precisam fazer logout/login novamente
- OPCIONAL: Manter compatibilidade temporária

### Problema 4: Rate limit bloqueando desenvolvimento
**Solução:**
```javascript
// Em desenvolvimento, aumentar limites
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 5
});
```

### Problema 5: "RefreshToken is not defined"
**Solução:**
```bash
# Verificar se o model foi importado
# backend/index.js
const RefreshToken = require('./models/RefreshToken');
```

---

## 🔄 ROLLBACK (Se Necessário)

Se algo der errado, você pode voltar à versão anterior:

### 1. **Reverter Código**
```bash
git revert HEAD
git push
```

### 2. **Remover Índices (Se Necessário)**
```javascript
// No MongoDB Compass ou shell
db.refreshtokens.drop()
db.users.dropIndex("progress.totalXp_-1")
// etc...
```

### 3. **Restaurar .env Antigo**
```bash
cp .env.backup .env
```

---

## 📊 CHECKLIST PÓS-ATUALIZAÇÃO

- [ ] Backend rodando sem erros
- [ ] Health check retorna "security": { ... }
- [ ] Login funciona e retorna accessToken + refreshToken
- [ ] Refresh token renova access token
- [ ] Rate limiting funciona (testar brute force)
- [ ] Índices criados no MongoDB
- [ ] Frontend atualizado com interceptor
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy em produção OK
- [ ] Testes manuais de login/logout
- [ ] Monitoramento de erros ativo

---

## 💡 PRÓXIMOS PASSOS RECOMENDADOS

### Curto Prazo (1-2 semanas)
- [ ] Implementar Sentry para monitoramento
- [ ] Adicionar testes automatizados
- [ ] Configurar PWA no frontend
- [ ] Implementar modo escuro

### Médio Prazo (1-2 meses)
- [ ] Adicionar notificações push
- [ ] Implementar sistema de cache (Redis)
- [ ] Criar dashboard de analytics
- [ ] Adicionar 2FA (autenticação de 2 fatores)

---

## 📞 SUPORTE

Problemas durante a atualização?

1. **Verificar logs:**
   ```bash
   # Vercel
   vercel logs
   
   # Local
   npm start --prefix backend
   ```

2. **Consultar documentação:**
   - `SECURITY_GUIDE.md` - Guia completo de segurança
   - `env.example.txt` - Variáveis de ambiente

3. **Issues conhecidas:**
   - Verificar [SECURITY_GUIDE.md](./backend/SECURITY_GUIDE.md) seção "Incidentes"

---

## ✅ CONCLUSÃO

Parabéns! 🎉 Seu backend YuFin agora está com:
- ✅ Segurança de nível profissional
- ✅ Sistema de tokens moderno
- ✅ Proteção contra ataques
- ✅ Performance otimizada
- ✅ Pronto para escalar!

**Tempo total estimado de upgrade:** 30-60 minutos

---

**Versão:** 2.0.0  
**Data:** 14 de Outubro de 2025  
**Autor:** YuFin Team


