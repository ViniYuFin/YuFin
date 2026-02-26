// Sistema de Autenticação para Landing Page
class LandingAuth {
  constructor() {
    this.currentUser = null;
    this.isLoggedIn = false;
    this.init();
  }

  init() {
    // Verificar se usuário está logado
    this.checkAuthStatus();
    
    // Atualizar interface baseada no status de login
    this.updateUI();
    
    // Garantir que a UI seja atualizada após o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateUI();
      });
    } else {
      // DOM já está pronto, atualizar imediatamente
      setTimeout(() => this.updateUI(), 100);
    }
    
    // Listener para mudanças de autenticação
    window.addEventListener('authChanged', () => {
      this.updateUI();
    });
  }

  // Verificar status de autenticação
  checkAuthStatus() {
    const userData = localStorage.getItem('landingUser');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isLoggedIn = true;
        console.log('👤 Usuário logado na landing:', this.currentUser);
      } catch (error) {
        console.error('❌ Erro ao recuperar dados do usuário:', error);
        // Limpar dados corrompidos
        localStorage.removeItem('landingUser');
        this.currentUser = null;
        this.isLoggedIn = false;
      }
    } else {
      console.log('👤 Nenhum usuário logado na landing');
    }
  }

  // Login
  async login(email, password) {
    try {
      console.log('🔐 Tentando login na landing:', email);
      
      // Verificar se estamos em desenvolvimento local (file://)
      // TEMPORÁRIO: Forçar uso do backend real para teste
      if (false && window.location.protocol === 'file:') {
        console.log('🔧 Modo desenvolvimento: simulando login');
        return this.simulateLogin(email, password);
      }
      
      // Usar backend real para HTTP/HTTPS
      const apiUrl = this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/landing/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const userData = await response.json();
        this.currentUser = userData.user;
        this.isLoggedIn = true;
        
        // Salvar no localStorage
        localStorage.setItem('landingUser', JSON.stringify(this.currentUser));
        
        // Disparar evento de mudança
        window.dispatchEvent(new CustomEvent('authChanged'));
        
        console.log('✅ Login realizado com sucesso');
        return { success: true, user: this.currentUser };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  }

  // Registro
  async register(userData) {
    try {
      console.log('📝 Tentando registro na landing:', userData.email);
      
      // Verificar se estamos em desenvolvimento local (file://)
      // TEMPORÁRIO: Forçar uso do backend real para teste
      if (false && window.location.protocol === 'file:') {
        console.log('🔧 Modo desenvolvimento: simulando registro');
        return this.simulateRegister(userData);
      }
      
      // Usar backend real para HTTP/HTTPS
      const apiUrl = this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/landing/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        this.currentUser = result.user;
        this.isLoggedIn = true;
        
        localStorage.setItem('landingUser', JSON.stringify(this.currentUser));
        window.dispatchEvent(new CustomEvent('authChanged'));
        
        console.log('✅ Registro realizado com sucesso');
        return { success: true, user: this.currentUser };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  }

  // Logout
  logout() {
    this.currentUser = null;
    this.isLoggedIn = false;
    localStorage.removeItem('landingUser');
    
    // Fechar sidebar se estiver aberto
    this.closeSidebar();
    
    // Atualizar interface imediatamente
    this.updateUI();
    
    // Disparar evento de mudança
    window.dispatchEvent(new CustomEvent('authChanged'));
    
    console.log('👋 Logout realizado');
    
    // Redirecionar para a página inicial se não estiver nela
    if (!window.location.pathname.includes('index-clean.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = 'index-clean.html';
    }
  }

  // Simulação de login para desenvolvimento
  async simulateLogin(email, password) {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se é um usuário de teste padrão
    if (email === 'teste@yufin.com.br' && password === '123456') {
      const user = {
        id: 'dev-user-1',
        name: 'Usuário de Teste',
        email: email,
        phone: '11999999999',
        createdAt: new Date().toISOString()
      };
      
      this.currentUser = user;
      this.isLoggedIn = true;
      
      localStorage.setItem('landingUser', JSON.stringify(this.currentUser));
      window.dispatchEvent(new CustomEvent('authChanged'));
      
      console.log('✅ Login simulado realizado com sucesso');
      return { success: true, user: this.currentUser };
    }
    
    // Verificar se existe um usuário registrado com este e-mail
    const existingUser = localStorage.getItem('landingUser');
    if (existingUser) {
      const user = JSON.parse(existingUser);
      if (user.email === email) {
        // Usuário encontrado, fazer login
        this.currentUser = user;
        this.isLoggedIn = true;
        
        localStorage.setItem('landingUser', JSON.stringify(this.currentUser));
        window.dispatchEvent(new CustomEvent('authChanged'));
        
        console.log('✅ Login realizado com usuário registrado:', user.email);
        return { success: true, user: this.currentUser };
      }
    }
    
    // Se não encontrou usuário, retornar erro
    console.log('❌ Usuário não encontrado para e-mail:', email);
    return { success: false, error: 'E-mail ou senha incorretos' };
  }

  // Simulação de registro para desenvolvimento
  async simulateRegister(userData) {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Verificar se email já existe
    const existingUser = localStorage.getItem('landingUser');
    if (existingUser) {
      const user = JSON.parse(existingUser);
      if (user.email === userData.email) {
        return { success: false, error: 'Este e-mail já está cadastrado' };
      }
    }
    
    // Criar novo usuário
    const newUser = {
      id: 'dev-user-' + Date.now(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      createdAt: new Date().toISOString()
    };
    
    this.currentUser = newUser;
    this.isLoggedIn = true;
    
    // Salvar no localStorage com verificação
    try {
      localStorage.setItem('landingUser', JSON.stringify(this.currentUser));
      console.log('💾 Dados salvos no localStorage:', this.currentUser);
      
      // Verificar se foi salvo corretamente
      const savedData = localStorage.getItem('landingUser');
      if (savedData) {
        console.log('✅ Dados confirmados no localStorage');
      } else {
        console.error('❌ Falha ao salvar no localStorage');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
    
    window.dispatchEvent(new CustomEvent('authChanged'));
    
    console.log('✅ Registro simulado realizado com sucesso');
    return { success: true, user: this.currentUser };
  }

  // Obter histórico de licenças
  async getLicenseHistory() {
    try {
      const apiUrl = this.getApiUrl();
      const token = localStorage.getItem('landingUser');
      
      if (!token) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      const user = JSON.parse(token);
      const response = await fetch(`${apiUrl}/api/landing/licenses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token || 'dev-token'}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, licenses: data.licenses };
      } else {
        // Fallback para desenvolvimento
        const localLicenses = JSON.parse(localStorage.getItem('userLicenses') || '[]');
        return { success: true, licenses: localLicenses };
      }
    } catch (error) {
      console.error('❌ Erro ao obter licenças:', error);
      // Fallback para desenvolvimento
      const localLicenses = JSON.parse(localStorage.getItem('userLicenses') || '[]');
      return { success: true, licenses: localLicenses };
    }
  }

  // Obter histórico de pagamentos
  async getPaymentHistory() {
    try {
      const apiUrl = this.getApiUrl();
      const token = localStorage.getItem('landingUser');
      
      if (!token) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      const user = JSON.parse(token);
      const response = await fetch(`${apiUrl}/api/landing/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token || 'dev-token'}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, payments: data.payments };
      } else {
        // Fallback para desenvolvimento
        const localLicenses = JSON.parse(localStorage.getItem('userLicenses') || '[]');
        const payments = localLicenses.map(license => ({
          id: license.id,
          description: `${license.planType === 'family' ? 'Plano Família' : 'Plano Escola'} - ${license.planData?.numParents || license.planData?.numStudents || 0} ${license.planType === 'family' ? 'responsáveis' : 'alunos'}`,
          amount: license.amount,
          status: 'completed',
          method: 'credit_card',
          date: license.createdAt,
          transactionId: license.paymentData?.transactionId || 'TXN_' + license.id,
          type: license.planType
        }));
        return { success: true, payments: payments };
      }
    } catch (error) {
      console.error('❌ Erro ao obter pagamentos:', error);
      // Fallback para desenvolvimento
      const localLicenses = JSON.parse(localStorage.getItem('userLicenses') || '[]');
      const payments = localLicenses.map(license => ({
        id: license.id,
        description: `${license.planType === 'family' ? 'Plano Família' : 'Plano Escola'} - ${license.planData?.numParents || license.planData?.numStudents || 0} ${license.planType === 'family' ? 'responsáveis' : 'alunos'}`,
        amount: license.amount,
        status: 'completed',
        method: 'credit_card',
        date: license.createdAt,
        transactionId: license.paymentData?.transactionId || 'TXN_' + license.id,
        type: license.planType
      }));
      return { success: true, payments: payments };
    }
  }

  // Atualizar interface baseada no status de login
  updateUI() {
    const loginBtn = document.getElementById('entrarBtn');
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const navbarContainer = document.querySelector('.navbar-container');
    
    if (this.isLoggedIn) {
      // Usuário logado - mostrar sidebar, ocultar botão entrar
      if (loginBtn) {
        loginBtn.style.display = 'none';
        loginBtn.style.visibility = 'hidden';
      }
      
      if (sidebarToggle) {
        sidebarToggle.style.display = 'flex';
      }
      
      if (navbarContainer) {
        navbarContainer.classList.add('user-logged-in');
      }
      
      if (!sidebarMenu) {
        this.createSidebarMenu();
      }
    } else {
      // Usuário não logado - mostrar botão de entrar, ocultar sidebar
      if (loginBtn) {
        loginBtn.style.display = 'block';
        loginBtn.style.visibility = 'visible'; // ✅ Garantir que visibility seja restaurada
      }
      
      if (sidebarToggle) {
        sidebarToggle.style.display = 'none';
      }
      
      if (navbarContainer) {
        navbarContainer.classList.remove('user-logged-in');
      }
      
      if (sidebarMenu) {
        sidebarMenu.remove();
      }
    }
  }

  // Criar menu do usuário (removido - agora tudo está no sidebar)
  createUserMenu() {
    // Menu do usuário removido - todas as opções estão no sidebar
    console.log('Menu do usuário removido - usando sidebar');
  }

  // Detectar página atual para aplicar classe active
  getCurrentPage() {
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;
    
    console.log('🔍 URL atual:', currentUrl);
    console.log('🔍 Path atual:', currentPath);
    
    // Verificar se estamos na página de planos
    if (currentPath.includes('planos.html') || currentUrl.includes('planos.html')) {
      return 'planos';
    }
    
    // Verificar se estamos na página sobre/contato
    if (currentPath.includes('sobre-contato.html') || currentUrl.includes('sobre-contato.html')) {
      return 'sobre';
    }
    
    // Verificar se estamos na página inicial (index-clean.html ou raiz)
    if (currentPath.includes('index-clean.html') || 
        currentPath.endsWith('/') || 
        currentPath === '' ||
        currentUrl.includes('index-clean.html')) {
      return 'inicio';
    }
    
    // Fallback para início se não conseguir detectar
    return 'inicio';
  }

  // Criar menu lateral profissional e minimalista
  createSidebarMenu() {
    // Remover sidebar existente se houver
    const existingSidebar = document.querySelector('.sidebar-menu');
    if (existingSidebar) {
      existingSidebar.remove();
    }

    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = () => this.closeSidebar();

    // Determinar página atual para aplicar classe active
    const currentPage = this.getCurrentPage();
    console.log('🔍 Página atual detectada:', currentPage);

    // Criar sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar-menu';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <button class="sidebar-close" onclick="landingAuth.closeSidebar()">&times;</button>
        <div class="sidebar-user-info">
          <h3 class="sidebar-user-name">${this.currentUser.name}</h3>
          <p class="sidebar-user-email">${this.currentUser.email}</p>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a href="#" class="sidebar-nav-item ${currentPage === 'inicio' ? 'active' : ''}" onclick="checkAuthAndRedirect('navigate-inicio', () => { window.location.href = 'index-clean.html#hero'; landingAuth.closeSidebar(); })">
          Início
        </a>
        <a href="#" class="sidebar-nav-item ${currentPage === 'planos' ? 'active' : ''}" onclick="checkAuthAndRedirect('navigate-planos', () => { window.location.href = 'planos.html'; landingAuth.closeSidebar(); })">
          Planos
        </a>
        <a href="#" class="sidebar-nav-item ${currentPage === 'sobre' ? 'active' : ''}" onclick="checkAuthAndRedirect('navigate-sobre', () => { window.location.href = 'sobre-contato.html'; landingAuth.closeSidebar(); })">
          Sobre & Contato
        </a>
        
        <div class="sidebar-divider"></div>
        
        <a href="#" class="sidebar-nav-item" onclick="window.open('https://app.yufin.com.br', '_blank'); landingAuth.closeSidebar();">
          Entrar no App
        </a>
        <div class="development-section">
          <div class="dev-tag-single">ÁREA DO CLIENTE</div>
          <a href="#" class="sidebar-nav-item" onclick="checkAuthAndRedirect('navigate-licenses', () => { window.location.href='minhas-licencas.html'; landingAuth.closeSidebar(); })">
            Minhas Licenças
          </a>
          <a href="#" class="sidebar-nav-item" onclick="checkAuthAndRedirect('navigate-history', () => { window.location.href='historico-pagamentos.html'; landingAuth.closeSidebar(); })">
            Histórico de Pagamentos
          </a>
        </div>
        <a href="mailto:contato@yufin.com.br?subject=Suporte YüFin&body=Olá, tenho uma dúvida sobre:" class="sidebar-nav-item" onclick="landingAuth.closeSidebar();">
          Suporte
        </a>
      </nav>
      
      <div class="sidebar-footer">
        <button class="sidebar-logout" onclick="landingAuth.logout()">
          Sair da Conta
        </button>
      </div>
    `;

    // Adicionar ao body
    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);

    console.log('✅ Sidebar profissional criado com sucesso');
  }

  // Abrir sidebar
  openSidebar() {
    const sidebar = document.querySelector('.sidebar-menu');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  // Fechar sidebar
  closeSidebar() {
    const sidebar = document.querySelector('.sidebar-menu');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  // Funções para as opções do menu lateral
  showClientArea() {
    console.log('🏠 Abrindo Área do Cliente');
    // Implementar lógica da área do cliente
    alert('Área do Cliente em desenvolvimento');
  }

  showMyLicenses() {
    console.log('🔑 Abrindo Minhas Licenças');
    // Implementar lógica das licenças
    alert('Minhas Licenças em desenvolvimento');
  }

  showPaymentHistory() {
    console.log('💳 Abrindo Histórico de Pagamentos');
    // Implementar lógica do histórico
    alert('Histórico de Pagamentos em desenvolvimento');
  }

  // Função showSupport removida - agora o suporte abre diretamente o e-mail

  // Obter histórico de licenças
  async getLicenseHistory() {
    try {
      const apiUrl = this.getApiUrl();
      console.log('🌐 Carregando licenças de:', `${apiUrl}/api/landing/licenses`);
      
      const response = await fetch(`${apiUrl}/api/landing/licenses`, {
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Erro ao carregar licenças');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar licenças:', error);
      return { licenses: [], payments: [] };
    }
  }

  // Obter histórico de pagamentos
  async getPaymentHistory() {
    try {
      const apiUrl = this.getApiUrl();
      console.log('🌐 Carregando pagamentos de:', `${apiUrl}/api/landing/payments`);
      
      const response = await fetch(`${apiUrl}/api/landing/payments`, {
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Erro ao carregar pagamentos');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pagamentos:', error);
      return { payments: [] };
    }
  }

  // Reenviar licença por email
  async resendLicense(licenseId) {
    try {
      const response = await fetch('/api/landing/licenses/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentUser.token}`
        },
        body: JSON.stringify({ licenseId })
      });

      if (response.ok) {
        return { success: true, message: 'Licença reenviada por email!' };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('❌ Erro ao reenviar licença:', error);
      return { success: false, error: 'Erro ao reenviar licença' };
    }
  }
}

