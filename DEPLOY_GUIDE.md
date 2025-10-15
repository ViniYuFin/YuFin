# 🚀 Guia de Deploy - YüFin (Projetos Separados)

## 📋 Estrutura Final
```
🌐 Landing Page: yufin.com.br
⚛️ App React: app.yufin.com.br
```

## 🎯 Deploy da Landing Page (yufin.com.br)

### Passo 1: Preparar Landing Page
```bash
# A pasta public-landing/ já está pronta com:
# ✅ index-clean.html (página principal)
# ✅ planos.html (página de planos)
# ✅ sobre-contato.html
# ✅ css/ (todos os estilos)
# ✅ js/ (scripts)
# ✅ vercel.json (configuração)
# ✅ package.json
```

### Passo 2: Deploy no Vercel
1. **Acesse:** [vercel.com](https://vercel.com)
2. **Import Project:** Selecione a pasta `public-landing/`
3. **Configure:**
   - **Project Name:** `yufin-landing`
   - **Framework:** Other
   - **Root Directory:** `public-landing`
4. **Domain:** Configure `yufin.com.br`
5. **Deploy:** Clique em Deploy

### Passo 3: Configurar Domínio
```bash
# No Vercel Dashboard:
# 1. Vá para Project Settings
# 2. Domains
# 3. Add Domain: yufin.com.br
# 4. Configure DNS no seu provedor
```

---

## ⚛️ Deploy do App React (app.yufin.com.br)

### Passo 1: Preparar App React
```bash
# A pasta raiz já está pronta com:
# ✅ React app completo
# ✅ vercel.json (configuração)
# ✅ package.json
# ✅ vite.config.js
```

### Passo 2: Deploy no Vercel
1. **Acesse:** [vercel.com](https://vercel.com)
2. **Import Project:** Selecione a pasta raiz do projeto
3. **Configure:**
   - **Project Name:** `yufin-app`
   - **Framework:** Vite
   - **Root Directory:** `.`
4. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.com
   NODE_ENV=production
   ```
5. **Domain:** Configure `app.yufin.com.br`
6. **Deploy:** Clique em Deploy

### Passo 3: Configurar Subdomínio
```bash
# No Vercel Dashboard:
# 1. Vá para Project Settings
# 2. Domains
# 3. Add Domain: app.yufin.com.br
# 4. Configure DNS no seu provedor
```

---

## 🔗 Fluxos de Navegação

### Landing Page → App React
```html
<!-- Botões da landing redirecionam para: -->
<a href="https://app.yufin.com.br">Entrar (Normal)</a>
<a href="https://app.yufin.com.br/register-free">Entrar (Gratuito)</a>
<a href="https://app.yufin.com.br/register-family">Selecionar (Família)</a>
<a href="https://app.yufin.com.br/register-school">Falar com Vendas (Escola)</a>
```

### App React → Landing Page
```javascript
// Links para voltar à landing:
window.open('https://yufin.com.br', '_blank');
```

---

## 🧪 Testes Pós-Deploy

### ✅ Checklist Landing Page (yufin.com.br)
- [ ] Página principal carrega
- [ ] Estilos aplicados corretamente
- [ ] Navegação funciona
- [ ] Botões redirecionam para app.yufin.com.br
- [ ] Páginas planos.html e sobre-contato.html funcionam

### ✅ Checklist App React (app.yufin.com.br)
- [ ] App carrega corretamente
- [ ] Login/registro funcionam
- [ ] Dashboards funcionam
- [ ] Sistema de tokens funciona
- [ ] Todas as funcionalidades operacionais

---

## 🚨 Troubleshooting

### Problema: Landing não carrega estilos
**Solução:** Verificar se todos os arquivos CSS estão na pasta `css/`

### Problema: App não conecta ao backend
**Solução:** Verificar variáveis de ambiente no Vercel

### Problema: Domínio não funciona
**Solução:** Verificar configuração DNS no provedor

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs no Vercel Dashboard
2. Testar localmente primeiro
3. Verificar configurações DNS
4. Consultar documentação do Vercel

**🎉 Deploy completo e funcional!**
