// Modal do Plano Família
let familyPlanModal = null;

// Função para abrir o modal do Plano Família
function openFamilyPlanModal() {
    familyPlanModal = document.getElementById('familyPlanModal');
    if (familyPlanModal) {
        familyPlanModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Inicializar valores e aplicar regra de perfis (3 no total)
        applyFamilyProfilesRule();
        updateFamilyPlanSummary();
        
        // Adicionar event listeners
        document.getElementById('numParents').addEventListener('change', () => {
            applyFamilyProfilesRule();
            updateFamilyPlanSummary();
        });
        document.getElementById('numStudents').addEventListener('change', () => {
            // Mesmo que o usuário tente alterar manualmente, re-aplicamos a regra
            applyFamilyProfilesRule();
            updateFamilyPlanSummary();
        });
    }
}

// Função para fechar o modal
function closeFamilyPlanModal() {
    if (familyPlanModal) {
        familyPlanModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Regra: até 3 perfis por licença; máx 2 responsáveis; alunos = 3 - responsáveis
function applyFamilyProfilesRule() {
    const parentsEl = document.getElementById('numParents');
    const studentsEl = document.getElementById('numStudents');
    if (!parentsEl || !studentsEl) return;

    let numParents = parseInt(parentsEl.value);
    if (isNaN(numParents)) numParents = 1;
    if (numParents < 1) numParents = 1;
    if (numParents > 2) numParents = 2;
    parentsEl.value = String(numParents);

    const maxProfiles = 3;
    const autoStudents = Math.max(0, maxProfiles - numParents);
    studentsEl.value = String(autoStudents);
    studentsEl.disabled = true; // distribuição automática
}

// Função para atualizar o resumo do plano
function updateFamilyPlanSummary() {
    applyFamilyProfilesRule();
    const numParents = parseInt(document.getElementById('numParents').value) || 1;
    const numStudents = parseInt(document.getElementById('numStudents').value) || 0;
    
    const pricePerParent = 19.90;
    const totalPrice = numParents * pricePerParent;
    
    // Atualizar texto dos responsáveis
    document.getElementById('parentsTotal').textContent = `${numParents} × R$ ${pricePerParent.toFixed(2)}`;
    
    // Atualizar texto dos alunos
    document.getElementById('studentsTotal').textContent = `${numStudents} (gratuitos)`;
    
    // Atualizar preço total
    document.getElementById('totalPrice').textContent = `R$ ${totalPrice.toFixed(2)}`;
    
    // Atualizar informação de licenças
    const licenseText = `${numParents} licença${numParents > 1 ? 's' : ''} será${numParents > 1 ? 'ão' : ''} gerada${numParents > 1 ? 's' : ''} para os responsáveis`;
    document.getElementById('licenseInfo').textContent = licenseText;
}

// Função para processar o pagamento
async function processFamilyPlanPayment() {
    applyFamilyProfilesRule();
    const numParents = parseInt(document.getElementById('numParents').value) || 1;
    const numStudents = parseInt(document.getElementById('numStudents').value) || 0;
    
    // Dados do plano família
    const familyPlanData = {
        planType: 'family', // ✅ ADICIONADO: Tipo de plano para Mercado Pago
        numParents: numParents,
        numStudents: numStudents,
        totalLicenses: numParents,
        pricePerLicense: 19.90,
        totalPrice: numParents * 19.90
    };
    
    console.log('Dados do Plano Família:', familyPlanData);
    
    // Verificar se usuário está logado
    if (!landingAuth.isLoggedIn) {
        alert('Você precisa estar logado para contratar um plano. Faça login primeiro.');
        authModals.showLoginModal();
        return;
    }
    
    // Fechar modal do plano
    closeFamilyPlanModal();
    
    // ✅ NOVO: Abrir modal de métodos de pagamento (Mercado Pago)
    console.log('🔍 Verificando se showPaymentMethodsModal existe:', typeof showPaymentMethodsModal);
    
    if (typeof showPaymentMethodsModal === 'function') {
        console.log('✅ Função encontrada, chamando...');
        showPaymentMethodsModal(familyPlanData);
    } else {
        console.error('❌ Função showPaymentMethodsModal não encontrada!');
        console.log('🔍 Funções disponíveis no window:', Object.keys(window).filter(key => key.includes('Payment') || key.includes('Modal')));
        
        // Fallback: mostrar alerta e tentar carregar o script
        alert('Erro: Sistema de pagamento não carregado. Recarregando página...');
        window.location.reload();
    }
}

// Função para mostrar loading do pagamento
function showPaymentLoading() {
    const loadingHtml = `
        <div id="paymentLoading" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 20000;">
            <div style="background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">💳</div>
                <h2 style="color: #ff8c42; margin-bottom: 10px;">Processando Pagamento</h2>
                <p style="color: #666; margin-bottom: 20px;">Aguarde enquanto processamos seu pagamento...</p>
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #ff8c42; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

// Função para esconder loading
function hidePaymentLoading() {
    const loading = document.getElementById('paymentLoading');
    if (loading) {
        loading.remove();
    }
}

// Função para mostrar código da licença
function showLicenseCode(licenseCode, planData) {
    hidePaymentLoading();
    
    const successHtml = `
        <div id="licenseSuccess" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 20000; padding: 16px; box-sizing: border-box;">
            <div style="background: white; padding: 16px; border-radius: 12px; text-align: center; width: 100%; max-width: 380px; box-sizing: border-box; position: relative;">
                <button onclick="document.getElementById('licenseSuccess').remove()" aria-label="Fechar" style="position:absolute; right:8px; top:8px; background:transparent; border:none; font-size:20px; color:#6b7280; cursor:pointer;">×</button>
                <div style="font-size: 2rem; margin-bottom: 12px;">🎉</div>
                <h2 style="color: #ff8c42; margin-bottom: 6px; font-size: 1.2rem;">Pagamento Aprovado!</h2>
                <p style="color: #666; margin-bottom: 16px; font-size: 0.85rem;">Sua licença foi gerada com sucesso.</p>
                
                <div style="background: #f8f9fa; border: 2px solid #ff8c42; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <h3 style="color: #ff8c42; margin-bottom: 6px; font-size: 0.9rem;">Código da Licença</h3>
                    <div style="font-family: monospace; font-size: 1rem; font-weight: bold; color: #333; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #ddd; word-break: break-all;">${licenseCode}</div>
                </div>
                
                <div style="background: #e8f5e8; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <h3 style="color: #28a745; margin-bottom: 6px; font-size: 0.9rem;">📋 Resumo do Plano</h3>
                    <p style="margin: 2px 0; font-size: 0.8rem;"><strong>Responsáveis:</strong> ${planData.numParents}</p>
                    <p style="margin: 2px 0; font-size: 0.8rem;"><strong>Alunos:</strong> ${planData.numStudents}</p>
                    <p style="margin: 2px 0; font-size: 0.8rem;"><strong>Total pago:</strong> R$ ${planData.totalPrice.toFixed(2)}</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                    <h3 style="color: #856404; margin-bottom: 6px; font-size: 0.9rem;">📧 Próximos Passos</h3>
                    <ol style="text-align: left; color: #856404; font-size: 0.75rem; padding-left: 12px; margin: 0;">
                        <li style="margin-bottom: 2px;">Anote o código da licença acima</li>
                        <li style="margin-bottom: 2px;">Clique em "Ir para Cadastro"</li>
                        <li style="margin-bottom: 2px;">Selecione "Sou Pai/Responsável"</li>
                        <li style="margin-bottom: 2px;">Insira o código da licença quando solicitado</li>
                        <li>Complete seu cadastro normalmente</li>
                    </ol>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button onclick="goToRegistration('${licenseCode}')" style="background: linear-gradient(135deg, #ff8c42, #ff6b1a); color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; width: 100%;">
                        Ir para Cadastro
                    </button>
                    
                    <button onclick="copyLicenseCode('${licenseCode}')" style="background: #6c757d; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; width: 100%;">
                        Copiar Código
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHtml);
}

// Função para ir para o cadastro
function goToRegistration(licenseCode) {
    document.getElementById('licenseSuccess').remove();
    // Redirecionar para o app em produção
    window.location.href = `https://app.yufin.com.br?license=${licenseCode}&type=family`;
}

// Função para copiar código da licença
function copyLicenseCode(licenseCode) {
    navigator.clipboard.writeText(licenseCode).then(() => {
        alert('Código copiado para a área de transferência!');
    }).catch(() => {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = licenseCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Código copiado para a área de transferência!');
    });
}

// Fechar modal ao clicar fora dele
document.addEventListener('click', function(event) {
    if (familyPlanModal && event.target === familyPlanModal) {
        closeFamilyPlanModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && familyPlanModal && familyPlanModal.style.display === 'flex') {
        closeFamilyPlanModal();
    }
});

// Função para verificar autenticação antes de abrir modal família
function checkAuthAndOpenFamilyPlan() {
    checkAuthAndRedirect('family-plan', () => {
        openFamilyPlanModal();
    });
}
