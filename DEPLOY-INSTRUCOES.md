# 🚀 Instruções de Deploy - YuFin Backend e Frontend

## 📋 **PROBLEMA IDENTIFICADO:**

O domínio `yufin.com.br` está funcionando, mas o login falha porque:
- ✅ **Frontend** está hospedado na Vercel
- ❌ **Backend** NÃO está hospedado (ainda aponta para `localhost:3001`)

## 🔧 **CORREÇÕES APLICADAS:**

### ✅ **1. Arquivos Atualizados:**
- `src/utils/apiService.js` → Usa variável de ambiente `VITE_API_URL`
- `src/utils/authService.js` → Usa variável de ambiente para login/registro
- `src/utils/useLessons.js` → Usa variável de ambiente para buscar lições
- `backend/vercel.json` → Configuração do backend para Vercel
- `backend/.vercelignore` → Ignora arquivos desnecessários no deploy
- `env.production` → Define URL do backend em produção

---

## 🎯 **PASSO A PASSO PARA DEPLOY:**

### **ETAPA 1: Deploy do Backend na Vercel**

1. **Abra o terminal no diretório do backend:**
```bash
cd C:\Users\Vinicius\Downloads\YuFin_Fixed_Atualizado\YuFin_Fixed\backend
```

2. **Faça login na Vercel (se ainda não fez):**
```bash
vercel login
```

3. **Inicie o deploy do backend:**
```bash
vercel
```

4. **Responda as perguntas:**
   - `Set up and deploy "backend"?` → **Y** (Yes)
   - `Which scope do you want to deploy to?` → Pressione **Enter** (usa seu usuário)
   - `Link to existing project?` → **N** (No, criar novo)
   - `What's your project's name?` → Digite: **yufin-backend**
   - `In which directory is your code located?` → Pressione **Enter** (usa `.`)

5. **Aguarde o deploy concluir** e **copie a URL** que aparecer (ex: `https://yufin-backend.vercel.app`)

6. **Configure as variáveis de ambiente no Vercel:**
   - Acesse: https://vercel.com/dashboard
   - Clique no projeto **yufin-backend**
   - Vá em **Settings** → **Environment Variables**
   - Adicione:
     - **Name:** `MONGODB_URI`
     - **Value:** (Cole a URL do seu MongoDB Atlas)
     - Clique em **Save**

7. **Faça um novo deploy para aplicar as variáveis:**
```bash
vercel --prod
```

8. **Copie a URL final do backend** (ex: `https://yufin-backend.vercel.app`)

---

### **ETAPA 2: Atualizar Frontend com URL do Backend**

1. **Edite o arquivo `env.production`:**
```bash
cd C:\Users\Vinicius\Downloads\YuFin_Fixed_Atualizado\YuFin_Fixed
```

2. **Abra o arquivo `env.production` e atualize:**
```
VITE_API_URL=https://yufin-backend.vercel.app
```
   ⚠️ **IMPORTANTE:** Substitua pela URL real que você copiou na Etapa 1!

---

### **ETAPA 3: Redeploy do Frontend**

1. **No terminal, ainda no diretório raiz do projeto:**
```bash
cd C:\Users\Vinicius\Downloads\YuFin_Fixed_Atualizado\YuFin_Fixed
```

2. **Faça o build do frontend:**
```bash
npm run build
```

3. **Faça o deploy do frontend:**
```bash
vercel --prod
```

4. **Aguarde o deploy concluir**

---

## ✅ **VERIFICAÇÃO:**

Após concluir todos os passos:

1. **Acesse:** https://yufin.com.br
2. **Tente fazer login** com um usuário existente
3. **Verifique se o login funciona**

---

## 🐛 **TROUBLESHOOTING:**

### **Erro: "CORS error" ou "Network request failed"**
**Solução:** Verifique se o backend está rodando e se a URL em `env.production` está correta.

### **Erro: "MongoDB connection failed"**
**Solução:** Verifique se a variável `MONGODB_URI` está configurada corretamente no Vercel (Settings → Environment Variables).

### **Erro: "Cannot read properties of undefined"**
**Solução:** Limpe o cache do navegador (Ctrl+Shift+Delete) e tente novamente.

---

## 📝 **COMANDOS RESUMIDOS:**

```bash
# Deploy do Backend
cd C:\Users\Vinicius\Downloads\YuFin_Fixed_Atualizado\YuFin_Fixed\backend
vercel --prod

# Atualizar env.production com URL do backend
# (Edite manualmente o arquivo)

# Rebuild e Redeploy do Frontend
cd C:\Users\Vinicius\Downloads\YuFin_Fixed_Atualizado\YuFin_Fixed
npm run build
vercel --prod
```

---

## 🎉 **RESULTADO ESPERADO:**

Após seguir todos os passos:
- ✅ Frontend funcionando em `https://yufin.com.br`
- ✅ Backend funcionando em `https://yufin-backend.vercel.app`
- ✅ Login, registro e todas as funcionalidades operacionais
- ✅ Dados salvos no MongoDB Atlas

---

## 📞 **SUPORTE:**

Se encontrar algum problema, verifique:
1. **Console do navegador** (F12) para erros JavaScript
2. **Logs do Vercel** em https://vercel.com/dashboard
3. **Status do MongoDB Atlas** em https://cloud.mongodb.com

Boa sorte! 🚀







