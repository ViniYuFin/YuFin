// 🔧 CONFIGURAÇÃO DO MERCADO PAGO
const mercadopago = require('mercadopago');

// Configurar credenciais baseadas no ambiente
const configureMercadoPago = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        console.log('🔧 Mercado Pago: Configurado para PRODUÇÃO');
    } else {
        console.log('🔧 Mercado Pago: Configurado para TESTE');
    }
};

// Função para criar preferência de pagamento
const createPaymentPreference = async (paymentData) => {
    try {
        const accessToken = process.env.NODE_ENV === 'production' 
            ? process.env.MERCADO_PAGO_ACCESS_TOKEN_PROD 
            : process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST;

        // Se for PIX, criar pagamento direto em vez de preferência
        if (paymentData.paymentMethod === 'pix') {
            console.log('📱 Criando pagamento PIX direto...');
            return await createPixPayment(paymentData, accessToken);
        }

        const preference = {
            items: [{
                title: paymentData.title,
                quantity: 1,
                unit_price: paymentData.amount,
                currency_id: 'BRL'
            }],
            payment_methods: {
                excluded_payment_types: paymentData.excludedMethods || [],
                installments: 12
            },
            back_urls: {
                success: `https://yufin-landing-bbaweogrp-vinicius-assuncaos-projects-ffa185b9.vercel.app/planos.html?status=success&plan=${paymentData.planType}&numStudents=${paymentData.planData?.numStudents || 0}&numParents=${paymentData.planData?.numParents || 0}&totalPrice=${paymentData.planData?.totalPrice || 0}`,
                failure: `https://yufin-landing-bbaweogrp-vinicius-assuncaos-projects-ffa185b9.vercel.app/planos.html?status=failure&plan=${paymentData.planType}&numStudents=${paymentData.planData?.numStudents || 0}&numParents=${paymentData.planData?.numParents || 0}&totalPrice=${paymentData.planData?.totalPrice || 0}`,
                pending: `https://yufin-landing-bbaweogrp-vinicius-assuncaos-projects-ffa185b9.vercel.app/planos.html?status=pending&plan=${paymentData.planType}&numStudents=${paymentData.planData?.numStudents || 0}&numParents=${paymentData.planData?.numParents || 0}&totalPrice=${paymentData.planData?.totalPrice || 0}`
            },
            auto_return: "approved",
            external_reference: paymentData.externalReference
        };

        // Usar fetch direto para a API do Mercado Pago
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro da API Mercado Pago:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Preferência criada com sucesso:', result.id);
        
        return {
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        };
    } catch (error) {
        console.error('❌ Erro ao criar preferência de pagamento:', error);
        throw error;
    }
};

// Função para criar pagamento PIX direto
const createPixPayment = async (paymentData, accessToken) => {
    try {
        console.log('📱 Criando pagamento PIX via API...');
        
        // Gerar ID único para idempotência (usando crypto ou uuid)
        const crypto = require('crypto');
        const idempotencyKey = crypto.randomUUID();
        
        // Obter email do usuário ou usar email padrão
        const userEmail = paymentData.purchaserEmail || 'comprador@pix.yufin.com.br';
        
        const paymentRequest = {
            transaction_amount: paymentData.amount,
            description: paymentData.title,
            payment_method_id: 'pix',
            payer: {
                email: userEmail
            },
            external_reference: paymentData.externalReference
        };

        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify(paymentRequest)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro ao criar pagamento PIX:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const payment = await response.json();
        console.log('✅ Pagamento PIX criado:', payment.id);
        
        // Extrair dados do QR Code PIX
        const pixData = payment.point_of_interaction?.transaction_data;
        
        return {
            id: payment.id,
            preferenceId: payment.id, // Para compatibilidade com frontend
            pix_qr_code_base64: pixData?.qr_code_base64 || null,
            pix_qr_code: pixData?.qr_code || null,
            pix_ticket_url: pixData?.ticket_url || null,
            payer: {
                email: payment.payer?.email || userEmail
            }
        };
    } catch (error) {
        console.error('❌ Erro ao criar pagamento PIX:', error);
        throw error;
    }
};

// Função para verificar status do pagamento
const getPaymentStatus = async (paymentId) => {
    try {
        const accessToken = process.env.NODE_ENV === 'production' 
            ? process.env.MERCADO_PAGO_ACCESS_TOKEN_PROD 
            : process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST;

        // Usar fetch direto para a API do Mercado Pago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const payment = await response.json();
        
        return {
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            transaction_amount: payment.transaction_amount,
            payment_method_id: payment.payment_method_id,
            external_reference: payment.external_reference,
            // Retornar dados completos para o webhook
            payer: payment.payer,
            metadata: payment.metadata,
            date_approved: payment.date_approved
        };
    } catch (error) {
        console.error('❌ Erro ao verificar status do pagamento:', error);
        throw error;
    }
};

module.exports = {
    configureMercadoPago,
    createPaymentPreference,
    getPaymentStatus
};
