# 🔐 IMPLEMENTAR LGPD NO FRONTEND

## 📋 **O QUE VOCÊ PRECISA FAZER:**

### **1. CRIAR PÁGINA DE POLÍTICA DE PRIVACIDADE**
```jsx
// src/pages/PrivacyPolicy.jsx
import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto p-6">
      <h1>Política de Privacidade</h1>
      {/* Conteúdo da POLITICA_PRIVACIDADE.md */}
    </div>
  );
};

export default PrivacyPolicy;
```

### **2. CRIAR PÁGINA DE TERMOS DE USO**
```jsx
// src/pages/TermsOfService.jsx
import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container mx-auto p-6">
      <h1>Termos de Uso</h1>
      {/* Conteúdo dos TERMOS_USO.md */}
    </div>
  );
};

export default TermsOfService;
```

### **3. ADICIONAR LINKS NO FOOTER**
```jsx
// No componente Footer ou Layout principal
<footer>
  <a href="/privacy-policy">Política de Privacidade</a>
  <a href="/terms-of-service">Termos de Uso</a>
  <a href="/lgpd-rights">Seus Direitos LGPD</a>
</footer>
```

### **4. CRIAR PÁGINA DE DIREITOS LGPD**
```jsx
// src/pages/LGPDRights.jsx
import React from 'react';
import { lgpdService } from '../utils/lgpdService';

const LGPDRights = () => {
  const handleExportData = async () => {
    try {
      await lgpdService.exportUserData(currentUserId);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  const handleDeleteData = async () => {
    if (confirm('Tem certeza? Esta ação não pode ser desfeita!')) {
      try {
        await lgpdService.requestDataDeletion(currentUserId);
      } catch (error) {
        console.error('Erro ao solicitar exclusão:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1>Seus Direitos LGPD</h1>
      
      <div className="space-y-4">
        <button onClick={handleExportData}>
          📥 Exportar Meus Dados
        </button>
        
        <button onClick={handleDeleteData}>
          🗑️ Solicitar Exclusão de Dados
        </button>
      </div>
    </div>
  );
};
```

### **5. ADICIONAR BANNER DE COOKIES**
```jsx
// src/components/CookieBanner.jsx
import React, { useState } from 'react';

const CookieBanner = () => {
  const [accepted, setAccepted] = useState(
    localStorage.getItem('cookiesAccepted') === 'true'
  );

  if (accepted) return null;

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setAccepted(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <p>
          Usamos cookies para melhorar sua experiência. 
          <a href="/privacy-policy" className="underline ml-2">
            Saiba mais
          </a>
        </p>
        <button 
          onClick={handleAccept}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
};
```

### **6. ATUALIZAR FORMULÁRIOS DE REGISTRO**
```jsx
// No componente Register.jsx, adicionar:
<div className="text-xs text-gray-600">
  Ao registrar, você concorda com nossos{' '}
  <a href="/terms-of-service" className="text-blue-600 underline">
    Termos de Uso
  </a>{' '}
  e{' '}
  <a href="/privacy-policy" className="text-blue-600 underline">
    Política de Privacidade
  </a>
</div>
```

## 🎯 **CHECKLIST DE CONFORMIDADE LGPD:**

- [ ] Política de Privacidade publicada
- [ ] Termos de Uso publicados  
- [ ] Links nos formulários de registro
- [ ] Página de direitos LGPD
- [ ] Banner de cookies
- [ ] Botões de exportar/excluir dados
- [ ] Consentimento parental implementado
- [ ] Headers LGPD no backend
- [ ] Logs de auditoria
- [ ] Contato do DPO disponível

## 📞 **SUPORTE LGPD:**

- **Email DPO:** dpo@yufin.com.br
- **Prazo de resposta:** 15 dias úteis
- **Formato de resposta:** JSON para exportação
- **Confirmação de exclusão:** Email automático
