/**
 * Endpoint para processar pagamentos com CardForm do Mercado Pago
 * Seguindo padrão oficial do Mercado Pago
 */

const express = require('express');
const router = express.Router();
const { Payment, MercadoPagoConfig } = require('mercadopago');
const crypto = require('crypto');
const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');
const { sendLicenseConfirmationEmail } = require('../utils/emailService');

// Configurar Mercado Pago
const isProduction = process.env.NODE_ENV === 'production';
const accessToken = isProduction 
    ? process.env.MERCADO_PAGO_ACCESS_TOKEN_PROD
    : process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST;

const client = new MercadoPagoConfig({ accessToken });

/**
 * POST /api/mercado-pago/process-payment
 * Processar pagamento com CardForm
 */
router.post('/process-payment', async (req, res) => {
    try {
        console.log('💳 PROCESSANDO PAGAMENTO COM CARDFORM');
        console.log('📋 Dados recebidos:', {
            token: req.body.token ? '***' + req.body.token.slice(-4) : 'N/A',
            transaction_amount: req.body.transaction_amount,
            payment_method_id: req.body.payment_method_id,
            installments: req.body.installments,
            planType: req.body.planType
        });

        const {
            token,
            issuer_id,
            payment_method_id,
            transaction_amount,
            installments,
            description,
            payer,
            planData,
            planType
        } = req.body;

        // Validar dados obrigatórios
        if (!token) {
            return res.status(400).json({ 
                success: false, 
                error: 'Token do cartão é obrigatório' 
            });
        }

        if (!transaction_amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valor da transação é obrigatório' 
            });
        }

        // Criar pagamento no Mercado Pago
        console.log('🚀 Criando pagamento no Mercado Pago...');
        
        const payment = new Payment(client);
        const result = await payment.create({
            body: {
                transaction_amount: Number(transaction_amount),
                token: token,
                description: description || `YüFin - ${planType === 'family' ? 'Plano Família' : 'Plano Escola'}`,
                installments: Number(installments) || 1,
                payment_method_id: payment_method_id,
                issuer_id: issuer_id,
                payer: {
                    email: payer.email,
                    identification: {
                        type: payer.identification.type,
                        number: payer.identification.number
                    }
                }
            },
            requestOptions: { 
                idempotencyKey: crypto.randomUUID() // Gerar UUID único
            }
        });

        console.log('✅ Pagamento criado no Mercado Pago:', {
            id: result.id,
            status: result.status,
            status_detail: result.status_detail
        });

        // Verificar status do pagamento
        if (result.status === 'approved') {
            console.log('🎉 PAGAMENTO APROVADO - Criando licença...');
            
            // Processar pagamento aprovado
            const licenseResult = await processApprovedPayment({
                planType: planType || 'family',
                planData: planData,
                paymentMethod: payment_method_id,
                transactionId: result.id.toString(),
                purchaserData: {
                    email: payer.email,
                    name: payer.identification.number, // Usar número do documento como nome
                    phone: null
                }
            });

            if (licenseResult.success) {
                console.log('✅ Licença criada com sucesso:', licenseResult.licenseCode);
                
                return res.json({
                    success: true,
                    status: 'approved',
                    paymentId: result.id,
                    licenseCode: licenseResult.licenseCode,
                    message: 'Pagamento aprovado e licença criada com sucesso'
                });
            } else {
                console.error('❌ Erro ao criar licença:', licenseResult.error);
                return res.status(500).json({
                    success: false,
                    error: 'Pagamento aprovado, mas erro ao criar licença',
                    paymentId: result.id
                });
            }
        } else if (result.status === 'rejected') {
            console.log('❌ PAGAMENTO REJEITADO:', result.status_detail);
            return res.json({
                success: false,
                status: 'rejected',
                paymentId: result.id,
                reason: result.status_detail,
                message: 'Pagamento rejeitado'
            });
        } else if (result.status === 'pending') {
            console.log('⏳ PAGAMENTO PENDENTE:', result.status_detail);
            return res.json({
                success: false,
                status: 'pending',
                paymentId: result.id,
                message: 'Pagamento pendente de confirmação'
            });
        } else {
            console.log('⚠️ STATUS DESCONHECIDO:', result.status);
            return res.json({
                success: false,
                status: result.status,
                paymentId: result.id,
                message: 'Status de pagamento desconhecido'
            });
        }

    } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
        console.error('❌ Stack trace:', error.stack);
        
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

/**
 * Processar pagamento aprovado e criar licença
 */
async function processApprovedPayment(paymentData) {
    try {
        console.log('🎯 PROCESSANDO PAGAMENTO APROVADO');
        console.log('📋 Dados do pagamento:', paymentData);
        
        const { planType, planData, paymentMethod, transactionId, purchaserData } = paymentData;
        let licenseCode = null;
        let licenseData = null;

        if (planType === 'family') {
            console.log('👨‍👩‍👧‍👦 Criando licença família...');
            
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
                    email: purchaserData.email,
                    name: purchaserData.name,
                    phone: typeof purchaserData.phone === 'object' ? (purchaserData.phone?.number || null) : (purchaserData.phone || null)
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

            // Gerar licenças individuais para alunos
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
        if (licenseCode && purchaserData?.email) {
            console.log('📧 Enviando email de confirmação...');
            try {
                await sendLicenseConfirmationEmail(purchaserData.email, licenseData);
                console.log('✅ Email de confirmação enviado');
            } catch (emailError) {
                console.error('⚠️ Erro ao enviar email:', emailError);
                // Não falhar o processo por erro de email
            }
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

module.exports = router;
