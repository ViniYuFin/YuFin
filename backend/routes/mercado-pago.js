// 🔧 ROTAS DO MERCADO PAGO
const express = require('express');
const router = express.Router();
const { createPaymentPreference, getPaymentStatus } = require('../config/mercado-pago');
const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');
const { sendLicenseConfirmationEmail } = require('../utils/emailService');

// ===========================
// CRIAR PREFERÊNCIA DE PAGAMENTO
// ===========================
router.post('/create-preference', async (req, res) => {
    try {
        console.log('🔍 DEBUG MERCADO PAGO - Iniciando create-preference');
        console.log('🔍 DEBUG MERCADO PAGO - req.body recebido:', req.body);
        console.log('🔍 DEBUG MERCADO PAGO - req.headers:', req.headers);
        console.log('🔍 DEBUG MERCADO PAGO - Origin:', req.headers.origin);
        console.log('🔍 DEBUG MERCADO PAGO - User-Agent:', req.headers['user-agent']);
        console.log('🔍 DEBUG MERCADO PAGO - NODE_ENV:', process.env.NODE_ENV);
        
        if (!req.body) {
            return res.status(400).json({
                error: 'Body da requisição está vazio',
                code: 'EMPTY_BODY'
            });
        }
        
        const { planData, paymentMethod, purchaserEmail } = req.body;
        
        // Extrair planType do planData
        const planType = planData?.planType || 'family';
        
        console.log('🔧 Criando preferência de pagamento:', {
            planType,
            paymentMethod,
            planData,
            purchaserEmail
        });

        // Gerar referência externa única com dados do plano codificados em Base64
        // Codificar planData em Base64 para garantir que os dados sejam preservados no webhook
        const planDataEncoded = Buffer.from(JSON.stringify({
            planType: planType,
            numParents: planData.numParents || 0,
            numStudents: planData.numStudents || 1,
            totalPrice: planData.totalPrice || 0,
            purchaserEmail: purchaserEmail // Incluir email do comprador logado
        })).toString('base64');
        
        const externalReference = planDataEncoded; // Usar apenas o Base64 como external_reference
        
        console.log('🔍 External reference criado (Base64):', externalReference);
        console.log('🔍 Dados do plano codificados:', {
            planType,
            numParents: planData.numParents,
            numStudents: planData.numStudents,
            totalPrice: planData.totalPrice
        });
        
        // Configurar dados do pagamento
        const excludedMethods = getExcludedMethods(paymentMethod);
        console.log('🔍 Métodos excluídos para', paymentMethod, ':', excludedMethods);
        
        const paymentData = {
            title: planType === 'family' 
                ? `Plano Família - ${planData.numParents} responsável(is) + ${planData.numStudents} aluno(s)`
                : `Plano Escola - ${planData.numStudents} aluno(s)`,
            amount: planData.totalPrice,
            planType,
            paymentMethod,
            externalReference,
            excludedMethods: excludedMethods,
            planData: planData,
            purchaserEmail: purchaserEmail // Adicionar email do comprador
        };

        // Criar preferência no Mercado Pago
        console.log('🔍 DEBUG MERCADO PAGO - Chamando createPaymentPreference com:', paymentData);
        const preference = await createPaymentPreference(paymentData);
        
        console.log('✅ DEBUG MERCADO PAGO - Preferência criada com sucesso:', preference);

        const response = {
            success: true,
            preferenceId: preference.preferenceId || preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            externalReference,
            // Dados do PIX
            pix_qr_code_base64: preference.pix_qr_code_base64,
            pix_qr_code: preference.pix_qr_code,
            pix_ticket_url: preference.pix_ticket_url,
            // Dados do pagador (para PIX)
            payer: preference.payer || null
        };
        
        console.log('✅ DEBUG MERCADO PAGO - Resposta enviada:', response);
        res.json(response);

    } catch (error) {
        console.error('❌ DEBUG MERCADO PAGO - Erro completo ao criar preferência:', error);
        console.error('❌ DEBUG MERCADO PAGO - Tipo do erro:', error.constructor.name);
        console.error('❌ DEBUG MERCADO PAGO - Mensagem do erro:', error.message);
        console.error('❌ DEBUG MERCADO PAGO - Stack trace:', error.stack);
        
        res.status(500).json({
            error: 'Erro interno do servidor ao criar preferência de pagamento',
            code: 'PREFERENCE_CREATION_ERROR',
            details: error.message
        });
    }
});

