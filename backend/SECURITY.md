# 🔐 GUIA DE SEGURANÇA - YüFin Backend

## ✅ MELHORIAS IMPLEMENTADAS

### 1. **Bcrypt para Senhas** ✅
- Todas as senhas agora são criptografadas com bcrypt
- Salt rounds: 10 (equilíbrio entre segurança e performance)
- **NUNCA** mais armazenar senhas em texto plano!

### 2. **JWT Authentication** ✅
- Sistema completo de tokens JWT
- Tokens expiram em 7 dias (configurável)
- Middleware de autenticação em rotas críticas
- Tokens no formato: `Bearer <token>`

### 3. **Middlewares de Proteção** ✅
- `authenticateToken`: Verifica se o usuário está autenticado
- `authorizeRoles`: Verifica permissões por role
- `authorizeOwner`: Garante acesso apenas aos próprios dados

### 4. **Validação com Joi** ✅
- Validação de dados em endpoints críticos
- Sanitização automática de inputs
- Mensagens de erro padronizadas

### 5. **CORS Restrito** ✅
- Whitelist rigorosa de origins
- Apenas origins permitidas têm acesso
- Modo dev separado para testes locais

### 6. **LGPD Compliant** ✅
- Endpoint de exclusão de dados (Art. 18 LGPD)
- Endpoint de exportação de dados (portabilidade)
- Termo de consentimento parental obrigatório
- Política de privacidade e termos de uso

---

## 🚀 COMO USAR AS NOVAS ROTAS

### **Login (COM SEGURANÇA)**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "aluno@example.com",
  "password": "senha123",
  "role": "student"
}

# Resposta:
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### **Registro (COM BCRYPT + LGPD)**
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "role": "student",
  "gradeId": "6º Ano",
  "parentConsent": true  # OBRIGATÓRIO para estudantes!
}

# Resposta:
{
  "message": "Cadastro realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### **Acessar Rotas Protegidas**
```bash
GET /users/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# O middleware authenticateToken valida automaticamente!
```

### **Excluir Conta (LGPD)**
```bash
DELETE /lgpd/delete-account/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "confirmPassword": "senha123"
}
```

### **Exportar Dados (LGPD)**
```bash
GET /lgpd/export-data/123
Authorization: Bearer <token>

# Retorna TODOS os dados do usuário em JSON
```

---

## 🔧 CONFIGURAÇÃO

### **1. Variáveis de Ambiente**
Crie um arquivo `.env` na raiz do backend:

```env
# Crítico para segurança!
JWT_SECRET=seu_segredo_super_forte_aqui_nunca_compartilhe

# Banco de dados
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/yufin

# Ambiente
NODE_ENV=production

# Token expira em:
JWT_EXPIRES_IN=7d
```

**⚠️ GERAR JWT_SECRET FORTE:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **2. Instalar Dependências**
```bash
cd backend
npm install bcrypt jsonwebtoken joi
```

### **3. Rodar Backend**
```bash
npm start
```

---

## 📋 CHECKLIST DE SEGURANÇA

### **URGENTE** ✅
- [x] Bcrypt para senhas
- [x] JWT authentication
- [x] Middleware de proteção de rotas
- [x] CORS restrito
- [x] Validação com Joi
- [x] Endpoint de exclusão LGPD
- [x] Termo de consentimento

### **IMPORTANTE** ⚠️
- [ ] Rate limiting (prevenir DDoS)
- [ ] Helmet.js (security headers)
- [ ] Logs estruturados (Winston/Pino)
- [ ] Monitoramento (Sentry)
- [ ] Backup automático do banco
- [ ] SSL/TLS em produção

### **DESEJÁVEL** 📝
- [ ] Refresh tokens
- [ ] 2FA (autenticação em 2 fatores)
- [ ] Captcha no registro
- [ ] Audit logs (LGPD Art. 37)
- [ ] Encryption at rest

---

## ⚠️ ENDPOINTS DEPRECIADOS

**NÃO USE MAIS:**
- `POST /login` → Use `POST /auth/login`
- `POST /register` → Use `POST /auth/register`

Esses endpoints antigos retornam **410 Gone** e não são seguros!

---

## 🛡️ BOAS PRÁTICAS

### **1. Senhas**
- Mínimo 6 caracteres (recomendado: 8+)
- Sempre usar bcrypt (NUNCA texto plano)
- Validar força no frontend antes de enviar

### **2. Tokens**
- Armazenar no localStorage com cuidado
- Incluir em TODAS as requisições protegidas
- Implementar refresh tokens para melhor UX

### **3. LGPD**
- Consentimento parental OBRIGATÓRIO para menores
- Permitir exclusão de dados a qualquer momento
- Manter logs de auditoria
- Responder solicitações em até 15 dias

### **4. Produção**
- SEMPRE usar HTTPS (SSL/TLS)
- Configurar variáveis de ambiente no Vercel
- Monitorar logs de segurança
- Fazer backups regulares

---

## 📞 CONTATO

Dúvidas sobre segurança:
- Email: security@yufin.com.br
- GitHub Issues: https://github.com/ViniYuFin/YuFin/issues

**Vulnerabilidades?** Reporte via email com [SECURITY] no assunto.

---

**Última atualização:** 13 de Outubro de 2025
**Versão:** 2.0 (Seguro)