// Instância global
window.landingAuth = new LandingAuth();

// Funções globais para o menu lateral
function showClientArea() {
  landingAuth.showClientArea();
}

function showMyLicenses() {
  landingAuth.showMyLicenses();
}

function showPaymentHistory() {
  landingAuth.showPaymentHistory();
}

function showSupport() {
  landingAuth.showSupport();
}

// Funções auxiliares
function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function showClientArea() {
  // Implementar área do cliente
  console.log('🏠 Abrindo área do cliente');
  // Aqui seria implementada a área do cliente
}

function showMyLicenses() {
  // Implementar tela de licenças
  console.log('🔑 Abrindo minhas licenças');
  // Aqui seria implementada a tela de licenças
}

function showPaymentHistory() {
  // Implementar histórico de pagamentos
  console.log('💳 Abrindo histórico de pagamentos');
  // Aqui seria implementada a tela de pagamentos
}

function showSupport() {
  // Implementar suporte
  console.log('🆘 Abrindo suporte');
  // Aqui seria implementada a tela de suporte
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(event) {
  const userMenu = document.querySelector('.user-menu');
  const dropdown = document.getElementById('userDropdown');
  
  if (userMenu && !userMenu.contains(event.target)) {
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }
});

// Função para verificar autenticação e redirecionar
function checkAuthAndRedirect(action, callback) {
  console.log('🔐 Verificando autenticação para ação:', action);
  
  if (landingAuth.isLoggedIn) {
    console.log('✅ Usuário logado, executando ação');
    if (callback) callback();
  } else {
    console.log('❌ Usuário não logado, mostrando modal de login');
    authModals.showLoginModal();
    
    // Salvar ação pendente para executar após login
    if (action) {
      localStorage.setItem('pendingAction', JSON.stringify({
        action: action,
        callback: callback ? callback.toString() : null,
        timestamp: Date.now()
      }));
    }
  }
}