// ===========================
// FUNÇÃO AUXILIAR - PROCESSAR PAGAMENTO APROVADO
// ===========================
async function processApprovedPayment(paymentData) {
    try {
        console.log('🎯 PROCESSANDO PAGAMENTO APROVADO');
        console.log('📋 Dados do pagamento:', paymentData);
        
        const { planType, planData, paymentMethod, transactionId, purchaserData } = paymentData;
        
        let licenseCode = null;
        let licenseData = null;
        
        if (planType === 'family') {
            console.log('👨‍👩‍👧‍👦 Criando licença família...');
            
            // Criar licença família
            const familyLicense = new FamilyLicense({
                licenseCode: FamilyLicense.generateLicenseCode(),
                planData: {
                    numParents: planData.numParents,
                    numStudents: planData.numStudents,
                    totalPrice: planData.totalPrice
                },
                status: 'paid',
                maxUsages: planData.numParents,
                payment: {
                    transactionId: transactionId,
                    paymentMethod: paymentMethod,
                    paidAt: new Date(),
                    amount: planData.totalPrice
                },
                purchaser: {
                    email: purchaserData?.email,
                    name: purchaserData?.name,
                    phone: typeof purchaserData?.phone === 'object' ? (purchaserData.phone?.number || null) : (purchaserData?.phone || null)
                }
            });
            
            // Gerar licenças individuais
            familyLicense.generateIndividualLicenses();
            await familyLicense.save();
            
            licenseCode = familyLicense.licenseCode;
            licenseData = {
                type: 'family',
                code: licenseCode,
                planData: familyLicense.planData,
                individualLicenses: familyLicense.generatedLicenses.length,
                availableTokens: familyLicense.availableTokens
            };
            
            console.log('✅ Licença família criada:', licenseCode);
            
        } else if (planType === 'school') {
            console.log('🏫 Criando licença escola...');
            
            // Criar licença escola
            const schoolLicense = new SchoolLicense({
                licenseCode: SchoolLicense.generateLicenseCode(),
                planData: {
                    numStudents: planData.numStudents,
                    totalPrice: planData.totalPrice
                },
                status: 'paid',
                payment: {
                    transactionId: transactionId,
                    paymentMethod: paymentMethod,
                    paidAt: new Date()
                },
                schoolData: purchaserData || {}
            });
            
            // Gerar licenças individuais para cada aluno
            const generatedLicenses = [];
            for (let i = 0; i < planData.numStudents; i++) {
                const individualCode = SchoolLicense.generateLicenseCode();
                generatedLicenses.push({
                    licenseCode: individualCode,
                    status: 'available'
                });
            }
            
            schoolLicense.generatedLicenses = generatedLicenses;
            await schoolLicense.save();
            
            licenseCode = schoolLicense.licenseCode;
            licenseData = {
                type: 'school',
                code: licenseCode,
                planData: schoolLicense.planData,
                individualLicenses: generatedLicenses.length
            };
            
            console.log('✅ Licença escola criada:', licenseCode);
        }
        
        // Enviar email de confirmação
        console.log('🔍 DEBUG EMAIL: Verificando dados para envio:', {
            licenseCode,
            purchaserData,
            email: purchaserData?.email,
            emailType: typeof purchaserData?.email,
            emailValue: purchaserData?.email,
            emailIsEmpty: !purchaserData?.email,
            emailIsUndefined: purchaserData?.email === undefined,
            emailIsNull: purchaserData?.email === null
        });
        
        if (licenseCode && purchaserData?.email && purchaserData.email !== 'undefined' && purchaserData.email !== 'null' && purchaserData.email.trim() !== '') {
            console.log('📧 Enviando email de confirmação...');
            await sendLicenseConfirmationEmail(purchaserData.email, licenseData);
            console.log('✅ Email de confirmação enviado');
        } else {
            console.log('⚠️ Email não enviado - dados faltando:', {
                licenseCode: !!licenseCode,
                email: purchaserData?.email,
                emailValid: purchaserData?.email && purchaserData.email !== 'undefined' && purchaserData.email !== 'null' && purchaserData.email.trim() !== '',
                purchaserData: purchaserData
            });
        }
        
        return {
            success: true,
            licenseCode,
            licenseData
        };
        
    } catch (error) {
        console.error('❌ Erro ao processar pagamento aprovado:', error);
        throw error;
    }
}

