// Modal do Plano Escola
let schoolPlanModal = null;

// Função para abrir o modal do Plano Escola
function openSchoolPlanModal() {
    schoolPlanModal = document.getElementById('schoolPlanModal');
    if (schoolPlanModal) {
        schoolPlanModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Adicionar event listeners com IDs exclusivos deste modal
        const qtyInput = schoolPlanModal.querySelector('#schoolNumStudents');
        const userTypeSelect = schoolPlanModal.querySelector('#schoolUserType');
        if (qtyInput) {
            // Limpar o campo ao abrir para facilitar edição
            qtyInput.value = '';
            qtyInput.addEventListener('input', () => {
                updateSchoolPlanSummary();
            });
            qtyInput.addEventListener('blur', enforceSchoolMinQty);
            // Prevenir que setas do teclado rolem a página dentro do input
            qtyInput.addEventListener('keydown', (e) => {
                if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                }
            });
        }
        if (userTypeSelect) userTypeSelect.addEventListener('change', updateSchoolPlanSummary);

        // Inicializar: botão desabilitado até atingir mínimo
        const continueBtnInit = schoolPlanModal.querySelector('#schoolContinueBtn');
        if (continueBtnInit) { continueBtnInit.disabled = true; continueBtnInit.classList.add('disabled'); }
        // Inicializar resumo
        updateSchoolPlanSummary();
    }
}

