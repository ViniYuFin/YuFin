# 🔐 GUIA COMPLETO DE SEGURANÇA - YuFin Backend

## 📋 Resumo das Implementações

Este documento detalha todas as melhorias de segurança implementadas no backend do YuFin.

---

## ✅ IMPLEMENTAÇÕES CONCLUÍDAS

### 1. **Sistema de Autenticação JWT Aprimorado** 🔑

#### Access Tokens (Curta Duração)
- **Duração:** 15 minutos
- **Uso:** Autenticação de requests API
- **Armazenamento:** localStorage (frontend)
- **Renovação:** Automática via refresh token

#### Refresh Tokens (Longa Duração)
- **Duração:** 30 dias
- **Uso:** Renovar access tokens expirados
- **Armazenamento:** MongoDB + cookie httpOnly
- **Revogável:** Sim, individual ou em massa

#### Recursos
- ✅ Rotação automática de tokens
- ✅ Rastreamento de dispositivos
- ✅ Logout de todos os dispositivos
- ✅ Visualizar sessões ativas
- ✅ Revogar sessões individuais

**Arquivo:** `models/RefreshToken.js`, `utils/jwt.js`, `routes/token.js`

---

### 2. **Rate Limiting Completo** 🚦

#### Limites Implementados

| Rota | Limite | Janela | Proteção |
|------|--------|--------|----------|
| **Geral** | 100 req | 15 min | Abuse geral |
| **Login** | 5 tentativas | 15 min | Brute force |
| **Registro** | 3 cadastros | 1 hora | Spam de contas |
| **LGPD** | 2 exportações | 1 hora | Abuse de dados |
| **API** | 200 req | 15 min | Sobrecarga |

#### Recursos
- ✅ Bloqueio automático por IP
- ✅ Headers de retry-after
- ✅ Logs de tentativas excessivas
- ✅ Whitelist de IPs (opcional)

**Arquivo:** `middleware/security.js`

---

### 3. **Helmet - Headers de Segurança** 🛡️

#### Headers Configurados

```http
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

#### Proteções
- ✅ Clickjacking (X-Frame-Options)
- ✅ MIME Sniffing (X-Content-Type-Options)
- ✅ XSS (Content-Security-Policy)
- ✅ HTTPS obrigatório (HSTS)

**Arquivo:** `middleware/security.js`

---

### 4. **Sanitização de Dados** 🧼

#### Proteções Implementadas

##### NoSQL Injection
```javascript
// BLOQUEADO:
{ "email": { "$gt": "" } }
{ "password": { "$ne": null } }

// Caracteres removidos: $, ., <, >, {, }
```

##### XSS (Cross-Site Scripting)
```javascript
// BLOQUEADO:
<script>alert('XSS')</script>
javascript:alert(1)
onerror="alert(1)"
```

##### HPP (HTTP Parameter Pollution)
```javascript
// BLOQUEADO:
?sort=name&sort=date&sort=price
```

**Arquivo:** `middleware/security.js`

---

### 5. **Índices Otimizados no MongoDB** 📊

#### Índices Criados

##### Users
- email (unique)
- playerId (unique, sparse)
- role + schoolId
- gradeId
- classId
- progress.totalXp (desc) - para rankings
- progress.level (desc)
- progress.currentStreak (desc)
- progress.lastActivityDate
- gradeProgression (requests)

##### Lessons
- gradeId + module
- gradeId + module + order
- type
- isActive
- difficulty

##### RefreshTokens
- token (unique)
- userId
- userId + isRevoked + expiresAt
- expiresAt (TTL - expiração automática)
- deviceInfo.ip

##### Classes, Grades, RegistrationTokens
- Índices específicos para cada coleção

**Script:** `scripts/create-indexes.js`

**Como rodar:**
```bash
cd backend
node scripts/create-indexes.js
```

---

## 🚀 COMO USAR O NOVO SISTEMA

### 1. **Login com Refresh Tokens**

#### Request
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "student"
}
```

#### Response
```json
{
  "message": "Login realizado com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": { ... }
}
```

#### O que fazer no frontend:
```javascript
// Salvar tokens
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Usar access token em requests
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
```

---

### 2. **Renovar Access Token**

#### Quando renovar?
- Access token expira em 15 minutos
- Renovar automaticamente quando expirar
- Ou renovar antes (quando < 5 minutos para expirar)

