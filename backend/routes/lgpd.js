const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Class = require('../models/Class');
const { authenticateToken, authorizeOwner } = require('../middleware/auth');

/**
 * DELETE /lgpd/delete-account/:userId
 * Exclui completamente os dados do usuário (Direito ao esquecimento - LGPD Art. 18)
 */
router.delete('/delete-account/:userId', 
  authenticateToken,
  authorizeOwner,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const { confirmPassword } = req.body;
      
      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Verificar senha para confirmação
      if (confirmPassword) {
        const { comparePassword } = require('../utils/password');
        const isPasswordValid = await comparePassword(confirmPassword, user.passwordHash);
        
        if (!isPasswordValid) {
          return res.status(401).json({ 
            error: 'Senha incorreta',
            code: 'INVALID_PASSWORD'
          });
        }
      }
      
      // Log de auditoria LGPD
      console.log(`[LGPD] Início exclusão de conta: ${user.email} (${user.role}) - ID: ${userId}`);
      
      // Limpeza baseada no tipo de usuário
      if (user.role === 'student') {
        // Remover de turmas
        if (user.classId) {
          await Class.updateOne(
            { _id: user.classId },
            { $pull: { students: userId } }
          );
        }
        
        // Remover de vínculos de responsáveis
        await User.updateMany(
          { linkedStudents: userId },
          { $pull: { linkedStudents: userId } }
        );
        
        // Remover de listas de amigos
        await User.updateMany(
          { 'friends.userId': userId },
          { $pull: { friends: { userId: userId } } }
        );
        
      } else if (user.role === 'parent') {
        // Desvincular filhos
        if (user.linkedStudents && user.linkedStudents.length > 0) {
          await User.updateMany(
            { _id: { $in: user.linkedStudents } },
            { $unset: { parentId: 1 } }
          );
        }
        
      } else if (user.role === 'school') {
        // Remover vínculo escolar dos alunos
        await User.updateMany(
          { schoolId: userId },
          { $unset: { schoolId: 1, classId: 1 } }
        );
        
        // Excluir turmas da escola
        await Class.deleteMany({ schoolId: userId });
      }
      
      // Anonimizar dados em vez de excluir completamente (para integridade de dados históricos)
      const deletedEmail = `deleted_${Date.now()}@yufin.deleted`;
      const deletedUser = await User.findByIdAndUpdate(userId, {
        $set: {
          name: '[Usuário Excluído]',
          email: deletedEmail,
          passwordHash: 'DELETED',
          deletedAt: new Date(),
          isDeleted: true,
          // Limpar dados pessoais sensíveis
          'progress.achievements': [],
          'savings.transactions': [],
          'savings.goals': [],
          'privacySettings': {},
          'settings': {}
        }
      }, { new: true });
      
      console.log(`[LGPD] Conta anonimizada com sucesso: ${deletedEmail}`);
      
      res.json({
        message: 'Conta excluída com sucesso conforme LGPD',
        deletedAt: deletedUser.deletedAt,
        code: 'ACCOUNT_DELETED'
      });
      
    } catch (error) {
      console.error('[LGPD] Erro ao excluir conta:', error);
      res.status(500).json({ 
        error: 'Erro ao processar exclusão de conta',
        code: 'DELETE_ERROR'
      });
    }
  }
);

/**
 * GET /lgpd/export-data/:userId
 * Exporta todos os dados do usuário (Direito de portabilidade - LGPD Art. 18)
 */
router.get('/export-data/:userId',
  authenticateToken,
  authorizeOwner,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Preparar dados para exportação
      const exportData = {
        exportDate: new Date().toISOString(),
        userData: {
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          gradeId: user.gradeId,
          playerId: user.playerId
        },
        progress: user.progress,
        savings: user.savings,
        friends: user.friends,
        settings: user.settings,
        privacySettings: user.privacySettings
      };
      
      // Se for aluno, incluir dados de turma
      if (user.role === 'student' && user.classId) {
        const classData = await Class.findById(user.classId);
        exportData.class = classData ? {
          name: classData.name,
          grade: classData.grade
        } : null;
      }
      
      console.log(`[LGPD] Exportação de dados realizada: ${user.email}`);
      
      res.json({
        message: 'Dados exportados conforme LGPD',
        data: exportData
      });
      
    } catch (error) {
      console.error('[LGPD] Erro ao exportar dados:', error);
      res.status(500).json({ 
        error: 'Erro ao exportar dados',
        code: 'EXPORT_ERROR'
      });
    }
  }
);

/**
 * GET /lgpd/privacy-policy
 * Retorna a política de privacidade
 */
router.get('/privacy-policy', (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2025-01-10',
    policy: {
      title: 'Política de Privacidade - YüFin',
      sections: [
        {
          title: '1. Coleta de Dados',
          content: 'Coletamos apenas os dados necessários para o funcionamento da plataforma educacional, incluindo: nome, email, progresso educacional e dados de gamificação.'
        },
        {
          title: '2. Uso dos Dados',
          content: 'Os dados são utilizados exclusivamente para fins educacionais, acompanhamento de progresso e personalização da experiência de aprendizado.'
        },
        {
          title: '3. Compartilhamento',
          content: 'Dados pessoais não são compartilhados com terceiros. Escolas vinculadas têm acesso apenas ao progresso educacional de seus alunos.'
        },
        {
          title: '4. Direitos do Titular (LGPD)',
          content: 'Você tem direito a: acessar seus dados, corrigi-los, excluí-los, portar para outro serviço e revogar consentimento a qualquer momento.'
        },
        {
          title: '5. Menores de Idade',
          content: 'Para estudantes menores de 18 anos, é obrigatório o consentimento dos pais ou responsáveis legais.'
        },
        {
          title: '6. Segurança',
          content: 'Utilizamos criptografia, autenticação segura e boas práticas para proteger seus dados.'
        },
        {
          title: '7. Cookies',
          content: 'Utilizamos cookies apenas para autenticação e preferências de usuário.'
        },
        {
          title: '8. Contato',
          content: 'Para exercer seus direitos ou tirar dúvidas: privacidade@yufin.com.br'
        }
      ]
    }
  });
});

/**
 * GET /lgpd/terms
 * Retorna os termos de uso
 */
router.get('/terms', (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2025-01-10',
    terms: {
      title: 'Termos de Uso - YüFin',
      sections: [
        {
          title: '1. Aceite dos Termos',
          content: 'Ao usar o YüFin, você concorda com estes termos e com nossa Política de Privacidade.'
        },
        {
          title: '2. Uso da Plataforma',
          content: 'A plataforma destina-se exclusivamente a fins educacionais. É proibido usar para finalidades ilícitas ou que violem direitos de terceiros.'
        },
        {
          title: '3. Contas de Usuário',
          content: 'Você é responsável por manter a confidencialidade de sua senha e por todas as atividades em sua conta.'
        },
        {
          title: '4. Conteúdo',
          content: 'Todo o conteúdo educacional é propriedade do YüFin e protegido por direitos autorais.'
        },
        {
          title: '5. Responsabilidades',
          content: 'O YüFin não se responsabiliza por decisões financeiras tomadas baseadas no aprendizado na plataforma.'
        }
      ]
    }
  });
});

module.exports = router;