// Função para executar ação pendente após login
function executePendingAction() {
  const pendingAction = localStorage.getItem('pendingAction');
  if (pendingAction) {
    try {
      const actionData = JSON.parse(pendingAction);
      console.log('🔄 Executando ação pendente:', actionData.action);
      
      // Executar ação baseada no tipo
      switch (actionData.action) {
        case 'family-plan':
          openFamilyPlanModal();
          break;
        case 'school-plan':
          openSchoolPlanModal();
          break;
        case 'client-area':
          authModals.showClientArea();
          break;
        case 'redirect-to-app':
          redirectToApp();
          break;
        case 'navigate-inicio':
          window.location.href = 'index-clean.html#hero';
          break;
        case 'navigate-planos':
          window.location.href = 'planos.html';
          break;
        case 'navigate-sobre':
          window.location.href = 'sobre-contato.html';
          break;
        default:
          console.log('Ação pendente não reconhecida:', actionData.action);
      }
      
      // Limpar ação pendente
      localStorage.removeItem('pendingAction');
    } catch (error) {
      console.error('❌ Erro ao executar ação pendente:', error);
      localStorage.removeItem('pendingAction');
    }
  }
}

// Listener para mudanças de autenticação
window.addEventListener('authChanged', () => {
  // Se usuário acabou de fazer login, executar ação pendente
  if (landingAuth.isLoggedIn) {
    setTimeout(executePendingAction, 500); // Delay para garantir que UI foi atualizada
  }
});

