/**
 * Script de teste para verificar isolamento entre escolas
 * Este script testa se as turmas estão isoladas por escola
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const User = require('./models/User');
const Class = require('./models/Class');

async function testSchoolIsolation() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Limpar dados de teste anteriores
    await Class.deleteMany({ name: { $regex: /^Teste/ } });
    await User.deleteMany({ email: { $regex: /@teste\.com$/ } });
    console.log('🧹 Dados de teste anteriores removidos');

    // Criar duas escolas de teste
    const escola1 = new User({
      name: 'Escola Teste 1',
      email: 'escola1@teste.com',
      role: 'school',
      passwordHash: 'test123'
    });
    await escola1.save();
    console.log('🏫 Escola 1 criada:', escola1.id);

    const escola2 = new User({
      name: 'Escola Teste 2',
      email: 'escola2@teste.com',
      role: 'school',
      passwordHash: 'test123'
    });
    await escola2.save();
    console.log('🏫 Escola 2 criada:', escola2.id);

    // Criar turmas para cada escola
    const turma1Escola1 = new Class({
      name: 'Teste Turma A',
      grade: '6º Ano',
      teacher: 'Professor Teste 1',
      schoolId: escola1.id,
      students: []
    });
    await turma1Escola1.save();
    console.log('📚 Turma 1 da Escola 1 criada:', turma1Escola1.id);

    const turma2Escola1 = new Class({
      name: 'Teste Turma B',
      grade: '7º Ano',
      teacher: 'Professor Teste 2',
      schoolId: escola1.id,
      students: []
    });
    await turma2Escola1.save();
    console.log('📚 Turma 2 da Escola 1 criada:', turma2Escola1.id);

    const turma1Escola2 = new Class({
      name: 'Teste Turma C',
      grade: '8º Ano',
      teacher: 'Professor Teste 3',
      schoolId: escola2.id,
      students: []
    });
    await turma1Escola2.save();
    console.log('📚 Turma 1 da Escola 2 criada:', turma1Escola2.id);

    // Teste 1: Verificar se Escola 1 vê apenas suas turmas
    console.log('\n🔍 TESTE 1: Isolamento da Escola 1');
    const turmasEscola1 = await Class.find({ schoolId: escola1.id });
    console.log(`Turmas encontradas para Escola 1: ${turmasEscola1.length}`);
    turmasEscola1.forEach(turma => {
      console.log(`  - ${turma.name} (${turma.grade})`);
    });

    // Teste 2: Verificar se Escola 2 vê apenas suas turmas
    console.log('\n🔍 TESTE 2: Isolamento da Escola 2');
    const turmasEscola2 = await Class.find({ schoolId: escola2.id });
    console.log(`Turmas encontradas para Escola 2: ${turmasEscola2.length}`);
    turmasEscola2.forEach(turma => {
      console.log(`  - ${turma.name} (${turma.grade})`);
    });

    // Teste 3: Verificar se não há vazamento de dados
    console.log('\n🔍 TESTE 3: Verificação de vazamento');
    const todasTurmas = await Class.find({ name: { $regex: /^Teste/ } });
    console.log(`Total de turmas de teste: ${todasTurmas.length}`);
    
    const turmasEscola1Novamente = await Class.find({ schoolId: escola1.id });
    const turmasEscola2Novamente = await Class.find({ schoolId: escola2.id });
    
    console.log(`Escola 1 tem ${turmasEscola1Novamente.length} turmas`);
    console.log(`Escola 2 tem ${turmasEscola2Novamente.length} turmas`);
    console.log(`Total: ${turmasEscola1Novamente.length + turmasEscola2Novamente.length}`);

    // Verificar se o isolamento está funcionando
    const isolamentoFuncionando = 
      turmasEscola1Novamente.length === 2 && 
      turmasEscola2Novamente.length === 1 &&
      turmasEscola1Novamente.every(t => t.schoolId === escola1.id) &&
      turmasEscola2Novamente.every(t => t.schoolId === escola2.id);

    if (isolamentoFuncionando) {
      console.log('\n✅ ISOLAMENTO FUNCIONANDO CORRETAMENTE!');
      console.log('   - Cada escola vê apenas suas próprias turmas');
      console.log('   - Não há vazamento de dados entre escolas');
    } else {
      console.log('\n❌ PROBLEMA NO ISOLAMENTO!');
      console.log('   - Verifique as configurações de schoolId');
    }

    // Limpar dados de teste
    await Class.deleteMany({ name: { $regex: /^Teste/ } });
    await User.deleteMany({ email: { $regex: /@teste\.com$/ } });
    console.log('\n🧹 Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar teste
testSchoolIsolation();
