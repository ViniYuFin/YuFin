// Modais de Autenticação para Landing Page
class AuthModals {
  constructor() {
    this.init();
  }

  init() {
    console.log('🔧 Inicializando AuthModals...');
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.createModals();
      });
    } else {
      this.createModals();
    }
  }

  createModals() {
    console.log('🔧 Criando modais...');
    // Criar modais se não existirem
    this.createLoginModal();
    this.createRegisterModal();
    this.createClientAreaModal();
    console.log('✅ AuthModals inicializado');
  }

  // Criar modal de login
  createLoginModal() {
    if (document.getElementById('loginModal')) {
      console.log('🔍 Modal de login já existe');
      return;
    }

    console.log('🔧 Criando modal de login...');
    const modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.className = 'auth-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '999999';
    modal.innerHTML = `
      <div class="auth-modal-content">
        <div class="auth-modal-header">
          <h2>Entrar na sua conta</h2>
          <button class="close-btn" onclick="authModals.closeLoginModal()">&times;</button>
        </div>
        <div class="auth-modal-body">
          <form id="loginForm" class="auth-form">
          <div class="form-group">
            <label for="loginEmail">E-mail</label>
            <input type="email" id="loginEmail" required>
          </div>
          <div class="form-group">
            <label for="loginPassword">Senha</label>
            <div class="password-input-container">
              <input type="password" id="loginPassword" required>
              <button type="button" class="password-toggle" onclick="authModals.togglePassword('loginPassword')">
                <span class="password-icon">👁️</span>
              </button>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Entrar</button>
            <button type="button" class="btn-secondary" onclick="authModals.showRegisterModal()">
              Criar conta
            </button>
          </div>
          <div class="form-links">
            <a href="#" onclick="authModals.showForgotPassword()">Esqueci minha senha</a>
          </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    console.log('✅ Modal de login criado e adicionado ao DOM');
    console.log('🔍 Modal de login estilos:', {
      display: modal.style.display,
      position: modal.style.position,
      zIndex: modal.style.zIndex,
      className: modal.className
    });

    // Event listener para formulário
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  // Criar modal de registro
  createRegisterModal() {
    if (document.getElementById('registerModal')) {
      console.log('🔍 Modal de registro já existe');
      return;
    }

    console.log('🔧 Criando modal de registro...');
    const modal = document.createElement('div');
    modal.id = 'registerModal';
    modal.className = 'auth-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '999999';
    modal.innerHTML = `
      <div class="auth-modal-content">
        <div class="auth-modal-header">
          <h2>Criar conta</h2>
          <button class="close-btn" onclick="authModals.closeRegisterModal()">&times;</button>
        </div>
        <div class="auth-modal-body">
          <form id="registerForm" class="auth-form">
          <div class="form-group">
            <label for="registerName">Nome completo</label>
            <input type="text" id="registerName" required>
          </div>
          <div class="form-group">
            <label for="registerEmail">E-mail</label>
            <input type="email" id="registerEmail" required>
          </div>
          <div class="form-group">
            <label for="registerPhone">Telefone</label>
            <input type="tel" id="registerPhone" placeholder="(11) 99999-9999" required>
          </div>
          <div class="form-group">
            <label for="registerPassword">Senha</label>
            <div class="password-input-container">
              <input type="password" id="registerPassword" required>
              <button type="button" class="password-toggle" onclick="authModals.togglePassword('registerPassword')">
                <span class="password-icon">👁️</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="registerConfirmPassword">Confirmar senha</label>
            <div class="password-input-container">
              <input type="password" id="registerConfirmPassword" required>
              <button type="button" class="password-toggle" onclick="authModals.togglePassword('registerConfirmPassword')">
                <span class="password-icon">👁️</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="registerTerms" required>
              Aceito os <a href="termos-uso.html" target="_blank">termos de uso</a> e <a href="politica-privacidade.html" target="_blank">política de privacidade</a>
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Criar conta</button>
            <button type="button" class="btn-secondary" onclick="authModals.showLoginModal()">
              Já tenho conta
            </button>
          </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listener para formulário
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });

    // Formatação automática do telefone
    this.setupPhoneFormatting();
  }

  // Criar modal da área do cliente
  createClientAreaModal() {
    if (document.getElementById('clientAreaModal')) {
      console.log('🔍 Modal da área do cliente já existe');
      return;
    }
    
    console.log('🏗️ Criando novo modal da área do cliente...');

    console.log('🔧 Criando modal da área do cliente...');
    const modal = document.createElement('div');
    modal.id = 'clientAreaModal';
    modal.className = 'auth-modal client-area-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '999999';
    modal.innerHTML = `
      <div class="auth-modal-content client-area-content">
        <div class="auth-modal-header">
          <h2>Área do Cliente</h2>
          <button class="close-btn" onclick="authModals.closeClientArea()">&times;</button>
        </div>
        <div class="auth-modal-body">
          <div class="client-area-tabs">
          <button class="tab-btn active" onclick="authModals.showTab('licenses')">🔑 Minhas Licenças</button>
          <button class="tab-btn" onclick="authModals.showTab('payments')">💳 Pagamentos</button>
          <button class="tab-btn" onclick="authModals.showTab('profile')">👤 Perfil</button>
        </div>
        <div class="client-area-content">
          <!-- Tab Licenças -->
          <div id="licensesTab" class="tab-content active">
            <div class="licenses-header">
              <h3>Suas Licenças</h3>
              <button class="btn-primary" onclick="authModals.refreshLicenses()">🔄 Atualizar</button>
            </div>
            <div id="licensesList" class="licenses-list">
              <!-- Conteúdo será carregado dinamicamente -->
            </div>
          </div>
          
          <!-- Tab Pagamentos -->
          <div id="paymentsTab" class="tab-content">
            <div class="payments-header">
              <h3>Histórico de Pagamentos</h3>
              <button class="btn-primary" onclick="authModals.refreshPayments()">🔄 Atualizar</button>
            </div>
            <div id="paymentsList" class="payments-list">
              <div class="loading">Carregando pagamentos...</div>
            </div>
          </div>
          
          <!-- Tab Perfil -->
          <div id="profileTab" class="tab-content">
            <div class="profile-header">
              <h3>Informações do Perfil</h3>
            </div>
            <div id="profileInfo" class="profile-info">
              <div class="loading">Carregando perfil...</div>
            </div>
          </div>
        </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Mostrar modal de login
  showLoginModal() {
    this.closeRegisterModal();
    console.log('🔍 Tentando mostrar modal de login...');
    const modal = document.getElementById('loginModal');
    console.log('🔍 Modal encontrado:', modal);
    
    if (modal) {
      console.log('✅ Modal encontrado, exibindo...');
      modal.classList.add('show');
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      document.body.style.overflow = 'hidden';
      console.log('✅ Modal de login exibido');
    } else {
      console.error('❌ Modal de login não encontrado!');
    }
  }

  // Fechar modal de login
  closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  // Mostrar modal de registro
  showRegisterModal() {
    this.closeLoginModal();
    const modal = document.getElementById('registerModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  // Fechar modal de registro
  closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  // Mostrar área do cliente - Redirecionar para página dedicada
  showClientArea() {
    console.log('🔄 Redirecionando para página de licenças...');
    window.location.href = 'minhas-licencas.html';
  }

  // Fechar área do cliente - Não necessário mais
  closeClientArea() {
    // Função removida - não usamos mais modais
  }

  // Processar login
  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const result = await window.landingAuth.login(email, password);
    
    if (result.success) {
      this.closeLoginModal();
      this.showSuccessMessage('Login realizado com sucesso!');
    } else {
      this.showErrorMessage(result.error);
    }
  }

  // Processar registro
  async handleRegister() {
    const userData = {
      name: document.getElementById('registerName').value,
      email: document.getElementById('registerEmail').value,
      phone: document.getElementById('registerPhone').value,
      password: document.getElementById('registerPassword').value,
      confirmPassword: document.getElementById('registerConfirmPassword').value
    };

    // Validações
    if (userData.password !== userData.confirmPassword) {
      this.showErrorMessage('As senhas não coincidem.');
      return;
    }

    if (!document.getElementById('registerTerms').checked) {
      this.showErrorMessage('Você deve aceitar os termos de uso.');
      return;
    }

    const result = await window.landingAuth.register(userData);
    
    if (result.success) {
      this.closeRegisterModal();
      this.showSuccessMessage('Conta criada com sucesso!');
    } else {
      this.showErrorMessage(result.error);
    }
  }

  // Carregar dados da área do cliente
  async loadClientData() {
    console.log('🔄 Carregando dados da área do cliente...');
    await this.loadLicenses();
    await this.loadPayments();
    await this.loadProfile();
    console.log('✅ Dados da área do cliente carregados');
  }

  // Carregar licenças
  async loadLicenses() {
    console.log('🔄 Iniciando carregamento de licenças...');
    const licensesList = document.getElementById('licensesList');
    
    if (!licensesList) {
      console.error('❌ Elemento licensesList não encontrado no DOM!');
      return;
    }
    
    // licensesList.innerHTML = '<div class="loading">Carregando licenças...</div>'; // Removido para evitar conflito visual

    try {
      // Usar sempre o backend real (MongoDB)
      console.log('🌐 Carregando licenças do backend MongoDB...');
      const data = await landingAuth.getLicenseHistory();
      
      if (data.success && data.licenses) {
        console.log('📋 Licenças carregadas do backend:', data.licenses);
        console.log('🎯 Chamando renderLicenses com', data.licenses.length, 'licenças');
        this.renderLicenses(data.licenses);
      } else {
        console.log('📭 Nenhuma licença encontrada no backend');
        console.log('🎯 Chamando renderLicenses com array vazio');
        this.renderLicenses([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar licenças:', error);
      licensesList.innerHTML = '<div class="error">Erro ao carregar licenças</div>';
    }
  }

  // Renderizar licenças
  renderLicenses(licenses) {
    console.log('🎨 Renderizando licenças:', licenses);
    const licensesList = document.getElementById('licensesList');
    
    if (!licensesList) {
      console.error('❌ Elemento licensesList não encontrado!');
      return;
    }
    
    console.log('🔍 Elemento licensesList encontrado:', licensesList);
    
    if (licenses.length === 0) {
      console.log('📭 Nenhuma licença encontrada');
      licensesList.innerHTML = '<div class="empty">Nenhuma licença encontrada</div>';
      return;
    }
    
    console.log('📝 Gerando HTML para', licenses.length, 'licenças...');

    const html = licenses.map(license => `
      <div class="license-card">
        <div class="license-header">
          <h4>${license.planType === 'family' ? 'Plano Família' : 'Plano Escola'}</h4>
          <span class="license-status ${license.status}">${this.getStatusText(license.status)}</span>
        </div>
        <div class="license-details">
          <p><strong>Código:</strong> <code>${license.code}</code></p>
          <p><strong>Data:</strong> ${new Date(license.createdAt).toLocaleDateString('pt-BR')}</p>
          <p><strong>Valor:</strong> R$ ${license.amount.toFixed(2)}</p>
          ${license.planData ? `
            <p><strong>Detalhes:</strong> ${license.planData.numParents || license.planData.numStudents || 0} ${license.planType === 'family' ? 'responsáveis' : 'alunos'}</p>
          ` : ''}
        </div>
        <div class="license-actions">
          <button class="btn-small" onclick="authModals.copyLicense('${license.code}')">📋 Copiar</button>
          <button class="btn-small" onclick="authModals.resendLicense('${license.id}')">📧 Reenviar</button>
          <button class="btn-small" onclick="authModals.downloadLicense('${license.id}')">📄 Download</button>
        </div>
      </div>
    `).join('');

    console.log('📄 HTML gerado:', html.substring(0, 200) + '...');
    licensesList.innerHTML = html;
    console.log('✅ HTML inserido no DOM');
    console.log('🔍 Conteúdo atual do licensesList:', licensesList.innerHTML.substring(0, 200) + '...');
    
    // Forçar visibilidade com JavaScript
    licensesList.style.display = 'block';
    licensesList.style.visibility = 'visible';
    licensesList.style.opacity = '1';
    licensesList.style.height = 'auto';
    licensesList.style.minHeight = '100px';
    console.log('🔧 Forçando visibilidade com JavaScript');
    
    // Forçar visibilidade do elemento pai também
    const parentElement = licensesList.parentElement;
    if (parentElement) {
      parentElement.style.display = 'block';
      parentElement.style.visibility = 'visible';
      parentElement.style.opacity = '1';
      parentElement.style.height = 'auto';
      parentElement.style.minHeight = '200px';
      console.log('🔧 Forçando visibilidade do elemento pai');
    }
    
    // Verificar se o conteúdo está visível após um pequeno delay
    setTimeout(() => {
      console.log('🔍 Verificação após delay - Conteúdo do licensesList:', licensesList.innerHTML.substring(0, 200) + '...');
      console.log('🔍 Elemento licensesList visível:', licensesList.offsetHeight > 0);
      
      // Verificar se o tab está ativo
      const licensesTab = document.getElementById('licensesTab');
      console.log('🔍 Tab licensesTab encontrado:', licensesTab);
      console.log('🔍 Tab licensesTab tem classe active:', licensesTab?.classList.contains('active'));
      console.log('🔍 Tab licensesTab display:', licensesTab?.style.display);
      console.log('🔍 Tab licensesTab computed display:', window.getComputedStyle(licensesTab).display);
      
      // Verificar se o elemento pai está visível
      const parentElement = licensesList.parentElement;
      console.log('🔍 Elemento pai do licensesList:', parentElement);
      console.log('🔍 Elemento pai visível:', parentElement?.offsetHeight > 0);
      console.log('🔍 Elemento pai display:', window.getComputedStyle(parentElement).display);
      
      // Verificar se há elementos filhos
      const childElements = licensesList.children;
      console.log('🔍 Número de elementos filhos:', childElements.length);
      console.log('🔍 Primeiro filho:', childElements[0]);
      
      // Verificar toda a hierarquia até o modal
      let currentElement = licensesList;
      let level = 0;
      while (currentElement && level < 10) {
        console.log(`🔍 Nível ${level}:`, currentElement.tagName, currentElement.className, currentElement.id);
        console.log(`🔍 Nível ${level} visível:`, currentElement.offsetHeight > 0);
        console.log(`🔍 Nível ${level} display:`, window.getComputedStyle(currentElement).display);
        console.log(`🔍 Nível ${level} visibility:`, window.getComputedStyle(currentElement).visibility);
        console.log(`🔍 Nível ${level} opacity:`, window.getComputedStyle(currentElement).opacity);
        currentElement = currentElement.parentElement;
        level++;
      }
    }, 100);
  }

  // Carregar pagamentos
  async loadPayments() {
    const paymentsList = document.getElementById('paymentsList');
    paymentsList.innerHTML = '<div class="loading">Carregando pagamentos...</div>';

    try {
      // Usar sempre o backend real (MongoDB)
      console.log('🌐 Carregando pagamentos do backend MongoDB...');
      const data = await landingAuth.getPaymentHistory();
      
      if (data.success && data.payments) {
        console.log('💳 Pagamentos carregados do backend:', data.payments);
        this.renderPayments(data.payments);
      } else {
        console.log('📭 Nenhum pagamento encontrado no backend');
        this.renderPayments([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pagamentos:', error);
      paymentsList.innerHTML = '<div class="error">Erro ao carregar pagamentos</div>';
    }
  }

  // Renderizar pagamentos
  renderPayments(payments) {
    const paymentsList = document.getElementById('paymentsList');
    
    if (payments.length === 0) {
      paymentsList.innerHTML = '<div class="empty">Nenhum pagamento encontrado</div>';
      return;
    }

    const html = payments.map(payment => `
      <div class="payment-card">
        <div class="payment-header">
          <h4>${payment.description}</h4>
          <span class="payment-status ${payment.status}">${this.getPaymentStatusText(payment.status)}</span>
        </div>
        <div class="payment-details">
          <p><strong>Valor:</strong> R$ ${payment.amount.toFixed(2)}</p>
          <p><strong>Data:</strong> ${new Date(payment.date).toLocaleDateString('pt-BR')}</p>
          <p><strong>Método:</strong> ${payment.method}</p>
          <p><strong>ID da Transação:</strong> ${payment.transactionId}</p>
        </div>
        <div class="payment-actions">
          <button class="btn-small" onclick="authModals.downloadReceipt('${payment.id}')">📄 Comprovante</button>
        </div>
      </div>
    `).join('');

    paymentsList.innerHTML = html;
  }

  // Carregar perfil
  async loadProfile() {
    const profileInfo = document.getElementById('profileInfo');
    const user = landingAuth.currentUser;
    
    profileInfo.innerHTML = `
      <div class="profile-card">
        <div class="profile-header">
          <h4>Informações Pessoais</h4>
          <button class="btn-small" onclick="authModals.editProfile()">✏️ Editar</button>
        </div>
        <div class="profile-details">
          <p><strong>Nome:</strong> ${user.name}</p>
          <p><strong>E-mail:</strong> ${user.email}</p>
          <p><strong>Telefone:</strong> ${user.phone || 'Não informado'}</p>
          <p><strong>Membro desde:</strong> ${new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    `;
  }

  // Mostrar tab
  showTab(tabName) {
    // Remover active de todas as tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar tab selecionada
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
  }

  // Utilitários
  getStatusText(status) {
    console.log('🔍 getStatusText chamado com status:', status);
    const statusMap = {
      'active': 'Ativa',
      'used': 'Usada',
      'expired': 'Expirada',
      'cancelled': 'Cancelada',
      'paid': 'Paga'
    };
    const result = statusMap[status] || status;
    console.log('🔍 getStatusText retornando:', result);
    return result;
  }

  getPaymentStatusText(status) {
    const statusMap = {
      'completed': 'Concluído',
      'pending': 'Pendente',
      'failed': 'Falhou',
      'refunded': 'Reembolsado'
    };
    return statusMap[status] || status;
  }

  // Ações
  async copyLicense(code) {
    await navigator.clipboard.writeText(code);
    this.showSuccessMessage('Código copiado para a área de transferência!');
  }

  async resendLicense(licenseId) {
    const result = await landingAuth.resendLicense(licenseId);
    if (result.success) {
      this.showSuccessMessage(result.message);
    } else {
      this.showErrorMessage(result.error);
    }
  }

  downloadLicense(licenseId) {
    // Implementar download de licença
    console.log('📄 Download licença:', licenseId);
    this.showSuccessMessage('Download iniciado!');
  }

  downloadReceipt(paymentId) {
    // Implementar download de comprovante
    console.log('📄 Download comprovante:', paymentId);
    this.showSuccessMessage('Comprovante baixado!');
  }

  editProfile() {
    // Implementar edição de perfil
    console.log('✏️ Editar perfil');
  }

  refreshLicenses() {
    this.loadLicenses();
  }

  refreshPayments() {
    this.loadPayments();
  }

  // Mensagens
  showSuccessMessage(message) {
    // Implementar sistema de notificações
    console.log('✅', message);
    alert(message);
  }

  showErrorMessage(message) {
    // Implementar sistema de notificações
    console.log('❌', message);
    alert(message);
  }

  // Configurar formatação automática do telefone
  setupPhoneFormatting() {
    const phoneInput = document.getElementById('registerPhone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
      
      if (value.length > 0) {
        if (value.length <= 2) {
          // Apenas DDD
          value = `(${value}`;
        } else if (value.length <= 6) {
          // DDD + parte do número
          value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length <= 10) {
          // DDD + número completo (8 dígitos)
          value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else {
          // DDD + número completo (9 dígitos)
          value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        }
      }
      
      e.target.value = value;
    });

    // Permitir apenas números e caracteres de formatação
    phoneInput.addEventListener('keydown', (e) => {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      const isNumber = e.key >= '0' && e.key <= '9';
      const isAllowedKey = allowedKeys.includes(e.key);
      
      if (!isNumber && !isAllowedKey) {
        e.preventDefault();
      }
    });
  }

  // Funções para as opções do sidebar
  showMyLicenses() {
    console.log('🔑 Redirecionando para página de licenças...');
    window.location.href = 'minhas-licencas.html';
  }

  showPaymentHistory() {
    console.log('💳 Redirecionando para página de licenças...');
    window.location.href = 'minhas-licencas.html';
  }

  // Criar modal de licenças
  createLicensesModal() {
    // Remover modal existente se houver
    const existingModal = document.getElementById('licensesModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'licensesModal';
    modal.className = 'auth-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '999999';
    
    modal.innerHTML = `
      <div class="auth-modal-content" style="max-width: 800px; max-height: 90vh;">
        <div class="auth-modal-header">
          <h2>🔑 Minhas Licenças</h2>
          <button class="close-btn" onclick="authModals.closeLicensesModal()">&times;</button>
        </div>
        <div class="auth-modal-body">
          <div id="licensesList" class="licenses-list">
            <div class="loading">Carregando licenças...</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.loadLicenses();
  }

  // Mostrar modal de licenças
  showLicensesModal() {
    const modal = document.getElementById('licensesModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  // Fechar modal de licenças
  closeLicensesModal() {
    const modal = document.getElementById('licensesModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

  // Criar modal de pagamentos
  createPaymentsModal() {
    // Remover modal existente se houver
    const existingModal = document.getElementById('paymentsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'paymentsModal';
    modal.className = 'auth-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '999999';
    
    modal.innerHTML = `
      <div class="auth-modal-content" style="max-width: 800px; max-height: 90vh;">
        <div class="auth-modal-header">
          <h2>💳 Histórico de Pagamentos</h2>
          <button class="close-btn" onclick="authModals.closePaymentsModal()">&times;</button>
        </div>
        <div class="auth-modal-body">
          <div id="paymentsList" class="payments-list">
            <div class="loading">Carregando pagamentos...</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.loadPayments();
  }

  // Mostrar modal de pagamentos
  showPaymentsModal() {
    const modal = document.getElementById('paymentsModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  // Fechar modal de pagamentos
  closePaymentsModal() {
    const modal = document.getElementById('paymentsModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

  showSupport() {
    console.log('🆘 Mostrando Suporte...');
    // Implementar modal de suporte
    alert('Funcionalidade "Suporte" em desenvolvimento');
  }

  // Função para alternar visibilidade da senha
  togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.password-icon');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = '🙈';
    } else {
      input.type = 'password';
      icon.textContent = '👁️';
    }
  }
}

// Instância global
const authModals = new AuthModals();

// Event listeners para fechar modais
document.addEventListener('click', function(event) {
  // Fechar modal de login ao clicar fora
  const loginModal = document.getElementById('loginModal');
  if (loginModal && event.target === loginModal) {
    authModals.closeLoginModal();
  }
  
  // Fechar modal de registro ao clicar fora
  const registerModal = document.getElementById('registerModal');
  if (registerModal && event.target === registerModal) {
    authModals.closeRegisterModal();
  }
  
  // Fechar modal da área do cliente ao clicar fora
  const clientAreaModal = document.getElementById('clientAreaModal');
  if (clientAreaModal && event.target === clientAreaModal) {
    authModals.closeClientArea();
  }
});

// Fechar modais com ESC
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const clientAreaModal = document.getElementById('clientAreaModal');
    
    if (loginModal && loginModal.style.display === 'flex') {
      authModals.closeLoginModal();
    } else if (registerModal && registerModal.style.display === 'flex') {
      authModals.closeRegisterModal();
    } else if (clientAreaModal && clientAreaModal.style.display === 'flex') {
      authModals.closeClientArea();
    }
  }
});
