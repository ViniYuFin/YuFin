// 🔧 INTEGRAÇÃO COM MERCADO PAGO
// Sistema de pagamentos para YüFin

console.log('💳 Mercado Pago JS carregado com sucesso!');

// Verificar se cardform.js foi carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Verificando se showCardPaymentModal foi definida:', typeof window.showCardPaymentModal);
    if (typeof window.showCardPaymentModal === 'function') {
        console.log('✅ Função showCardPaymentModal disponível');
    } else {
        console.error('❌ Função showCardPaymentModal não encontrada! Verifique se cardform.js foi carregado.');
    }
});

// Variáveis globais (usando window para consistência com cardform.js)
window.currentPlanData = null;
window.currentPaymentMethod = null;

// ===========================
// MODAL DE MÉTODOS DE PAGAMENTO
// ===========================

// Abrir modal de métodos de pagamento
function showPaymentMethodsModal(planData) {
    console.log('💳 Abrindo modal de métodos de pagamento:', planData);
    
    window.currentPlanData = planData;
    console.log('💳 DEBUG - window.currentPlanData definido como:', window.currentPlanData);
    
    const modal = document.getElementById('paymentMethodsModal');
    
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Fechar modal de métodos de pagamento
function closePaymentMethodsModal() {
    const modal = document.getElementById('paymentMethodsModal');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // NÃO limpar dados aqui - eles são necessários para o CardForm
    // window.currentPlanData = null;
    // window.currentPaymentMethod = null;
}

// Selecionar método de pagamento
async function selectPaymentMethod(method) {
    console.log('💳 DEBUG - Método selecionado:', method);
    console.log('💳 DEBUG - window.currentPlanData antes:', window.currentPlanData);
    console.log('💳 DEBUG - window.currentPaymentMethod antes:', window.currentPaymentMethod);
    
    window.currentPaymentMethod = method;
    
    console.log('💳 DEBUG - window.currentPaymentMethod após:', window.currentPaymentMethod);
    console.log('💳 DEBUG - window.currentPlanData após:', window.currentPlanData);
    
    // Verificar se é pagamento com cartão
    if (method === 'credit') {
        console.log('💳 Pagamento com cartão - usando CardForm');
        console.log('💳 DEBUG - currentPlanData antes de chamar showCardPaymentModal:', window.currentPlanData);
        
        // Verificar se currentPlanData existe
        if (!window.currentPlanData) {
            console.error('❌ currentPlanData é null! Não é possível prosseguir.');
            alert('Erro: Dados do plano não disponíveis. Tente novamente.');
            return;
        }
        
        // Fechar modal atual e abrir CardForm
        closePaymentMethodsModal();
        
        // Debug: Verificar se a função existe
        console.log('💳 DEBUG - window.showCardPaymentModal existe?', typeof window.showCardPaymentModal);
        console.log('💳 DEBUG - window.currentPlanData antes da chamada:', window.currentPlanData);
        console.log('💳 DEBUG - method antes da chamada:', method);
        
        // Chamar a função
        if (typeof window.showCardPaymentModal === 'function') {
            window.showCardPaymentModal(window.currentPlanData, method);
        } else {
            console.error('❌ window.showCardPaymentModal não está definida!');
            alert('Erro: Função de pagamento não disponível. Recarregue a página e tente novamente.');
        }
        return;
    }
    
    // Se for PIX, mostrar modal PIX
    if (method === 'pix') {
        console.log('📱 Pagamento via PIX');
        
        // Fechar modal atual
        closePaymentMethodsModal();
        
        // Mostrar modal PIX
        await showPixModal();
        return;
    }
    
    try {
        console.log('💳 DEBUG - Iniciando processo de pagamento...');
        
        // Mostrar loading
        showPaymentLoading();
        console.log('💳 DEBUG - Loading exibido');
        
        // Criar preferência de pagamento
        console.log('💳 DEBUG - Chamando createPaymentPreference...');
        const preference = await createPaymentPreference();
        console.log('💳 DEBUG - Preferência retornada:', preference);
        
        if (preference.success) {
            console.log('💳 DEBUG - Preferência criada com sucesso, redirecionando...');
            console.log('💳 DEBUG - initPoint:', preference.initPoint);
            // Redirecionar para Mercado Pago
            redirectToMercadoPago(preference.initPoint);
        } else {
            console.error('💳 DEBUG - Preferência falhou:', preference);
            throw new Error(preference.error || 'Erro ao criar preferência de pagamento');
        }
        
    } catch (error) {
        console.error('❌ DEBUG - Erro completo ao processar pagamento:', error);
        console.error('❌ DEBUG - Tipo do erro:', error.constructor.name);
        console.error('❌ DEBUG - Mensagem do erro:', error.message);
        hidePaymentLoading();
        alert('Erro ao processar pagamento. Tente novamente.');
    }
}

// ===========================
// COMUNICAÇÃO COM BACKEND
// ===========================

// Criar preferência de pagamento
async function createPaymentPreference() {
    try {
        console.log('🔍 DEBUG - Iniciando createPaymentPreference');
        console.log('🔍 DEBUG - currentPlanData:', window.currentPlanData);
        console.log('🔍 DEBUG - currentPaymentMethod:', window.currentPaymentMethod);
        console.log('🔍 DEBUG - Origin:', window.location.origin);
        console.log('🔍 DEBUG - Protocol:', window.location.protocol);
        console.log('🔍 DEBUG - Hostname:', window.location.hostname);
        
        const requestData = {
            planData: window.currentPlanData,
            paymentMethod: window.currentPaymentMethod,
            planType: window.currentPlanData.planType || 'family'
        };
        
        console.log('🔍 DEBUG - Dados da requisição:', requestData);
        
        // Usar backend local em desenvolvimento
        const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost';
        const url = isLocal 
            ? 'http://localhost:3001/api/mercado-pago/create-preference'
            : 'https://yufin-backend.vercel.app/api/mercado-pago/create-preference';
        console.log('🔍 DEBUG - URL da requisição:', url);
        console.log('🔍 DEBUG - isLocal:', isLocal);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('🔍 DEBUG - Response status:', response.status);
        console.log('🔍 DEBUG - Response headers:', response.headers);
        console.log('🔍 DEBUG - Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ DEBUG - Erro da resposta:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ DEBUG - Preferência criada com sucesso:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ DEBUG - Erro completo ao criar preferência:', error);
        console.error('❌ DEBUG - Tipo do erro:', error.constructor.name);
        console.error('❌ DEBUG - Mensagem do erro:', error.message);
        console.error('❌ DEBUG - Stack trace:', error.stack);
        throw error;
    }
}

// ===========================
// REDIRECIONAMENTO
// ===========================

// Redirecionar para Mercado Pago
function redirectToMercadoPago(initPoint) {
    console.log('🚀 Redirecionando para Mercado Pago:', initPoint);
    
    // Fechar modal
    closePaymentMethodsModal();
    
    // Redirecionar
    window.location.href = initPoint;
}

// ===========================
// MODAL PIX
// ===========================

// Abrir modal PIX e criar pagamento
async function showPixModal() {
    try {
        console.log('📱 Abrindo modal PIX...');
        console.log('📱 currentPlanData:', window.currentPlanData);
        
        // Mostrar modal
        const modal = document.getElementById('pixModal');
        if (!modal) {
            console.error('❌ Modal PIX não encontrado!');
            alert('Erro: Modal PIX não encontrado. Recarregue a página.');
            return;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Limpar conteúdo anterior
        const qrContainer = document.getElementById('pixQrCode');
        const copyCodeInput = document.getElementById('pixCopyCode');
        const statusDiv = document.getElementById('pixPaymentStatus');
        
        if (qrContainer) qrContainer.innerHTML = '<p>Carregando QR Code...</p>';
        if (copyCodeInput) copyCodeInput.value = '';
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="status-waiting">
                    <p>⏳ Aguardando pagamento...</p>
                </div>
            `;
        }
        
        // Criar pagamento PIX no backend
        const preference = await createPixPayment();
        console.log('📱 Preferência PIX retornada:', preference);
        
        if (!preference || !preference.success) {
            throw new Error(preference?.error || 'Erro ao criar pagamento PIX');
        }
        
        const pixData = {
            qrCodeBase64: preference.pix_qr_code_base64,
            qrCode: preference.pix_qr_code,
            ticketUrl: preference.pix_ticket_url,
            paymentId: preference.preferenceId
        };
        
        console.log('📱 Dados PIX:', pixData);
        
        // Exibir QR Code
        if (pixData.qrCodeBase64 && qrContainer) {
            qrContainer.innerHTML = `
                <img src="data:image/png;base64,${pixData.qrCodeBase64}" alt="QR Code PIX" />
                <label>Escaneie o QR Code com o app do seu banco</label>
            `;
        } else {
            console.warn('⚠️ QR Code Base64 não disponível');
            if (qrContainer) qrContainer.innerHTML = '<p>Erro ao gerar QR Code</p>';
        }
        
        // Exibir código Copia e Cola
        if (pixData.qrCode && copyCodeInput) {
            copyCodeInput.value = pixData.qrCode;
        }
        
        // Iniciar polling de status
        window.pixPaymentId = pixData.paymentId;
        startPixStatusPolling(pixData.paymentId);
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal PIX:', error);
        alert('Erro ao processar pagamento PIX: ' + error.message);
        closePixModal();
    }
}

// Criar pagamento PIX no backend
async function createPixPayment() {
    try {
        console.log('📱 Criando pagamento PIX no backend...');
        
        // Obter email do usuário logado (se disponível)
        let purchaserEmail = null;
        try {
            // Tentar primeiro 'landingUser' (para landing page)
            const landingUser = localStorage.getItem('landingUser');
            if (landingUser) {
                const user = JSON.parse(landingUser);
                purchaserEmail = user.email;
                console.log('📧 Email do usuário da landing:', purchaserEmail);
            } else {
                // Tentar 'user' (fallback para outras telas)
                const userData = localStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    purchaserEmail = user.email;
                    console.log('📧 Email do usuário (fallback):', purchaserEmail);
                }
            }
        } catch (e) {
            console.warn('⚠️ Não foi possível obter email do usuário:', e);
        }
        
        const requestData = {
            planData: window.currentPlanData,
            paymentMethod: 'pix',
            planType: window.currentPlanData.planType || 'family',
            purchaserEmail: purchaserEmail // Incluir email do comprador
        };
        
        // Usar backend local em desenvolvimento
        const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost';
        const url = isLocal 
            ? 'http://localhost:3001/api/mercado-pago/create-preference'
            : 'https://yufin-backend.vercel.app/api/mercado-pago/create-preference';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Pagamento PIX criado com sucesso:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro ao criar pagamento PIX:', error);
        throw error;
    }
}

// Fechar modal PIX
function closePixModal() {
    const modal = document.getElementById('pixModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Parar polling
    if (window.pixStatusInterval) {
        clearInterval(window.pixStatusInterval);
        window.pixStatusInterval = null;
    }
    
    // Limpar variável
    window.pixPaymentId = null;
}

// Iniciar polling de status do PIX
function startPixStatusPolling(paymentId) {
    console.log('🔍 Iniciando polling de status do PIX:', paymentId);
    
    // Limpar intervalo anterior se existir
    if (window.pixStatusInterval) {
        clearInterval(window.pixStatusInterval);
    }
    
    // Verificar status a cada 3 segundos
    window.pixStatusInterval = setInterval(async () => {
        try {
            await checkPixStatus(paymentId);
        } catch (error) {
            console.error('❌ Erro ao verificar status do PIX:', error);
        }
    }, 3000);
    
    // Primeira verificação imediata
    checkPixStatus(paymentId);
}

// Verificar status do PIX
async function checkPixStatus(paymentId) {
    try {
        console.log('🔍 Verificando status do PIX:', paymentId);
        
        const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost';
        const url = isLocal 
            ? `http://localhost:3001/api/mercado-pago/pix-status/${paymentId}`
            : `https://yufin-backend.vercel.app/api/mercado-pago/pix-status/${paymentId}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 Status do PIX:', result);
        
        const status = result.status || result.payment?.status;
        
        if (status === 'approved') {
            // Pagamento aprovado
            updatePixStatus('approved', '✅ Pagamento aprovado! Redirecionando...');
            clearInterval(window.pixStatusInterval);
            
            // Redirecionar após 2 segundos com todos os dados
            const planData = window.currentPlanData || {};
            const redirectUrl = `planos.html?status=success&plan=${planData.planType || 'family'}&numStudents=${planData.numStudents || 0}&numParents=${planData.numParents || 0}&totalPrice=${planData.totalPrice || 0}`;
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 2000);
        } else if (status === 'rejected' || status === 'cancelled') {
            // Pagamento rejeitado
            updatePixStatus('rejected', '❌ Pagamento rejeitado ou cancelado.');
            clearInterval(window.pixStatusInterval);
        }
        // Se status for 'pending', continua o polling
        
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
    }
}

// Atualizar status na interface
function updatePixStatus(status, message) {
    const statusDiv = document.getElementById('pixPaymentStatus');
    
    if (!statusDiv) return;
    
    let className = 'status-waiting';
    if (status === 'approved') className = 'status-approved';
    if (status === 'rejected') className = 'status-rejected';
    
    statusDiv.innerHTML = `
        <div class="${className}">
            <p>${message}</p>
        </div>
    `;
}

// Copiar código PIX
function copyPixCode() {
    const input = document.getElementById('pixCopyCode');
    if (input) {
        input.select();
        document.execCommand('copy');
        
        // Feedback visual com cor YüFin
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.style.background = '#22c55e'; // Verde sucesso, mais alinhado ao YüFin
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

// ===========================
// INTERFACE DE LOADING
// ===========================

// Mostrar loading
function showPaymentLoading() {
    const modal = document.getElementById('paymentMethodsModal');
    if (modal) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'paymentLoading';
        loadingDiv.className = 'payment-loading';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Processando pagamento...</p>
        `;
        modal.querySelector('.modal-content').appendChild(loadingDiv);
    }
}

// Esconder loading
function hidePaymentLoading() {
    const loadingDiv = document.getElementById('paymentLoading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// ===========================
// INTEGRAÇÃO COM PLANOS EXISTENTES
// ===========================

// Modificar função do Plano Família
function processFamilyPlanPaymentWithMercadoPago() {
    console.log('🏠 Processando pagamento do Plano Família com Mercado Pago');
    
    // Obter dados do plano
    const numParents = parseInt(document.getElementById('numParents').value);
    const numStudents = parseInt(document.getElementById('numStudents').value);
    
    const familyPlanData = {
        planType: 'family',
        numParents: numParents,
        numStudents: numStudents,
        totalLicenses: numParents,
        pricePerLicense: 19.90,
        totalPrice: numParents * 19.90
    };
    
    console.log('📊 Dados do plano família:', familyPlanData);
    
    // Abrir modal de métodos de pagamento
    showPaymentMethodsModal(familyPlanData);
}

// Modificar função do Plano Escola
function processSchoolPlanPaymentWithMercadoPago() {
    console.log('🏫 Processando pagamento do Plano Escola com Mercado Pago');
    
    // Obter dados do plano
    const numStudents = parseInt(document.getElementById('schoolNumStudents').value);
    const userType = document.getElementById('schoolUserType').value;
    const pricePerStudent = userType === 'teacher' ? 9.90 : 19.90;
    
    const schoolPlanData = {
        planType: 'school',
        numStudents: numStudents,
        userType: userType,
        pricePerStudent: pricePerStudent,
        totalPrice: numStudents * pricePerStudent
    };
    
    console.log('📊 Dados do plano escola:', schoolPlanData);
    
    // Abrir modal de métodos de pagamento
    showPaymentMethodsModal(schoolPlanData);
}

// ===========================
// INICIALIZAÇÃO
// ===========================

// Aguardar carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Mercado Pago: Sistema inicializado');
    
    // Interceptar cliques nos botões de pagamento existentes
    // (Isso será feito modificando os arquivos family-plan.js e school-plan.js)
});

// ===========================
// UTILITÁRIOS
// ===========================

// Verificar se está em ambiente de desenvolvimento
function isDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Log de debug
function debugLog(message, data = null) {
    if (isDevelopment()) {
        console.log(`🔧 Mercado Pago: ${message}`, data);
    }
}

// ✅ Verificar se a função foi definida globalmente
console.log('🔍 Verificando se showPaymentMethodsModal foi definida:', typeof showPaymentMethodsModal);
window.showPaymentMethodsModal = showPaymentMethodsModal;
console.log('🔍 Função adicionada ao window:', typeof window.showPaymentMethodsModal);
