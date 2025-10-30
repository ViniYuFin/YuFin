/**
 * 🧪 SCRIPT DE TESTE - SISTEMA DE RECORRÊNCIA MENSAL
 * 
 * Este script testa o sistema de recorrência mensal do YüFin:
 * 1. Criação de assinatura recorrente (cartão)
 * 2. Primeiro pagamento autorizado (criação de licença)
 * 3. Renovação mensal (atualização de licença)
 * 4. Cancelamento de assinatura
 * 
 * Uso: node scripts/test-recurrence.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const FamilyLicense = require('../models/FamilyLicense');
const SchoolLicense = require('../models/SchoolLicense');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// Cores para console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Funções de log
const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    title: (msg) => console.log(`${colors.bright}${colors.blue}\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`)
};

// ===========================
// TESTES
// ===========================

async function testCreateSubscription() {
    log.title('TESTE 1: Criação de Assinatura Recorrente');
    
    try {
        const axios = require('axios');
        
        const subscriptionData = {
            reason: 'YüFin Família - Renovação mensal',
            frequency: 1,
            frequencyType: 'months',
            billingDay: 1,
            amount: 19.90,
            payerEmail: 'test@yufin.com',
            externalReference: Buffer.from(JSON.stringify({
                planType: 'family',
                numParents: 1,
                numStudents: 2,
                totalPrice: 19.90,
                purchaserEmail: 'test@yufin.com'
            })).toString('base64'),
            startDate: new Date().toISOString(),
            endDate: null
        };
        
        log.info('Enviando dados para criação de assinatura...');
        log.info(`Email: ${subscriptionData.payerEmail}`);
        log.info(`Valor: R$ ${subscriptionData.amount}`);
        log.info(`Frequência: ${subscriptionData.frequency} ${subscriptionData.frequencyType}`);
        
        // Simular requisição ao backend
        log.warn('Nota: Este teste requer integração com Mercado Pago API');
        log.warn('Para testar completamente, use o endpoint /api/mercado-pago/create-subscription');
        
        log.success('Dados de teste preparados com sucesso!');
        log.info('\nPara testar no backend, envie POST para:');
        log.info('http://localhost:3001/api/mercado-pago/create-subscription');
        log.info('\nBody:');
        console.log(JSON.stringify(subscriptionData, null, 2));
        
        return true;
    } catch (error) {
        log.error('Erro ao criar assinatura: ' + error.message);
        return false;
    }
}

async function testFirstPayment() {
    log.title('TESTE 2: Primeiro Pagamento Autorizado');
    
    try {
        // Buscar a última licença família criada recentemente
        const license = await FamilyLicense.findOne({
            'purchaser.email': 'test@yufin.com'
        }).sort({ createdAt: -1 });
        
        if (!license) {
            log.warn('Nenhuma licença de teste encontrada');
            log.info('Criando licença de exemplo...');
            
            const testLicense = new FamilyLicense({
                licenseCode: FamilyLicense.generateLicenseCode(),
                planData: {
                    numParents: 1,
                    numStudents: 2,
                    totalPrice: 19.90
                },
                purchaser: {
                    email: 'test@yufin.com',
                    name: 'Usuário de Teste'
                },
                status: 'paid',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                payment: {
                    amount: 19.90,
                    method: 'credit_card',
                    transactionId: 'TEST' + Date.now(),
                    paidAt: new Date()
                }
            });
            
            await testLicense.save();
            log.success('Licença de teste criada: ' + testLicense.licenseCode);
            
            return testLicense;
        }
        
        log.success('Licença encontrada: ' + license.licenseCode);
        log.info(`Status: ${license.status}`);
        log.info(`Email: ${license.purchaser.email}`);
        log.info(`Expira em: ${license.expiresAt}`);
        
        return license;
    } catch (error) {
        log.error('Erro ao testar primeiro pagamento: ' + error.message);
        return null;
    }
}

async function testRenewal() {
    log.title('TESTE 3: Renovação Mensal');
    
    try {
        // Buscar licença com assinatura
        const license = await FamilyLicense.findOne({
            'purchaser.email': 'test@yufin.com',
            'subscription.id': { $exists: true }
        }).sort({ createdAt: -1 });
        
        if (!license) {
            log.warn('Nenhuma licença com assinatura encontrada');
            
            // Criar licença com assinatura de teste
            const testLicense = await FamilyLicense.findOne({
                'purchaser.email': 'test@yufin.com'
            }).sort({ createdAt: -1 });
            
            if (testLicense) {
                testLicense.subscription = {
                    id: 'TEST_SUBSCRIPTION_' + Date.now(),
                    status: 'active',
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    billingCycle: 'monthly',
                    autoRenew: true
                };
                
                await testLicense.save();
                log.success('Assinatura de teste adicionada à licença');
                
                return testLicense;
            }
            
            return null;
        }
        
        log.success('Licença com assinatura encontrada: ' + license.licenseCode);
        log.info(`Subscription ID: ${license.subscription.id}`);
        log.info(`Status: ${license.subscription.status}`);
        log.info(`Próxima cobrança: ${license.subscription.nextBillingDate}`);
        log.info(`Expira em: ${license.expiresAt}`);
        
        // Simular renovação
        const oldExpiresAt = license.expiresAt;
        license.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        license.subscription.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        license.renewalHistory.push({
            renewedAt: new Date(),
            amount: license.planData.totalPrice,
            transactionId: license.subscription.id + '_RENEWAL_' + Date.now(),
            status: 'success'
        });
        
        await license.save();
        
        log.success('Renovação simulada com sucesso!');
        log.info(`Expiração anterior: ${oldExpiresAt}`);
        log.info(`Nova expiração: ${license.expiresAt}`);
        log.info(`Total de renovações: ${license.renewalHistory.length}`);
        
        return license;
    } catch (error) {
        log.error('Erro ao testar renovação: ' + error.message);
        return null;
    }
}

async function testCancellation() {
    log.title('TESTE 4: Cancelamento de Assinatura');
    
    try {
        const license = await FamilyLicense.findOne({
            'purchaser.email': 'test@yufin.com',
            'subscription.id': { $exists: true }
        }).sort({ createdAt: -1 });
        
        if (!license) {
            log.warn('Nenhuma licença com assinatura encontrada para cancelamento');
            return null;
        }
        
        log.success('Licença encontrada: ' + license.licenseCode);
        log.info(`Status da assinatura: ${license.subscription.status}`);
        
        // Simular cancelamento
        const oldStatus = license.subscription.status;
        license.subscription.status = 'cancelled';
        license.subscription.autoRenew = false;
        
        await license.save();
        
        log.success('Cancelamento simulado com sucesso!');
        log.info(`Status anterior: ${oldStatus}`);
        log.info(`Novo status: ${license.subscription.status}`);
        log.info(`Auto-renovar: ${license.subscription.autoRenew}`);
        
        // Restaurar para não afetar testes futuros
        license.subscription.status = 'active';
        license.subscription.autoRenew = true;
        await license.save();
        log.info('Status restaurado para testes futuros');
        
        return license;
    } catch (error) {
        log.error('Erro ao testar cancelamento: ' + error.message);
        return null;
    }
}

async function testLicenseExpiration() {
    log.title('TESTE 5: Validação de Expiração de Licença');
    
    try {
        const licenses = await FamilyLicense.find({
            'purchaser.email': 'test@yufin.com'
        }).sort({ createdAt: -1 }).limit(3);
        
        if (licenses.length === 0) {
            log.warn('Nenhuma licença encontrada');
            return null;
        }
        
        licenses.forEach((license, index) => {
            log.info(`\nLicença ${index + 1}: ${license.licenseCode}`);
            log.info(`Status: ${license.status}`);
            log.info(`Expira em: ${license.expiresAt}`);
            
            const now = new Date();
            const expiresAt = new Date(license.expiresAt);
            const isValid = expiresAt > now;
            
            if (isValid) {
                const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
                log.success(`Licença válida! Restam ${daysRemaining} dias`);
            } else {
                log.error(`Licença expirada há ${Math.ceil((now - expiresAt) / (1000 * 60 * 60 * 24))} dias`);
            }
        });
        
        return licenses;
    } catch (error) {
        log.error('Erro ao testar expiração: ' + error.message);
        return null;
    }
}

async function cleanupTestData() {
    log.title('LIMPEZA: Removendo Dados de Teste');
    
    try {
        const result = await FamilyLicense.deleteMany({
            'purchaser.email': 'test@yufin.com'
        });
        
        log.success(`Removidas ${result.deletedCount} licenças de teste`);
        return result;
    } catch (error) {
        log.error('Erro ao limpar dados: ' + error.message);
        return null;
    }
}

// ===========================
// FUNÇÃO PRINCIPAL
// ===========================

async function runTests() {
    log.title('🧪 INICIANDO TESTES DE RECORRÊNCIA MENSAL');
    
    try {
        // Conectar ao MongoDB
        log.info('Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        log.success('Conectado ao MongoDB!');
        
        // Executar testes
        await testCreateSubscription();
        await testFirstPayment();
        await testRenewal();
        await testCancellation();
        await testLicenseExpiration();
        
        // Perguntar se deseja limpar dados de teste
        log.warn('\n⚠️  Dados de teste foram criados');
        log.info('Execute: node scripts/test-recurrence.js cleanup');
        log.info('Para remover todos os dados de teste');
        
    } catch (error) {
        log.error('Erro ao executar testes: ' + error.message);
        console.error(error);
    } finally {
        // Fechar conexão
        await mongoose.disconnect();
        log.info('Conexão com MongoDB fechada');
    }
}

async function runCleanup() {
    log.title('🧹 LIMPEZA DE DADOS DE TESTE');
    
    try {
        await mongoose.connect(MONGODB_URI);
        log.success('Conectado ao MongoDB!');
        
        await cleanupTestData();
        
    } catch (error) {
        log.error('Erro ao limpar dados: ' + error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        log.success('Limpeza concluída!');
    }
}

// Executar
const args = process.argv.slice(2);
if (args.includes('cleanup')) {
    runCleanup();
} else {
    runTests();
}

