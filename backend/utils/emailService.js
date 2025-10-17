const nodemailer = require('nodemailer');

// Configuração do transporter de email
const createTransporter = () => {
  // Para desenvolvimento, usar Gmail (você pode configurar outras opções)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'contato.yufin@gmail.com',
      pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Template do email para validação dos pais
const createParentValidationEmail = (parentEmail, studentCPF, validationToken) => {
  const validationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/validate-parent-consent?token=${validationToken}`;
  
  return {
    from: process.env.EMAIL_USER || 'contato.yufin@gmail.com',
    to: parentEmail,
    subject: '🧡 YüFin - Autorização para Acesso Educativo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #EE9116 0%, #FFB84D 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🧡 YüFin</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Educação financeira para o futuro</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Olá, responsável! 👋</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Seu(a) filho(a) está prestes a iniciar uma jornada de aprendizado financeiro com a <strong>YüFin</strong>, 
            uma plataforma gamificada que ensina educação financeira de forma divertida e segura.
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Antes de começar, precisamos da sua autorização para que ele(a) possa acessar as lições e recursos 
            disponíveis no <strong>plano gratuito (Iniciante)</strong>.
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            A plataforma é voltada exclusivamente para fins educativos, não envolve transações reais e segue 
            práticas de privacidade e segurança adequadas para estudantes.
          </p>
          
          <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #EE9116;">
            <h3 style="color: #333; margin-top: 0;">📘 Resumo do que seu filho(a) terá acesso:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>9 lições educativas por mês</li>
              <li>1 série à escolha</li>
              <li>Sistema de pontos e conquistas (XP e níveis)</li>
              <li>Dashboard simples de progresso</li>
            </ul>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #333; margin-top: 0;">🛡️ Importante:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>Nenhuma informação pessoal é compartilhada externamente.</li>
              <li>O uso é destinado apenas ao aprendizado e desenvolvimento de hábitos financeiros saudáveis.</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${validationUrl}" 
               style="background: linear-gradient(135deg, #EE9116 0%, #FFB84D 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(238, 145, 22, 0.3);">
              👉 Autorizar e iniciar o aprendizado
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Caso tenha dúvidas sobre o funcionamento da YüFin ou deseje mais informações, 
            nossa equipe está disponível em <a href="mailto:contato.yufin@gmail.com" style="color: #EE9116;">contato.yufin@gmail.com</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            <strong>Com gratidão,</strong><br>
            Equipe YüFin 🧡<br>
            Educação financeira para o futuro de quem mais importa.
          </p>
        </div>
      </div>
    `
  };
};

// Função para enviar email de validação dos pais
const sendParentValidationEmail = async (parentEmail, studentCPF, validationToken) => {
  try {
    // Verificar se as configurações de email estão disponíveis
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ [DEV MODE] Configurações de email não encontradas, simulando envio');
      console.log('📧 Para:', parentEmail);
      console.log('🔑 Token:', validationToken);
      console.log('🔗 Link de validação:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/validate-parent-consent?token=${validationToken}`);
      return { success: true, messageId: 'dev-simulation' };
    }
    
    console.log('📧 Tentando enviar email para:', parentEmail);
    console.log('🔧 Usando EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔧 EMAIL_PASS configurado:', !!process.env.EMAIL_PASS);
    
    const transporter = createTransporter();
    
    // Verificar se o transporter foi criado corretamente
    if (!transporter) {
      throw new Error('Falha ao criar transporter de email');
    }
    
    const mailOptions = createParentValidationEmail(parentEmail, studentCPF, validationToken);
    
    console.log('📤 Enviando email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de validação enviado com sucesso:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Erro detalhado ao enviar email de validação:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Em caso de erro, retornar sucesso simulado para não bloquear o cadastro
    console.log('⚠️ Retornando sucesso simulado devido ao erro de email');
    return { success: true, messageId: 'error-simulation', error: error.message };
  }
};

// Função para enviar email de confirmação de cadastro
const sendRegistrationConfirmationEmail = async (parentEmail, studentCPF) => {
  try {
    // Modo de desenvolvimento - simular envio de email
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
      console.log('🔧 [DEV MODE] Simulando envio de email de confirmação');
      console.log('📧 Para:', parentEmail);
      console.log('👤 CPF:', studentCPF);
      return { success: true, messageId: 'dev-simulation' };
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'contato.yufin@gmail.com',
      to: parentEmail,
      subject: '✅ YüFin - Cadastro Confirmado com Sucesso!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ YüFin</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Cadastro Confirmado!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Parabéns! 🎉</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              O cadastro do seu filho(a) na <strong>YüFin</strong> foi confirmado com sucesso! 
              Agora ele(a) pode começar sua jornada de aprendizado financeiro.
            </p>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin-top: 0;">🎓 Próximos passos:</h3>
              <ul style="color: #155724; line-height: 1.8;">
                <li>Seu filho(a) já pode fazer login na plataforma</li>
                <li>Acessar as 9 lições educativas disponíveis</li>
                <li>Começar a ganhar XP e conquistas</li>
                <li>Acompanhar o progresso no dashboard</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Se tiver alguma dúvida, nossa equipe está disponível em 
              <a href="mailto:contato.yufin@gmail.com" style="color: #EE9116;">contato.yufin@gmail.com</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
              <strong>Com gratidão,</strong><br>
              Equipe YüFin 🧡<br>
              Educação financeira para o futuro de quem mais importa.
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmação enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendParentValidationEmail,
  sendRegistrationConfirmationEmail
};