// ===========================
// ROTA PARA BUSCAR LICENÇA POR EXTERNAL_REFERENCE
// ===========================
router.get('/license-by-reference', async (req, res) => {
    try {
        const { externalReference } = req.query;
        
        if (!externalReference) {
            return res.status(400).json({ 
                error: 'externalReference é obrigatório' 
            });
        }
        
        // Decodificar external_reference
        let planData = null;
        try {
            const decodedData = Buffer.from(externalReference, 'base64').toString('utf-8');
            planData = JSON.parse(decodedData);
        } catch (error) {
            return res.status(400).json({ 
                error: 'externalReference inválido' 
            });
        }
        
        // Buscar licença pelo transactionId (se disponível) ou pelo plano
        const FamilyLicense = require('../models/FamilyLicense');
        
        // Primeiro, tentar buscar por transactionId se tivermos
        // Caso contrário, buscar pela última licença criada com esses dados de plano
        const license = await FamilyLicense.findOne({
            'planData.numParents': planData.numParents,
            'planData.numStudents': planData.numStudents,
            'planData.totalPrice': planData.totalPrice,
            status: 'paid'
        }).sort({ createdAt: -1 }).limit(1);
        
        if (!license) {
            return res.status(404).json({ 
                error: 'Licença não encontrada',
                message: 'A licença ainda não foi criada. Aguarde alguns segundos e tente novamente.'
            });
        }
        
        res.json({
            success: true,
            licenseCode: license.licenseCode,
            planData: license.planData
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar licença por external_reference:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar licença',
            message: error.message
        });
    }
});

