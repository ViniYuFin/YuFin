# 🔄 GUIA DE MIGRAÇÃO - Frontend para Novo Sistema de Autenticação

## 📌 O QUE MUDOU?

O YüFin agora usa **autenticação segura** com:
- ✅ Senhas criptografadas (bcrypt)
- ✅ Tokens JWT
- ✅ Validação de dados (Joi)
- ✅ Conformidade LGPD

---

## 🚨 MUDANÇAS CRÍTICAS NO FRONTEND

### **1. Atualizar authService.js**

**ANTES (INSEGURO):**
```javascript
// src/utils/authService.js
export const loginUser = async (email, password, role) => {
  const response = await apiPost('/login', { email, password, role });
  // ...
};
```

**DEPOIS (SEGURO):**
```javascript
// src/utils/authService.js
export const loginUser = async (email, password, role) => {
  const response = await apiPost('/auth/login', { email, password, role });
  
  // Armazenar token JWT
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }
  
  return response.user;
};
```

### **2. Atualizar apiService.js**

**ADICIONAR:** Header Authorization em todas as requisições

```javascript
// src/utils/apiService.js
const API_URL = 'https://yufin-backend.vercel.app';

// Função auxiliar para pegar o token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export async function apiGet(path) {
  const token = getAuthToken();
  
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  if (!res.ok) {
    throw new Error(await res.text());
  }
  
  return res.json();
}

export async function apiPost(path, body) {
  const token = getAuthToken();
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    throw new Error(await res.text());
  }
  
  return res.json();
}

// Repetir para apiPatch, apiPut, apiDelete
```

### **3. Atualizar Register.jsx**

**ADICIONAR:** Campo de consentimento LGPD

```jsx
import ParentConsentModal from './ParentConsentModal';

const Register = ({ onRegister }) => {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [parentConsent, setParentConsent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Se for estudante, exigir consentimento
    if (role === 'student' && !parentConsent) {
      setFormData({ name, email, password, role, gradeId });
      setShowConsentModal(true);
      return;
    }
    
    // Chamar novo endpoint
    onRegister({
      ...formData,
      parentConsent: true
    });
  };

  const handleConsent = (consentData) => {
    setParentConsent(true);
    setShowConsentModal(false);
    
    // Registrar com consentimento
    onRegister({
      ...formData,
      parentConsent: true,
      consentData
    });
  };

  return (
    <>
      {/* ... formulário ... */}
      
      <ParentConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsent}
        studentName={formData.name}
      />
    </>
  );
};
```

### **4. Atualizar app.jsx**

**MODIFICAR:** handleLogin e handleRegister

```jsx
// app.jsx
const handleLogin = async (email, password, role) => {
  try {
    const response = await apiPost('/auth/login', { email, password, role });
    
    // Armazenar token
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    setUser(response.user);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const handleRegister = async (userData) => {
  try {
    const response = await apiPost('/auth/register', userData);
    
    // Armazenar token
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    setUser(response.user);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const handleLogout = () => {
  // Limpar token
  localStorage.removeItem('authToken');
  
  setUser(null);
  setActiveScreen('welcome');
};
```

### **5. Adicionar Settings para Excluir Conta**

```jsx
// Settings.jsx
const handleDeleteAccount = async () => {
  if (!window.confirm('ATENÇÃO: Esta ação é IRREVERSÍVEL! Deseja realmente excluir sua conta?')) {
    return;
  }
  
  const password = prompt('Digite sua senha para confirmar:');
  if (!password) return;
  
  try {
    await apiDelete(`/lgpd/delete-account/${user.id}`, {
      confirmPassword: password
    });
    
    alert('Conta excluída com sucesso. Você será desconectado.');
    handleLogout();
  } catch (error) {
    alert('Erro ao excluir conta: ' + error.message);
  }
};
```

---

## 📝 CHECKLIST DE MIGRAÇÃO

### **Backend** ✅
- [x] Bcrypt instalado
- [x] JWT implementado
- [x] Middlewares criados
- [x] Validação Joi
- [x] CORS atualizado
- [x] Endpoints LGPD

### **Frontend** ⚠️ VOCÊ PRECISA FAZER:
- [ ] Atualizar `/auth/login` e `/auth/register` em authService.js
- [ ] Adicionar header Authorization em apiService.js
- [ ] Importar e usar ParentConsentModal.jsx em Register.jsx
- [ ] Atualizar handleLogin e handleRegister em app.jsx
- [ ] Adicionar botão "Excluir Conta" em Settings.jsx
- [ ] Testar fluxo completo

---

## 🧪 TESTES

### **1. Testar Registro**
```bash
curl -X POST https://yufin-backend.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@test.com",
    "password": "senha123",
    "role": "student",
    "gradeId": "6º Ano",
    "parentConsent": true
  }'
```

### **2. Testar Login**
```bash
curl -X POST https://yufin-backend.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@test.com",
    "password": "senha123",
    "role": "student"
  }'
```

### **3. Testar Rota Protegida**
```bash
curl -X GET https://yufin-backend.vercel.app/users/123 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## ⏱️ TEMPO ESTIMADO

- **Backend:** ✅ PRONTO (2-3 horas)
- **Frontend:** ⚠️ 1-2 horas de trabalho
- **Testes:** 30 minutos

**TOTAL:** ~2-3 horas para migração completa

---

## 🆘 PROBLEMAS COMUNS

### **"Token inválido"**
- Verifique se está enviando `Authorization: Bearer <token>`
- Verifique se o token não expirou (7 dias)
- Faça login novamente para obter novo token

### **"CORS blocked"**
- Verifique se o origin está na whitelist
- Em dev, use `http://localhost:5173`

### **"Consentimento obrigatório"**
- Estudantes DEVEM ter `parentConsent: true`
- Use o ParentConsentModal.jsx

---

## 📧 SUPORTE

Dúvidas? Abra uma issue no GitHub ou me chame!

**Última atualização:** 13 de Outubro de 2025