// Função para fechar o modal
function closeSchoolPlanModal() {
    if (schoolPlanModal) {
        schoolPlanModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Função para atualizar o resumo do plano
function updateSchoolPlanSummary() {
    if (!schoolPlanModal) return;
    const numStudentsInput = schoolPlanModal.querySelector('#schoolNumStudents');
    const userTypeSelect = schoolPlanModal.querySelector('#schoolUserType');
    const studentsTotalEl = schoolPlanModal.querySelector('#schoolStudentsTotal');
    const totalPriceEl = schoolPlanModal.querySelector('#schoolTotalPrice');
    const licenseInfoEl = schoolPlanModal.querySelector('#schoolLicenseInfo');
    const continueBtn = schoolPlanModal.querySelector('#schoolContinueBtn');

    const rawValue = numStudentsInput ? numStudentsInput.value.trim() : '';
    // Permitir campo vazio durante digitação
    if (rawValue === '') {
        if (studentsTotalEl) studentsTotalEl.textContent = '0 alunos';
        if (totalPriceEl) totalPriceEl.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
        const helpEl = numStudentsInput && numStudentsInput.nextElementSibling && numStudentsInput.nextElementSibling.classList.contains('form-help') ? numStudentsInput.nextElementSibling : null;
        if (numStudentsInput) numStudentsInput.classList.remove('input-error');
        if (helpEl) helpEl.classList.remove('help-error');
        if (continueBtn) { continueBtn.disabled = true; continueBtn.classList.add('disabled'); }
        return;
    }

    // Extrair apenas dígitos para suportar type=text com inputmode numeric
    const digitsOnly = rawValue.replace(/\D+/g, '');
    const numStudentsParsed = parseInt(digitsOnly, 10);
    const isValidNumber = !isNaN(numStudentsParsed) && numStudentsParsed >= 0;
    const numStudents = isValidNumber ? numStudentsParsed : 0;
    const userType = userTypeSelect ? userTypeSelect.value : 'director';
    
    // Não forçar mínimo durante a digitação; apenas feedback visual (aplicado no final da função)
    
    const pricePerStudent = 9.90;
    const totalPrice = numStudents * pricePerStudent;
    
    
    // Atualizar texto dos alunos
    if (studentsTotalEl) studentsTotalEl.textContent = `${numStudents || 0} alunos`;
    
    // Atualizar preço total
    if (totalPriceEl) totalPriceEl.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice);
    
    // Atualizar informação de licenças
    const userTypeText = userType === 'director' ? 'diretor' : 'administrador';
    const licenseText = `1 licença institucional será gerada para o ${userTypeText}`;
    if (licenseInfoEl) licenseInfoEl.textContent = licenseText;
    
    // Feedback visual de erro se < 50 (mas sem bloquear digitação)
    const helpEl = numStudentsInput && numStudentsInput.nextElementSibling && numStudentsInput.nextElementSibling.classList.contains('form-help') ? numStudentsInput.nextElementSibling : null;
    const isError = (rawValue !== '' && (isNaN(numStudentsParsed) || numStudentsParsed < 50));
    if (numStudentsInput) numStudentsInput.classList.toggle('input-error', isError);
    if (helpEl) helpEl.classList.toggle('help-error', isError);

    // Habilitar/desabilitar botão conforme regra
    if (continueBtn) {
        const shouldDisable = (numStudents < 50);
        continueBtn.disabled = shouldDisable;
        continueBtn.classList.toggle('disabled', shouldDisable);
    }
    
}

// Aplicar mínimo de 50 apenas quando o campo perde o foco
function enforceSchoolMinQty() {
    if (!schoolPlanModal) return;
    const input = schoolPlanModal.querySelector('#schoolNumStudents');
    if (!input) return;
    const value = parseInt(input.value, 10);
    console.log('🧪 [Plano Escola] blur - valor:', input.value);
    if (isNaN(value) || value < 50) {
        input.value = 50;
        console.log('🧪 [Plano Escola] aplicado mínimo 50 no blur');
        updateSchoolPlanSummary();
    }
}

// Função para processar o pagamento
async function processSchoolPlanPayment() {
    const numStudents = parseInt(schoolPlanModal.querySelector('#schoolNumStudents').value);
    const userType = schoolPlanModal.querySelector('#schoolUserType').value;
    
    // Validar mínimo de alunos
    if (numStudents < 50) {
        alert('Mínimo de 50 alunos é obrigatório para o Plano Escola.');
        return;
    }
    
    // Dados do plano escola
    const schoolPlanData = {
        planType: 'school', // ✅ ADICIONADO: Tipo de plano para Mercado Pago
        numStudents: numStudents,
        userType: userType,
        pricePerStudent: 9.90,
        totalPrice: numStudents * 9.90
    };
    
    console.log('Dados do Plano Escola:', schoolPlanData);
    
    // Verificar se usuário está logado
    if (!landingAuth.isLoggedIn) {
        alert('Você precisa estar logado para contratar um plano. Faça login primeiro.');
        authModals.showLoginModal();
        return;
    }
    
    // Fechar modal do plano
    closeSchoolPlanModal();
    
    // ✅ NOVO: Abrir modal de métodos de pagamento (Mercado Pago)
    showPaymentMethodsModal(schoolPlanData);
}

// Função para mostrar código da licença escolar
function showSchoolLicenseCode(licenseCode, planData) {
    hidePaymentLoading();
    
    const successHtml = `
        <div id="schoolLicenseSuccess" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 20000; padding: 16px; box-sizing: border-box;">
            <div style="background: white; padding: 16px; border-radius: 12px; text-align: center; width: 100%; max-width: 380px; box-sizing: border-box; position: relative;">
                <button onclick="document.getElementById('schoolLicenseSuccess').remove()" aria-label="Fechar" style="position:absolute; right:8px; top:8px; background:transparent; border:none; font-size:20px; color:#6b7280; cursor:pointer;">×</button>
                <div style="font-size: 2rem; margin-bottom: 12px;">🏫</div>
                <h2 style="color: #3b82f6; margin-bottom: 6px; font-size: 1.2rem;">Pagamento Aprovado!</h2>
                <p style="color: #666; margin-bottom: 16px; font-size: 0.85rem;">Sua licença institucional foi gerada com sucesso.</p>
                
                <div style="background: #f8f9fa; border: 2px solid #3b82f6; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <h3 style="color: #3b82f6; margin-bottom: 6px; font-size: 0.9rem;">Código da Licença Institucional</h3>
                    <div style="font-family: monospace; font-size: 1rem; font-weight: bold; color: #333; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #ddd; word-break: break-all;">${licenseCode}</div>
                </div>
                
                <div style="background: #e8f5e8; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <h3 style="color: #28a745; margin-bottom: 6px; font-size: 0.9rem;">📋 Resumo do Plano</h3>
                    <p style="margin: 2px 0; font-size: 0.8rem;"><strong>Alunos:</strong> ${planData.numStudents}</p>
                    <p style="margin: 2px 0; font-size: 0.8rem;"><strong>Total pago:</strong> R$ ${planData.totalPrice.toFixed(2)}</p>
                    <p style="margin: 2px 0; font-size: 0.8rem;"><strong>Tipo:</strong> ${planData.userType === 'director' ? 'Diretor' : 'Administrador'}</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <h3 style="color: #856404; margin-bottom: 6px; font-size: 0.9rem;">📧 Próximos Passos</h3>
                    <ol style="text-align: left; color: #856404; font-size: 0.75rem; padding-left: 12px; margin: 0;">
                        <li style="margin-bottom: 2px;">Anote o código da licença acima</li>
                        <li style="margin-bottom: 2px;">Clique em "Ir para Cadastro"</li>
                        <li style="margin-bottom: 2px;">Selecione "Sou Diretor/Administrador"</li>
                        <li style="margin-bottom: 2px;">Insira o código da licença quando solicitado</li>
                        <li>Gere tokens para os alunos no painel administrativo</li>
                    </ol>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button onclick="goToSchoolRegistration('${licenseCode}')" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; width: 100%;">
                        Ir para Cadastro
                    </button>
                    
                    <button onclick="copySchoolLicenseCode('${licenseCode}')" style="background: #6c757d; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; width: 100%;">
                        Copiar Código
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHtml);
}

// Função para ir para o cadastro escolar
function goToSchoolRegistration(licenseCode) {
    document.getElementById('schoolLicenseSuccess').remove();
    // Redirecionar para o app em produção
    window.location.href = `https://app.yufin.com.br?license=${licenseCode}&type=school`;
}

// Função para copiar código da licença escolar
function copySchoolLicenseCode(licenseCode) {
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
    if (schoolPlanModal && event.target === schoolPlanModal) {
        closeSchoolPlanModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && schoolPlanModal && schoolPlanModal.style.display === 'flex') {
        closeSchoolPlanModal();
    }
});

// Função para verificar autenticação antes de abrir modal escola
function checkAuthAndOpenSchoolPlan() {
    checkAuthAndRedirect('school-plan', () => {
        openSchoolPlanModal();
    });
}
