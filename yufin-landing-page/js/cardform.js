/**
 * CardForm do Mercado Pago - Implementação seguindo padrão oficial
 * Este arquivo implementa o CardForm conforme documentação do Mercado Pago
 */

// Variáveis globais
let mp = null;
let cardForm = null;

// Verificar se o script foi carregado
console.log('🔧 cardform.js carregado com sucesso!');

// Inicializar Mercado Pago apenas quando necessário
function initializeMercadoPago() {
    if (mp) return; // Já inicializado
    
    console.log('🔧 Inicializando MercadoPago SDK...');
    
    // Verificar se o SDK foi carregado
    if (typeof MercadoPago === 'undefined') {
        console.error('❌ MercadoPago SDK não foi carregado!');
        return;
    }
    
    // Configurar credenciais (usar produção ou teste)
    const isProduction = window.location.hostname.includes('yufin.com.br') || 
                        window.location.hostname.includes('vercel.app');
    
    const publicKey = isProduction 
        ? 'APP_USR-0f92705d-ae9b-4cd9-b424-803b1dd28572' // Produção
        : 'TEST-500e3e9a-25bd-4df8-be87-72c98bd9be03';   // Teste
    
    console.log('🔑 Usando chave pública:', isProduction ? 'PRODUÇÃO' : 'TESTE');
    
    // Inicializar Mercado Pago
    mp = new MercadoPago(publicKey);
    console.log('✅ MercadoPago inicializado com sucesso');
}

/**
 * Inicializar CardForm quando o modal de cartão for aberto
 */
