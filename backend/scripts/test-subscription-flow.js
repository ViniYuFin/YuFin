/**
 * 🧪 TESTE RÁPIDO - Fluxo Completo de Assinatura
 * 
 * Simula o fluxo completo sem precisar do Mercado Pago:
 * 1. Criar licença com assinatura
 * 2. Simular primeira autorização
 * 3. Simular renovação mensal
 * 4. Verificar dados
 */

require('dotenv').config();
const mongoose = require('mongoose');
const FamilyLicense = require('../models/FamilyLicense');

const MONGODB_URI = process.env.MONGODB_URI;

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.magenta}\n▶️  ${msg}\n${colors.reset}`)
};

async function testCompleteFlow() {
    try {
        // Conectar
        log.info('Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        log.success('Conectado!');

        // Limpar dados anteriores
        await FamilyLicense.deleteMany({ 'purchaser.email': 'flow-test@yufin.com' });
        log.info('Dados anteriores limpos');

        // ===========================
        // PASSO 1: Criar Licença
        // ===========================
        log.step('PASSO 1: Criando licença com assinatura de teste...');
        
        const subscriptionId = 'TEST_SUB_' + Date.now();
        const licenseCode = FamilyLicense.generateLicenseCode();
        
        const license = new FamilyLicense({
            licenseCode: licenseCode,
            planData: {
                numParents: 1,
                numStudents: 2,
                totalPrice: 19.90
            },
            purchaser: {
                email: 'flow-test@yufin.com',
                name: 'Test Flow User'
            },
            status: 'paid',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            payment: {
                amount: 19.90,
                method: 'credit_card',
                transactionId: 'TEST_PAY_' + Date.now(),
                paidAt: new Date()
            },
            subscription: {
                id: subscriptionId,
                status: 'active',
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                billingCycle: 'monthly',
                autoRenew: true
            }
        });

        await license.save();
        log.success(`Licença criada: ${licenseCode}`);
        log.info(`Subscription ID: ${subscriptionId}`);
        log.info(`Expira em: ${new Date(license.expiresAt).toLocaleString('pt-BR')}`);

        // ===========================
        // PASSO 2: Verificar Primeira Vez
        // ===========================
        log.step('PASSO 2: Verificando configuração inicial...');
        
        const saved = await FamilyLicense.findOne({ licenseCode });
        
        log.success('Licença encontrada no banco!');
        log.info(`Status: ${saved.status}`);
        log.info(`Subscription Status: ${saved.subscription.status}`);
        log.info(`Auto-renew: ${saved.subscription.autoRenew}`);
        log.info(`Renovações: ${saved.renewalHistory.length}`);

        // ===========================
        // PASSO 3: Simular Renovação
        // ===========================
        log.step('PASSO 3: Simulando primeira renovação mensal...');
        
        const oldExpiresAt = new Date(saved.expiresAt);
        
        saved.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        saved.subscription.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        saved.renewalHistory.push({
            renewedAt: new Date(),
            amount: saved.planData.totalPrice,
            transactionId: subscriptionId + '_RENEWAL_1',
            status: 'success'
        });
        
        await saved.save();
        
        log.success('Renovação aplicada!');
        log.info(`Expiração anterior: ${oldExpiresAt.toLocaleString('pt-BR')}`);
        log.info(`Nova expiração: ${new Date(saved.expiresAt).toLocaleString('pt-BR')}`);
        log.info(`Total de renovações: ${saved.renewalHistory.length}`);

        // ===========================
        // PASSO 4: Simular Segunda Renovação
        // ===========================
        log.step('PASSO 4: Simulando segunda renovação mensal...');
        
        const saved2 = await FamilyLicense.findOne({ licenseCode });
        const oldExpiresAt2 = new Date(saved2.expiresAt);
        
        saved2.expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        saved2.subscription.nextBillingDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        
        saved2.renewalHistory.push({
            renewedAt: new Date(),
            amount: saved2.planData.totalPrice,
            transactionId: subscriptionId + '_RENEWAL_2',
            status: 'success'
        });
        
        await saved2.save();
        
        log.success('Segunda renovação aplicada!');
        log.info(`Expiração anterior: ${oldExpiresAt2.toLocaleString('pt-BR')}`);
        log.info(`Nova expiração: ${new Date(saved2.expiresAt).toLocaleString('pt-BR')}`);
        log.info(`Total de renovações: ${saved2.renewalHistory.length}`);
        
        // Verificar histórico
        log.info('\nHistórico de renovações:');
        saved2.renewalHistory.forEach((renewal, i) => {
            log.info(`  ${i + 1}. ${new Date(renewal.renewedAt).toLocaleString('pt-BR')} - R$ ${renewal.amount.toFixed(2)} - ${renewal.status}`);
        });

        // ===========================
        // PASSO 5: Verificar Validade
        // ===========================
        log.step('PASSO 5: Verificando validação de licença...');
        
        const now = new Date();
        const expiresAt = new Date(saved2.expiresAt);
        const isValid = expiresAt > now;
        const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        
        if (isValid) {
            log.success(`Licença válida! Restam ${daysRemaining} dias`);
        } else {
            log.error(`Licença expirada há ${Math.abs(daysRemaining)} dias`);
        }

        // ===========================
        // PASSO 6: Simular Cancelamento
        // ===========================
        log.step('PASSO 6: Simulando cancelamento de assinatura...');
        
        const saved3 = await FamilyLicense.findOne({ licenseCode });
        const oldStatus = saved3.subscription.status;
        
        saved3.subscription.status = 'cancelled';
        saved3.subscription.autoRenew = false;
        
        await saved3.save();
        
        log.success('Assinatura cancelada!');
        log.info(`Status anterior: ${oldStatus}`);
        log.info(`Novo status: ${saved3.subscription.status}`);
        log.info(`Auto-renew: ${saved3.subscription.autoRenew}`);

        // ===========================
        // RESUMO FINAL
        // ===========================
        log.step('RESUMO DO TESTE');
        
        const final = await FamilyLicense.findOne({ licenseCode });
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 DADOS FINAIS DA LICENÇA:');
        console.log('='.repeat(60));
        console.log(`Código: ${final.licenseCode}`);
        console.log(`Email: ${final.purchaser.email}`);
        console.log(`Status: ${final.status}`);
        console.log(`Subscription Status: ${final.subscription.status}`);
        console.log(`Auto-renew: ${final.subscription.autoRenew}`);
        console.log(`Próxima cobrança: ${new Date(final.subscription.nextBillingDate).toLocaleString('pt-BR')}`);
        console.log(`Expira em: ${new Date(final.expiresAt).toLocaleString('pt-BR')}`);
        console.log(`Total de renovações: ${final.renewalHistory.length}`);
        console.log('='.repeat(60));
        
        log.success('✅ Teste completo executado com sucesso!');

        // Limpar dados
        log.info('\nLimpando dados de teste...');
        await FamilyLicense.deleteOne({ licenseCode });
        log.success('Dados limpos!');

    } catch (error) {
        log.error('Erro no teste: ' + error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        log.info('Conexão fechada');
    }
}

// Executar
testCompleteFlow();