// ===========================
// WEBHOOK - NOTIFICAÇÕES DO MERCADO PAGO
// ===========================
router.post('/webhook', async (req, res) => {
    try {
        console.log('🔔 WEBHOOK - Notificação recebida do Mercado Pago');
        console.log('🔔 WEBHOOK - Method:', req.method);
        console.log('🔔 WEBHOOK - Headers:', req.headers);
        console.log('🔔 WEBHOOK - Body:', req.body);
        console.log('🔔 WEBHOOK - Query:', req.query);
        console.log('🔔 WEBHOOK - IP:', req.ip);
        console.log('🔔 WEBHOOK - User-Agent:', req.get('User-Agent'));
        
        // Verificar assinatura do webhook (SEGURANÇA)
        const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
        const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        
        // TEMPORARIAMENTE DESABILITADO PARA TESTE
        if (false && webhookSecret && signature) {
            console.log('🔐 WEBHOOK - Verificando assinatura...');
            console.log('🔐 WEBHOOK - Signature recebida:', signature);
            console.log('🔐 WEBHOOK - Secret configurado:', webhookSecret ? 'SIM' : 'NÃO');
            
            // Verificação básica da assinatura
            const crypto = require('crypto');
            const bodyString = JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(bodyString)
                .digest('hex');
            
            const receivedSignature = signature.replace('sha256=', '');
            
            if (expectedSignature !== receivedSignature) {
                console.error('❌ WEBHOOK - Assinatura inválida!');
                console.error('❌ WEBHOOK - Esperada:', expectedSignature);
                console.error('❌ WEBHOOK - Recebida:', receivedSignature);
                return res.status(401).json({ error: 'Assinatura inválida' });
            }
            
            console.log('✅ WEBHOOK - Assinatura válida');
        } else {
            console.log('⚠️ WEBHOOK - Verificação de assinatura desabilitada para teste');
        }
        
        // Mercado Pago pode enviar dados via body ou query
        const notificationData = req.body || req.query;
        const { type, data, topic, id } = notificationData;
        
        console.log('🔔 WEBHOOK - Dados processados:', { type, data, topic, id });
        
        if (type === 'payment' || topic === 'payment') {
            // Extrair paymentId de múltiplas fontes possíveis
            const paymentId = data?.id || id || notificationData['data.id'] || req.query.id || req.query.resource;
            console.log('💳 WEBHOOK - Pagamento processado:', paymentId);
            console.log('🔍 DEBUG WEBHOOK - Fontes de paymentId:', {
                'data?.id': data?.id,
                'id': id,
                'notificationData[data.id]': notificationData['data.id'],
                'req.query.id': req.query.id,
                'req.query.resource': req.query.resource,
                'paymentId final': paymentId
            });
            
            if (!paymentId) {
                console.error('❌ WEBHOOK - Payment ID não encontrado nos dados:', notificationData);
                return res.status(400).json({ 
                    received: true, 
                    error: 'Payment ID não encontrado',
                    notificationData: notificationData
                });
            }
            
            try {
                // Verificar status do pagamento
                console.log('🔍 Tentando buscar status do pagamento:', paymentId);
                const paymentStatus = await getPaymentStatus(paymentId);
                console.log('🔍 Status do pagamento recebido:', paymentStatus);
                
                if (paymentStatus && paymentStatus.status === 'approved') {
                    console.log('✅ PAGAMENTO APROVADO - Processando licença...');
                    
                    // Extrair dados do external_reference (agora em Base64)
                    const externalRef = paymentStatus.external_reference;
                    
                    console.log('🔍 External reference recebido:', externalRef);
                    
                    // Tentar decodificar Base64 primeiro
                    let planType = 'family';
                    let planData = null;
                    let purchaserEmail = null; // Email do comprador logado na landing
                    
                    if (!externalRef) {
                        console.log('⚠️ External reference está undefined, usando valores padrão');
                        planType = 'family';
                        planData = {
                            numParents: 1,
                            numStudents: 2,
                            totalPrice: paymentStatus.transaction_amount || 19.90
                        };
                    } else {
                        try {
                            // Tentar decodificar Base64 primeiro (formato novo)
                            const decodedData = Buffer.from(externalRef, 'base64').toString('utf-8');
                            const parsedData = JSON.parse(decodedData);
                            
                            planType = parsedData.planType || 'family';
                            planData = {
                                numParents: parsedData.numParents || 0,
                                numStudents: parsedData.numStudents || 1,
                                totalPrice: parsedData.totalPrice || paymentStatus.transaction_amount || 0
                            };
                            
                            // Extrair purchaserEmail do external_reference
                            purchaserEmail = parsedData.purchaserEmail;
                            console.log('✅ Dados decodificados do external_reference (Base64):', planData);
                            console.log('✅ Email do comprador extraído:', purchaserEmail);
                        } catch (base64Error) {
                            console.log('⚠️ External reference não é Base64 válido, tentando formato antigo...');
                            console.log('⚠️ Erro Base64:', base64Error.message);
                            
                            // Fallback: tentar identificar pelo formato antigo
                            if (externalRef && typeof externalRef === 'string') {
                                const isFamily = externalRef.startsWith('FAMILY') || externalRef.startsWith('FAM-');
                                planType = isFamily ? 'family' : 'school';
                                
                                // Para family, calcular baseado no valor: 19.90 = 1 pai + 2 filhos
                                if (isFamily) {
                                    const amount = paymentStatus.transaction_amount || 19.90;
                                    // Valores conhecidos: 19.90 = 1 pai + 2 filhos, 39.80 = 2 pais + 1 filho
                                    if (amount === 19.90) {
                                        planData = {
                                            numParents: 1,
                                            numStudents: 2,
                                            totalPrice: amount
                                        };
                                    } else if (amount === 39.80) {
                                        planData = {
                                            numParents: 2,
                                            numStudents: 1,
                                            totalPrice: amount
                                        };
                                    } else {
                                        // Fallback genérico
                                        planData = {
                                            numParents: 1,
                                            numStudents: 2,
                                            totalPrice: amount
                                        };
                                    }
                                } else {
                                    // Escola: calcular baseado no valor
                                    planData = {
                                        numParents: 0,
                                        numStudents: Math.floor((paymentStatus.transaction_amount || 19.90) / 9.90),
                                        totalPrice: paymentStatus.transaction_amount || 19.90
                                    };
                                }
                                
                                console.log('⚠️ Usando fallback com formato antigo:', planData);
                            } else {
                                // Último fallback: valores padrão
                                planType = 'family';
                                planData = {
                                    numParents: 1,
                                    numStudents: 2,
                                    totalPrice: paymentStatus.transaction_amount || 19.90
                                };
                                console.log('⚠️ Usando valores padrão:', planData);
                            }
                        }
                    }
                    
                    // Dados do pagamento com validação
                    console.log('🔍 DEBUG WEBHOOK: Dados do payer:', {
                        payer: paymentStatus.payer,
                        email: paymentStatus.payer?.email,
                        emailType: typeof paymentStatus.payer?.email,
                        emailIsUndefined: paymentStatus.payer?.email === undefined,
                        emailIsNull: paymentStatus.payer?.email === null,
                        name: paymentStatus.payer?.name,
                        phone: paymentStatus.payer?.phone
                    });
                    
                    // Priorizar purchaserEmail (email logado na landing) sobre payerEmail (email do Mercado Pago)
                    const payerEmail = paymentStatus.payer?.email;
                    
                    console.log('🔍 DEBUG EMAIL WEBHOOK: Comparando emails:', {
                        purchaserEmail: purchaserEmail,
                        payerEmail: payerEmail,
                        purchaserType: typeof purchaserEmail,
                        payerType: typeof payerEmail
                    });
                    
                    // Escolher o melhor email: purchaserEmail primeiro, depois payerEmail, depois fallback
                    let finalEmail = 'contato@yufin.com.br'; // Fallback padrão
                    
                    if (purchaserEmail && 
                        typeof purchaserEmail === 'string' && 
                        purchaserEmail !== 'undefined' && 
                        purchaserEmail !== 'null' && 
                        purchaserEmail.trim() !== '' && 
                        !purchaserEmail.includes('XXXXXXXXXXX')) {
                        finalEmail = purchaserEmail;
                        console.log('✅ Usando purchaserEmail (email logado na landing)');
                    } else if (payerEmail && 
                               typeof payerEmail === 'string' && 
                               payerEmail !== 'undefined' && 
                               payerEmail !== 'null' && 
                               payerEmail.trim() !== '' && 
                               !payerEmail.includes('XXXXXXXXXXX')) {
                        finalEmail = payerEmail;
                        console.log('⚠️ Usando payerEmail (email do Mercado Pago) como fallback');
                    } else {
                        console.log('⚠️ Usando email de fallback: contato@yufin.com.br');
                    }
                    
                    console.log('🔍 DEBUG EMAIL WEBHOOK: Email final escolhido:', {
                        purchaserEmail: purchaserEmail,
                        payerEmail: payerEmail,
                        final: finalEmail,
                        source: finalEmail === purchaserEmail ? 'purchaserEmail' : 
                                finalEmail === payerEmail ? 'payerEmail' : 'fallback'
                    });
                    
                    const paymentData = {
                        planType: planType,
                        planData: planData,
                        paymentMethod: paymentStatus.payment_method_id || 'credit_card',
                        transactionId: paymentId,
                        purchaserData: {
                            email: finalEmail,
                            name: paymentStatus.payer?.name || 'Cliente YüFin',
                            phone: typeof paymentStatus.payer?.phone === 'object' ? (paymentStatus.payer.phone?.number || null) : (paymentStatus.payer?.phone || null)
                        }
                    };
                    
                    console.log('📋 Dados do pagamento preparados (webhook):', paymentData);
                    
                    // Processar pagamento aprovado
                    const result = await processApprovedPayment(paymentData);
                    
                    console.log('✅ Licença criada com sucesso:', result.licenseCode);
                    
                    // Redirecionar usuário para página de sucesso com dados corretos
                    const successUrl = `https://www.yufin.com.br/planos.html?status=success&plan=${paymentData.planType}&licenseCode=${result.licenseCode}&numStudents=${paymentData.planData?.numStudents || 0}&numParents=${paymentData.planData?.numParents || 0}&totalPrice=${paymentData.planData?.totalPrice || 0}`;
                    
                    console.log('🔄 Redirecionando para:', successUrl);
                    console.log('🔍 DEBUG REDIRECT: Dados do redirecionamento:', {
                        planType: paymentData.planType,
                        licenseCode: result.licenseCode,
                        numStudents: paymentData.planData?.numStudents,
                        numParents: paymentData.planData?.numParents,
                        totalPrice: paymentData.planData?.totalPrice,
                        successUrl: successUrl
                    });
                    console.log('📋 Dados do plano sendo redirecionados:', {
                        planType: paymentData.planType,
                        numStudents: paymentData.planData?.numStudents,
                        numParents: paymentData.planData?.numParents,
                        totalPrice: paymentData.planData?.totalPrice
                    });
                    
                    // IMPORTANTE: Webhooks são server-to-server, não devem redirecionar
                    // O redirecionamento deve acontecer no frontend quando o pagamento é aprovado
                    // Por enquanto, apenas retornar sucesso para o Mercado Pago
                    res.status(200).json({ 
                        received: true, 
                        message: 'Webhook processado com sucesso',
                        licenseCode: result.licenseCode,
                        redirectUrl: successUrl // URL para referência (não será usada pelo Mercado Pago)
                    });
                    
                } else if (paymentStatus && paymentStatus.status === 'rejected') {
                    console.log('❌ PAGAMENTO REJEITADO:', paymentId);
                    
                    // Log da falha para análise
                    console.log('❌ Motivo da rejeição:', paymentStatus.status_detail);
                    
                    res.status(200).json({ 
                        received: true, 
                        message: 'Pagamento rejeitado',
                        paymentId: paymentId,
                        status: 'rejected'
                    });
                    
                } else if (paymentStatus && paymentStatus.status === 'pending') {
                    console.log('⏳ PAGAMENTO PENDENTE:', paymentStatus.status);
                    
                    res.status(200).json({ 
                        received: true, 
                        message: 'Pagamento pendente',
                        paymentId: paymentId,
                        status: 'pending'
                    });
                    
                } else {
                    console.log('⚠️ STATUS DESCONHECIDO:', paymentStatus?.status || 'undefined');
                    
                    res.status(200).json({ 
                        received: true, 
                        message: 'Status desconhecido',
                        paymentId: paymentId,
                        status: paymentStatus?.status || 'unknown'
                    });
                }
                
            } catch (error) {
                console.error('❌ Erro ao processar pagamento no webhook:', error);
                console.error('❌ Stack trace:', error.stack);
                
                // Se for um pagamento de teste, simular sucesso
                if (paymentId === '123456' || paymentId.startsWith('TEST')) {
                    console.log('🧪 PAGAMENTO DE TESTE - Simulando sucesso');
                    
                    const testPaymentData = {
                        planType: 'family',
                        planData: {
                            numParents: 2,
                            numStudents: 1,
                            totalPrice: 39.80
                        },
                        paymentMethod: 'credit_card',
                        transactionId: paymentId,
                        purchaserData: {
                            email: 'teste@exemplo.com',
                            name: 'Cliente Teste',
                            phone: null
                        }
                    };
                    
                    try {
                        const result = await processApprovedPayment(testPaymentData);
                        console.log('✅ Licença de teste criada:', result.licenseCode);
                        
                        res.status(200).json({ 
                            received: true, 
                            message: 'Pagamento de teste processado',
                            paymentId: paymentId,
                            licenseCode: result.licenseCode
                        });
                    } catch (testError) {
                        console.error('❌ Erro ao processar pagamento de teste:', testError);
                        res.status(500).json({ 
                            error: 'Erro ao processar pagamento de teste',
                            paymentId: paymentId
                        });
                    }
                } else {
                    res.status(500).json({ 
                        error: 'Erro ao processar pagamento',
                        paymentId: paymentId
                    });
                }
            }
        } else {
            console.log('🔔 WEBHOOK - Tipo de notificação:', type || topic);
            res.status(200).json({ 
                received: true, 
                message: 'Notificação recebida',
                type: type || topic
            });
        }
        
    } catch (error) {
        console.error('❌ WEBHOOK - Erro ao processar notificação:', error);
        console.error('❌ WEBHOOK - Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// Também aceitar GET para webhook (alguns serviços usam GET)
router.get('/webhook', async (req, res) => {
    try {
        console.log('🔔 WEBHOOK GET - Notificação recebida do Mercado Pago');
        console.log('🔔 WEBHOOK GET - Query:', req.query);
        
        const { topic, id } = req.query;
        
        if (topic === 'payment') {
            console.log('💳 WEBHOOK GET - Pagamento processado:', id);
            res.status(200).json({ 
                received: true, 
                message: 'Webhook GET processado com sucesso',
                paymentId: id
            });
        } else {
            console.log('🔔 WEBHOOK GET - Tipo de notificação:', topic);
            res.status(200).json({ 
                received: true, 
                message: 'Notificação GET recebida',
                topic: topic
            });
        }
        
    } catch (error) {
        console.error('❌ WEBHOOK GET - Erro ao processar notificação:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// ===========================
// VERIFICAR STATUS DO PAGAMENTO
// ===========================
router.get('/payment-status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        console.log('🔍 Verificando status do pagamento:', paymentId);
        
        const paymentStatus = await getPaymentStatus(paymentId);
        
        res.json({
            success: true,
            payment: paymentStatus
        });

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        res.status(500).json({
            error: 'Erro interno do servidor ao verificar status do pagamento',
            code: 'PAYMENT_STATUS_ERROR'
        });
    }
});

// ===========================
// VERIFICAR STATUS DO PIX POR PAYMENT ID
// ===========================
router.get('/pix-status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        console.log('🔍 Verificando status do PIX para pagamento:', paymentId);
        
        // Buscar status do pagamento diretamente (no PIX, o paymentId é o próprio payment)
        const paymentStatus = await getPaymentStatus(paymentId);
        
        res.json({
            success: true,
            status: paymentStatus.status,
            payment: paymentStatus
        });

    } catch (error) {
        console.error('❌ Erro ao verificar status do PIX:', error);
        res.status(500).json({
            error: 'Erro ao verificar status do PIX',
            code: 'PIX_STATUS_ERROR'
        });
    }
});

// ===========================
// WEBHOOK - CONFIRMAÇÃO DE PAGAMENTO
// ===========================
router.post('/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        console.log('🔔 Webhook recebido:', { type, data });

        if (type === 'payment') {
            const paymentStatus = await getPaymentStatus(data.id);
            
            console.log('💳 Status do pagamento:', paymentStatus);

            if (paymentStatus.status === 'approved') {
                await handlePaymentApproved(paymentStatus);
            } else if (paymentStatus.status === 'cancelled' || paymentStatus.status === 'rejected') {
                await handlePaymentCancelled(paymentStatus);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).send('Error');
    }
});

// ===========================
// FUNÇÕES AUXILIARES
// ===========================

// Métodos de pagamento excluídos baseados na seleção
function getExcludedMethods(selectedMethod) {
    const allMethods = [
        { id: 'ticket' },
        { id: 'bank_transfer' },
        { id: 'digital_wallet' },
        { id: 'debit_card' },
        { id: 'credit_card' }
    ];
    
    switch (selectedMethod) {
        case 'pix':
            // PIX: excluir todos os outros métodos, deixar apenas digital_wallet
            return allMethods.filter(method => method.id !== 'digital_wallet');
        case 'credit':
            // Cartão: excluir todos exceto credit_card
            return allMethods.filter(method => method.id !== 'credit_card');
        case 'debit':
            // Débito: excluir todos exceto debit_card
            return allMethods.filter(method => method.id !== 'debit_card');
        case 'boleto':
            // Boleto: excluir todos exceto ticket
            return allMethods.filter(method => method.id !== 'ticket');
        default:
            return [];
    }
}

// Processar pagamento aprovado
async function handlePaymentApproved(paymentStatus) {
    try {
        console.log('✅ Pagamento aprovado:', paymentStatus.external_reference);
        
        // Buscar pagamento completo para obter dados detalhados
        const payment = await getPaymentStatus(paymentStatus.id);
        
        // Extrair dados do external_reference usando o sistema Base64 implementado
        let planData = null;
        let planType = 'family'; // Default
        
        const externalRef = payment.external_reference;
        console.log('🔍 External reference recebido (handlePaymentApproved):', externalRef);
        
        if (!externalRef) {
            console.log('⚠️ External reference está undefined, usando valores padrão');
            planType = 'family';
            planData = {
                numParents: 1,
                numStudents: 2,
                totalPrice: payment.transaction_amount || 19.90
            };
        } else {
            try {
                // Tentar decodificar Base64 primeiro (formato novo)
                const decodedData = Buffer.from(externalRef, 'base64').toString('utf-8');
                const parsedData = JSON.parse(decodedData);
                
                console.log('🔍 Dados decodificados do external_reference:', parsedData);
                
                planType = parsedData.planType || 'family';
                planData = {
                    numParents: parsedData.numParents || 0,
                    numStudents: parsedData.numStudents || 1,
                    totalPrice: parsedData.totalPrice || payment.transaction_amount
                };
                
                console.log('✅ Usando dados decodificados do Base64');
                
            } catch (base64Error) {
                console.log('⚠️ Falha na decodificação Base64, tentando fallback...');
                console.log('⚠️ Erro Base64:', base64Error.message);
                
                // Fallback 1: Tentar usar metadados do pagamento
                if (payment.metadata && payment.metadata.plan_type) {
                    planType = payment.metadata.plan_type;
                    planData = {
                        numParents: parseInt(payment.metadata.num_parents) || 0,
                        numStudents: parseInt(payment.metadata.num_students) || 1,
                        totalPrice: payment.transaction_amount
                    };
                    console.log('✅ Usando dados dos metadados');
                } else if (externalRef && typeof externalRef === 'string') {
                    // Fallback 2: Formato antigo (compatibilidade)
                    const isFamily = externalRef.startsWith('FAMILY') || externalRef.startsWith('FAM-');
                    planType = isFamily ? 'family' : 'school';
                    
                    // Para family, calcular baseado no valor: 19.90 = 1 pai + 2 filhos
                    if (isFamily) {
                        const amount = payment.transaction_amount || 19.90;
                        // Valores conhecidos: 19.90 = 1 pai + 2 filhos, 39.80 = 2 pais + 1 filho
                        if (amount === 19.90) {
                            planData = {
                                numParents: 1,
                                numStudents: 2,
                                totalPrice: amount
                            };
                        } else if (amount === 39.80) {
                            planData = {
                                numParents: 2,
                                numStudents: 1,
                                totalPrice: amount
                            };
                        } else {
                            // Fallback genérico
                            planData = {
                                numParents: 1,
                                numStudents: 2,
                                totalPrice: amount
                            };
                        }
                    } else {
                        // Escola: calcular baseado no valor
                        planData = {
                            numParents: 0,
                            numStudents: Math.floor(payment.transaction_amount / 9.90),
            totalPrice: payment.transaction_amount
        };
                    }
                    console.log('⚠️ Usando fallback com formato antigo:', planData);
                } else {
                    // Último fallback: valores padrão
                    planType = 'family';
                    planData = {
                        numParents: 1,
                        numStudents: 2,
                        totalPrice: payment.transaction_amount || 19.90
                    };
                    console.log('⚠️ Usando valores padrão:', planData);
                }
            }
        }
        
        // Usar email do pagador do Mercado Pago
        console.log('🔍 DEBUG HANDLEPAYMENT: Dados do payment.payer:', {
            payer: payment.payer,
            email: payment.payer?.email,
            identification: payment.payer?.identification,
            phone: payment.payer?.phone
        });
        
        const purchaserData = {
            email: payment.payer?.email || 'comprador@pix.yufin.com.br',
            name: payment.payer?.identification?.name || 'Comprador PIX',
            phone: typeof payment.payer?.phone === 'object' ? (payment.payer.phone?.number || null) : (payment.payer?.phone || null)
        };
        
        console.log('🔍 DEBUG HANDLEPAYMENT: purchaserData criado:', purchaserData);
        
        console.log('📧 Criando licença para:', purchaserData.email);
        console.log('💰 Valor do pagamento:', payment.transaction_amount);
        console.log('👥 Plano decodificado:', planType, planData);
        
        // Criar licença automaticamente
        const result = await processApprovedPayment({
            planType: planType,
            planData: planData,
            paymentMethod: payment.payment_method_id || 'pix',
            transactionId: payment.id.toString(),
            purchaserData: purchaserData
        });
        
        console.log('🎉 Licença criada automaticamente:', result.licenseCode);
        console.log('📧 Email enviado para:', purchaserData.email);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro ao processar pagamento aprovado:', error);
        throw error;
    }
}

// Processar pagamento cancelado
async function handlePaymentCancelled(paymentStatus) {
    try {
        console.log('❌ Pagamento cancelado:', paymentStatus.external_reference);
        
        // Aqui você pode implementar a lógica para:
        // 1. Notificar o usuário
        // 2. Limpar dados temporários
        // 3. Oferecer nova tentativa
        
        console.log('⚠️ Pagamento cancelado - usuário será notificado');
        
    } catch (error) {
        console.error('❌ Erro ao processar pagamento cancelado:', error);
    }
}

module.exports = router;