// Função de debug para verificar estado do sistema
window.debugAuth = function() {
  console.log('🔍 DEBUG - Estado do Sistema de Autenticação:');
  console.log('👤 Usuário atual:', landingAuth.currentUser);
  console.log('🔐 Logado:', landingAuth.isLoggedIn);
  console.log('💾 localStorage:', localStorage.getItem('landingUser'));
  console.log('🌐 Protocolo:', window.location.protocol);
  console.log('📍 URL atual:', window.location.href);
  
  // Verificar se sidebar existe
  const sidebar = document.querySelector('.sidebar-menu');
  console.log('📱 Sidebar existe:', !!sidebar);
  
  // Verificar se botão entrar existe
  const entrarBtn = document.getElementById('entrarBtn');
  console.log('🔘 Botão Entrar existe:', !!entrarBtn);
  console.log('🔘 Botão Entrar visível:', entrarBtn ? entrarBtn.style.display !== 'none' : 'N/A');
  
  // Verificar se sidebar toggle existe
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  console.log('🍔 Sidebar Toggle existe:', !!sidebarToggle);
  console.log('🍔 Sidebar Toggle visível:', sidebarToggle ? sidebarToggle.style.display !== 'none' : 'N/A');
};

// Função para obter URL da API baseada no ambiente
LandingAuth.prototype.getApiUrl = function() {
  console.log('🌍 Detectando ambiente:', {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    href: window.location.href
  });
  
  // Se estivermos em produção (app.yufin.com.br ou www.yufin.com.br), usar backend de produção
  if (window.location.hostname === 'app.yufin.com.br' || window.location.hostname === 'www.yufin.com.br') {
    console.log('🚀 Modo produção: usando backend de produção');
    return 'https://yufin-backend.vercel.app';
  }
  
  // Se estivermos em desenvolvimento local (localhost), usar backend local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Modo desenvolvimento: usando backend local');
    return 'http://localhost:3001';
  }
  
  // Se estivermos em file:// (desenvolvimento local), usar backend local
  if (window.location.protocol === 'file:') {
    console.log('📁 Modo file://: usando backend local');
    return 'http://localhost:3001';
  }
  
  // Fallback para desenvolvimento
  console.log('⚠️ Fallback: usando backend local');
  return 'http://localhost:3001';
};

// Instância global
window.landingAuth = new LandingAuth();

// Verificação adicional para garantir que o botão seja ocultado na página de planos
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um pouco para garantir que todos os scripts foram carregados
  setTimeout(() => {
    if (window.landingAuth && window.landingAuth.isLoggedIn) {
      const loginBtn = document.getElementById('entrarBtn');
      if (loginBtn) {
        loginBtn.style.display = 'none';
        loginBtn.style.visibility = 'hidden';
      }
    }
  }, 200);
});