function initializeCardForm(planData, paymentMethod) {
    console.log('🔧 Inicializando CardForm...');
    console.log('📋 Dados do plano:', planData);
    console.log('💳 Método de pagamento:', paymentMethod);
    console.log('🔍 window.currentPlanData:', window.currentPlanData);
    console.log('🔍 window.currentPaymentMethod:', window.currentPaymentMethod);
    
    // Inicializar MercadoPago se necessário
    initializeMercadoPago();
    
    if (!mp) {
        console.error('❌ MercadoPago não foi inicializado!');
        return;
    }
    
    // Armazenar dados atuais
    window.currentPlanData = planData;
    window.currentPaymentMethod = paymentMethod;
    
    // Destruir CardForm anterior se existir
    if (cardForm) {
        try {
            cardForm.unmount();
        } catch (e) {
            console.log('⚠️ CardForm anterior não pôde ser desmontado');
        }
    }
    
    // Verificar se MercadoPago está inicializado
    if (!mp) {
        console.error('❌ MercadoPago não foi inicializado!');
        return;
    }
    
    console.log('🔍 Inicializando CardForm com MercadoPago:', mp);
    
    // Configurar CardForm seguindo padrão do Mercado Pago
    cardForm = mp.cardForm({
        amount: planData.totalPrice.toString(),
        iframe: true,
        form: {
            id: "form-checkout",
            cardNumber: {
                id: "form-checkout__cardNumber",
                placeholder: "Número do cartão",
            },
            expirationDate: {
                id: "form-checkout__expirationDate",
                placeholder: "MM/YY",
            },
            securityCode: {
                id: "form-checkout__securityCode",
                placeholder: "Código de segurança",
            },
            cardholderName: {
                id: "form-checkout__cardholderName",
                placeholder: "Titular do cartão",
            },
            issuer: {
                id: "form-checkout__issuer",
                placeholder: "Banco emissor",
            },
            installments: {
                id: "form-checkout__installments",
                placeholder: "Parcelas",
            },        
            identificationType: {
                id: "form-checkout__identificationType",
                placeholder: "Tipo de documento",
            },
            identificationNumber: {
                id: "form-checkout__identificationNumber",
                placeholder: "Número do documento",
            },
            cardholderEmail: {
                id: "form-checkout__cardholderEmail",
                placeholder: "E-mail",
            },
        },
        callbacks: {
            onFormMounted: error => {
                if (error) {
                    console.warn("❌ Form Mounted handling error:", error);
                    return;
                }
                console.log("✅ Form mounted successfully");
                
                // Adicionar listener de clique ao botão
                const submitButton = document.getElementById('form-checkout__submit');
                if (submitButton) {
                    console.log('🔍 Botão submit encontrado:', submitButton);
                    submitButton.addEventListener('click', function(e) {
                        console.log('🖱️ Botão Pagar clicado!');
                        console.log('🔍 Evento de clique:', e);
                        
                        // Verificar estado do CardForm
                        console.log('🔍 Verificando estado do CardForm...');
                        try {
                            const formData = cardForm.getCardFormData();
                            console.log('🔍 Dados do formulário:', formData);
                            
                            // Verificar se o token está disponível
                            if (formData.token) {
                                console.log('✅ Token já disponível:', formData.token);
                            } else {
                                console.log('⚠️ Token ainda não gerado, aguardando...');
                            }
                            
                        } catch (error) {
                            console.error('❌ Erro ao obter dados do CardForm:', error);
                        }
                        
                        // Forçar submit se o onSubmit não foi chamado automaticamente
                        setTimeout(() => {
                            console.log('🔍 Verificando se onSubmit foi chamado...');
                            // Se não foi chamado em 500ms, forçar manualmente
                            console.log('⚠️ Tentando forçar submit manual...');
                            try {
                                const form = document.getElementById('form-checkout');
                                if (form) {
                                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                    form.dispatchEvent(submitEvent);
                                    console.log('🔍 Evento submit disparado manualmente');
                                }
                            } catch (error) {
                                console.error('❌ Erro ao forçar submit:', error);
                            }
                        }, 500);
                    });
                } else {
                    console.error('❌ Botão submit não encontrado!');
                }
            },
            onSubmit: event => {
                console.log('🚀 Submetendo formulário de pagamento...');
                console.log('🔍 Event object:', event);
                console.log('🔍 Event target:', event.target);
                console.log('🔍 Event currentTarget:', event.currentTarget);
                event.preventDefault();

                try {
                    // Obter dados do formulário
                    const {
                        paymentMethodId: payment_method_id,
                        issuerId: issuer_id,
                        cardholderEmail: email,
                        amount,
                        token,
                        installments,
                        identificationNumber,
                        identificationType,
                    } = cardForm.getCardFormData();

                    console.log('📋 Dados coletados do CardForm:', {
                        payment_method_id,
                        issuer_id,
                        email,
                        amount,
                        token: token ? '***' + token.slice(-4) : 'N/A',
                        installments,
                        identificationNumber,
                        identificationType
                    });

                    // Verificar se o token foi gerado
                    if (!token) {
                        console.error('❌ Token não foi gerado!');
                        alert('Erro ao processar dados do cartão. Tente novamente.');
                        return;
                    }

                    // Preparar dados para envio
                    const paymentData = {
                        token,
                        issuer_id,
                        payment_method_id,
                        transaction_amount: Number(amount),
                        installments: Number(installments),
                        description: `YüFin - ${window.currentPlanData.planType === 'family' ? 'Plano Família' : 'Plano Escola'}`,
                        payer: {
                            email,
                            identification: {
                                type: identificationType,
                                number: identificationNumber,
                            },
                        },
                        // Dados adicionais para criação de licença
                        planData: window.currentPlanData,
                        planType: window.currentPlanData.planType
                    };

                    console.log('📤 Enviando dados para processamento...');
                    console.log('📋 Dados do plano sendo enviados:', {
                        planType: window.currentPlanData.planType,
                        numStudents: window.currentPlanData.numStudents,
                        totalPrice: window.currentPlanData.totalPrice,
                        planData: window.currentPlanData
                    });

                    // Determinar URL do backend
                    const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost';
                    const backendUrl = isLocal 
                        ? 'http://localhost:3001'
                        : 'https://yufin-backend.vercel.app';

                    // Enviar para backend
                    fetch(`${backendUrl}/api/mercado-pago/process-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(paymentData),
                    })
                    .then(response => {
                        console.log('📥 Resposta do backend:', response.status);
                        return response.json();
                    })
                    .then(result => {
                        console.log('✅ Resultado do pagamento:', result);
                        
                        if (result.status === 'approved') {
                            // Pagamento aprovado - redirecionar para sucesso
                            let successUrl;
                            const planData = window.currentPlanData;
                            if (window.location.protocol === 'file:') {
                                // Desenvolvimento local
                                successUrl = `planos.html?status=success&plan=${planData.planType}&licenseCode=${result.licenseCode}&numStudents=${planData.numStudents}&numParents=${planData.numParents || 0}&totalPrice=${planData.totalPrice}`;
                            } else {
                                // Produção
                                successUrl = `${window.location.origin}/planos.html?status=success&plan=${planData.planType}&licenseCode=${result.licenseCode}&numStudents=${planData.numStudents}&numParents=${planData.numParents || 0}&totalPrice=${planData.totalPrice}`;
                            }
                            console.log('🎯 Redirecionando para:', successUrl);
                            console.log('📋 Dados do plano incluídos:', {
                                planType: planData.planType,
                                numStudents: planData.numStudents,
                                numParents: planData.numParents,
                                totalPrice: planData.totalPrice
                            });
                            window.location.href = successUrl;
                        } else {
                            // Pagamento rejeitado ou pendente
                            let failureUrl;
                            const planData = window.currentPlanData;
                            if (window.location.protocol === 'file:') {
                                // Desenvolvimento local
                                failureUrl = `planos.html?status=failure&plan=${planData.planType}&numStudents=${planData.numStudents}&totalPrice=${planData.totalPrice}`;
                            } else {
                                // Produção
                                failureUrl = `${window.location.origin}/planos.html?status=failure&plan=${planData.planType}&numStudents=${planData.numStudents}&totalPrice=${planData.totalPrice}`;
                            }
                            console.log('🎯 Redirecionando para:', failureUrl);
                            window.location.href = failureUrl;
                        }
                    })
                    .catch(error => {
                        console.error('❌ Erro ao processar pagamento:', error);
                        alert('Erro ao processar pagamento. Tente novamente.');
                    });

                } catch (error) {
                    console.error('❌ Erro no callback onSubmit:', error);
                    alert('Erro ao processar dados do cartão. Tente novamente.');
                }
            },
            onFetching: (resource) => {
                console.log("🔄 Fetching resource:", resource);

                // Animar barra de progresso
                const progressBar = document.querySelector(".progress-bar");
                if (progressBar) {
                    progressBar.removeAttribute("value");
                }

                return () => {
                    if (progressBar) {
                        progressBar.setAttribute("value", "0");
                    }
                };
            }
        },
    });
    
    console.log('✅ CardForm inicializado com sucesso');
    console.log('🔍 CardForm object:', cardForm);
    console.log('🔍 CardForm methods:', Object.getOwnPropertyNames(cardForm));
    
    // Verificar se o formulário está conectado
    const form = document.getElementById('form-checkout');
    if (form) {
        console.log('🔍 Formulário encontrado:', form);
        console.log('🔍 Formulário conectado ao CardForm:', form.hasAttribute('data-mp-form'));
    } else {
        console.error('❌ Formulário não encontrado!');
    }
}

/**
 * Mostrar modal de pagamento com cartão
 */
window.showCardPaymentModal = function(planData, paymentMethod) {
    console.log('💳 Abrindo modal de pagamento com cartão...');
    console.log('💳 Dados recebidos:', { planData, paymentMethod });
    
    // Validar dados recebidos
    if (!planData) {
        console.error('❌ Dados do plano não fornecidos!');
        alert('Erro: Dados do plano não disponíveis. Tente novamente.');
        return;
    }
    
    // Fechar modal de métodos de pagamento
    closePaymentMethodsModal();
    
    // Mostrar modal de cartão
    const modal = document.getElementById('cardPaymentModal');
    console.log('💳 DEBUG - Modal encontrado?', !!modal);
    if (modal) {
        console.log('💳 DEBUG - Adicionando classe show ao modal');
        modal.classList.add('show');
        // Forçar display via JavaScript para sobrescrever qualquer CSS
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '9999';
        document.body.style.overflow = 'hidden';
        console.log('💳 DEBUG - Modal classes após show:', modal.className);
        console.log('💳 DEBUG - Modal style display após JS:', modal.style.display);
        
        // Inicializar CardForm após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            initializeCardForm(planData, paymentMethod);
        }, 100);
    }
}

/**
 * Fechar modal de pagamento com cartão
 */
window.closeCardPaymentModal = function() {
    console.log('❌ Fechando modal de pagamento com cartão...');
    
    const modal = document.getElementById('cardPaymentModal');
    if (modal) {
        modal.classList.remove('show');
        // Forçar ocultação via JavaScript
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        document.body.style.overflow = '';
    }
    
    // Limpar dados
    window.currentPlanData = null;
    window.currentPaymentMethod = null;
    
    // Destruir CardForm
    if (cardForm) {
        try {
            cardForm.unmount();
            cardForm = null;
        } catch (e) {
            console.log('⚠️ Erro ao desmontar CardForm:', e);
        }
    }
}

// Funções já estão globais através de window.functionName