#### Request
```http
POST /token/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Response
```json
{
  "accessToken": "novo-access-token",
  "refreshToken": "novo-refresh-token",
  "expiresIn": 900,
  "message": "Token renovado com sucesso"
}
```

#### Implementação no frontend:
```javascript
// Interceptor do Axios
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expirado, tentar renovar
      const refreshToken = localStorage.getItem('refreshToken');
      
      try {
        const { data } = await axios.post('/token/refresh', { refreshToken });
        
        // Salvar novos tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Retentar request original
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Refresh falhou, fazer logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

### 3. **Logout**

#### Logout de um dispositivo
```http
POST /token/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout de TODOS os dispositivos
```http
POST /token/logout-all
Authorization: Bearer <access-token>
```

---

### 4. **Gerenciar Sessões Ativas**

#### Listar sessões
```http
GET /token/active-sessions
Authorization: Bearer <access-token>
```

#### Response
```json
{
  "activeSessions": 3,
  "sessions": [
    {
      "id": "session-id-1",
      "device": "mobile",
      "browser": "Chrome",
      "ip": "192.168.1.1",
      "createdAt": "2025-01-01T10:00:00Z",
      "lastUsedAt": "2025-01-14T15:30:00Z",
      "expiresAt": "2025-02-01T10:00:00Z"
    },
    ...
  ]
}
```

#### Revogar sessão específica
```http
DELETE /token/revoke-session/:sessionId
Authorization: Bearer <access-token>
```

---

## 🛡️ BOAS PRÁTICAS DE SEGURANÇA

### Para Desenvolvimento

1. **Nunca commitar secrets**
```bash
# Adicionar ao .gitignore
.env
.env.local
.env.production
```

2. **Usar .env separados por ambiente**
```bash
.env.development  # Desenvolvimento local
.env.staging      # Homologação
.env.production   # Produção
```

3. **Gerar secrets fortes**
```bash
# Linux/Mac
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

4. **Testar rate limiting localmente**
```bash
# Fazer 10 requests rápidas
for i in {1..10}; do curl http://localhost:3001/auth/login -X POST; done
```

---

### Para Produção

1. **Variáveis de ambiente obrigatórias**
```bash
JWT_SECRET=<secret-forte-64-chars>
REFRESH_SECRET=<secret-diferente-64-chars>
MONGODB_URI=<mongodb-atlas-uri>
NODE_ENV=production
```

2. **Configurar CORS corretamente**
```javascript
// Apenas origins de produção
const allowedOrigins = [
  'https://yufin.com.br',
  'https://www.yufin.com.br'
];
```

3. **Habilitar HTTPS**
- Vercel/Netlify: Automático
- VPS: Usar Let's Encrypt + Certbot

4. **Monitoramento**
- Sentry para erros
- MongoDB Atlas monitoring
- Uptime Robot para disponibilidade

5. **Backup**
- MongoDB Atlas: Backup automático diário
- Exportar refresh tokens críticos

---

## 🔍 LOGS E MONITORAMENTO

### Eventos Logados

```javascript
// Login bem-sucedido
✅ Login bem-sucedido: user@example.com (student)

// Brute force detectado
🚨 Possível ataque de brute force: 192.168.1.1 - user@example.com

// Rate limit atingido
⚠️ Rate limit atingido: 192.168.1.1

// NoSQL injection detectada
⚠️ Tentativa de NoSQL injection detectada: password em /auth/login

// Token revogado
🔒 Revogados 3 tokens do usuário 64abc...

// Limpeza de tokens
🧹 Limpeza de tokens: 127 removidos
```

### Análise de Logs

```bash
# Ver logs em tempo real
tail -f logs/security.log

# Contar tentativas de brute force
grep "brute force" logs/security.log | wc -l

# IPs mais ativos
grep "Rate limit" logs/security.log | awk '{print $5}' | sort | uniq -c | sort -nr
```

---

## 📊 MÉTRICAS DE SEGURANÇA

### KPIs Recomendados

| Métrica | Objetivo | Como Medir |
|---------|----------|------------|
| **Tentativas de brute force** | < 10/dia | Logs |
| **Rate limits atingidos** | < 100/dia | Logs |
| **Tokens revogados** | < 5% do total | MongoDB |
| **Sessões ativas/usuário** | < 3 | RefreshToken.count |
| **Tempo de resposta** | < 200ms | Sentry/New Relic |

---

## 🚨 INCIDENTES E RESPOSTA

### Possíveis Incidentes

#### 1. **Ataque de Brute Force**
**Sintomas:**
- Muitos 429 (Rate Limit) em /auth/login
- Logs repetidos de "brute force"

**Resposta:**
1. Identificar IPs atacantes nos logs
2. Bloquear IPs no firewall/Cloudflare
3. Reduzir rate limit temporariamente
4. Notificar usuários afetados

#### 2. **Token Roubado**
**Sintomas:**
- Usuário reporta atividade suspeita
- Múltiplos IPs para mesmo usuário

**Resposta:**
1. Revogar todos os tokens do usuário:
```bash
POST /token/logout-all
Authorization: Bearer <token-do-usuario>
```
2. Forçar troca de senha
3. Investigar como token vazou

#### 3. **Banco de Dados Comprometido**
**Resposta:**
1. Revogar TODOS os refresh tokens:
```javascript
await RefreshToken.updateMany({}, { isRevoked: true });
```
2. Forçar logout de todos
3. Resetar secrets (JWT_SECRET, REFRESH_SECRET)
4. Notificar usuários via email

---

## 🔧 MANUTENÇÃO

### Tarefas Periódicas

#### Diária
- [ ] Verificar logs de segurança
- [ ] Monitorar rate limits
- [ ] Verificar tentativas de brute force

#### Semanal
- [ ] Limpar tokens expirados:
```javascript
await RefreshToken.cleanExpired();
```
- [ ] Revisar sessões ativas incomuns
- [ ] Verificar performance de índices

#### Mensal
- [ ] Atualizar dependências:
```bash
npm audit
npm update
```
- [ ] Revisar logs de NoSQL injection
- [ ] Analisar métricas de segurança

#### Anual
- [ ] Rotacionar secrets
- [ ] Auditoria de segurança externa
- [ ] Revisar policies e procedures

---

## 📚 REFERÊNCIAS

### Documentação
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### Ferramentas
- [Helmet.js](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Mongo Sanitize](https://github.com/fiznool/express-mongo-sanitize)

---

## 💬 CONTATO

Dúvidas sobre segurança:
- **DPO:** dpo@yufin.com.br
- **Suporte Técnico:** tech@yufin.com.br
- **Reporte de Vulnerabilidades:** security@yufin.com.br

---

**Última Atualização:** 14 de Outubro de 2025  
**Versão:** 2.0.0


