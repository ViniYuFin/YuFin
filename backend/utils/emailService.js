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
  const validationUrl = `${process.env.FRONTEND_URL || 'https://app.yufin.com.br'}/validate-parent-consent?token=${validationToken}`;
  
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
      console.log('🔗 Link de validação:', `${process.env.FRONTEND_URL || 'https://app.yufin.com.br'}/validate-parent-consent?token=${validationToken}`);
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

// Template do email de confirmação de licença
const createLicenseConfirmationEmail = (licenseData) => {
  const { type, code, planData, individualLicenses, availableTokens } = licenseData;
  
  return {
    subject: 'Bem-vindo ao YüFin! Seu acesso está liberado 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bem-vindo ao YüFin!</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #EE9116 0%, #FFB84D 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 15px 15px 0 0; 
            margin-bottom: 0;
          }
          .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 15px 15px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .license-box { 
            background: #f0f8ff; 
            border: 2px solid #EE9116; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 10px; 
            text-align: center;
          }
          .license-code { 
            font-size: 28px; 
            font-weight: bold; 
            color: #EE9116; 
            text-align: center; 
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          }
          .steps { 
            background: #e8f5e8; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 10px; 
            border-left: 4px solid #28a745;
          }
          .button { 
            background: linear-gradient(135deg, #EE9116 0%, #FFB84D 100%); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            display: inline-block; 
            margin: 10px 5px; 
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(238, 145, 22, 0.3);
          }
          .button:hover { 
            background: linear-gradient(135deg, #d17a0a 0%, #e6a63a 100%); 
          }
          .yufin-link {
            color: #EE9116;
            font-weight: bold;
            text-decoration: none;
            border-bottom: 2px solid #EE9116;
            padding-bottom: 1px;
            transition: all 0.3s ease;
          }
          .yufin-link:hover {
            color: #d17a0a;
            border-bottom-color: #d17a0a;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #666; 
            font-size: 14px; 
            padding: 20px;
            border-top: 1px solid #eee;
          }
          .highlight {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">
              <a href="https://app.yufin.com.br" style="color: white; text-decoration: none;">🧡 YüFin</a>
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Educação financeira é uma decisão e ela começa em você.</p>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-top: 0;">Olá,</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              É um prazer ter você conosco na <strong>YüFin</strong>, a plataforma que transforma educação financeira 
              em uma experiência divertida, interativa e cheia de conquistas!
            </p>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              Você já pode começar a explorar todas as funcionalidades do seu plano.<br>
              Para ativar seu acesso, utilize o código de licença abaixo:
            </p>
            
            <div class="license-box">
              <h3 style="color: #333; margin-top: 0;">Seu código de licença:</h3>
              <div class="license-code">${code}</div>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                Basta inseri-lo na tela de login do YüFin para liberar o cadastramento e todos os recursos disponíveis!
              </p>
            </div>
            
            <div class="steps">
              <h3 style="color: #155724; margin-top: 0;">💡 Dicas para começar bem:</h3>
              <ol style="color: #155724; line-height: 1.8;">
                <li>Acesse o portal: <a href="https://app.yufin.com.br" class="yufin-link">YüFin</a></li>
                <li>Crie sua conta clicando em <strong>Registrar</strong></li>
                <li>Insira o código de licença acima</li>
                <li>Conclua o cadastro</li>
                <li><strong>Pronto! Sua jornada financeira começa agora</strong></li>
              </ol>
            </div>
            
            <div class="highlight">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>📋 Resumo do seu plano:</strong><br>
                ${type === 'family' 
                  ? `Plano Família - ${planData.numParents} responsável(is) + ${planData.numStudents} aluno(s)`
                  : `Plano Escola - ${planData.numStudents} aluno(s)`
                }<br>
                <strong>Valor pago:</strong> R$ ${planData.totalPrice.toFixed(2)}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://app.yufin.com.br" class="button">🚀 Acessar YüFin</a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Em caso de dúvidas, nossa equipe de suporte está sempre à disposição em 
              <a href="mailto:contato.yufin@gmail.com" style="color: #EE9116; font-weight: bold;">contato.yufin@gmail.com</a>.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #888;">
              <strong>Com gratidão,</strong><br>
              Equipe YüFin 🧡<br>
              Educação financeira é uma decisão e ela começa em você.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Função para enviar email de confirmação de licença
const sendLicenseConfirmationEmail = async (email, licenseData) => {
  try {
    console.log('🔍 DEBUG EMAIL: Parâmetros recebidos:', { email, licenseData });
    
    // Validação mais rigorosa do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = email && 
                        typeof email === 'string' && 
                        email !== 'undefined' && 
                        email !== 'null' && 
                        email.trim() !== '' && 
                        !email.includes('XXXXXXXXXXX') &&
                        emailRegex.test(email);
    
    console.log('🔍 DEBUG EMAIL: Validação do email:', {
      email,
      type: typeof email,
      isString: typeof email === 'string',
      notUndefined: email !== 'undefined',
      notNull: email !== 'null',
      notEmpty: email.trim() !== '',
      notMasked: !email.includes('XXXXXXXXXXX'),
      regexTest: emailRegex.test(email),
      isValid: isValidEmail
    });
    
    if (!isValidEmail) {
      console.error('❌ DEBUG EMAIL: Email inválido recebido:', email);
      return { success: false, error: 'Email inválido ou mascarado' };
    }
    
    console.log('📧 Enviando email de confirmação de licença para:', email);
    
    // Verificar se as configurações de email estão disponíveis
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ [DEV MODE] Configurações de email não encontradas, simulando envio');
      console.log('📧 Para:', email);
      console.log('📧 Código da licença:', licenseData.code);
      console.log('📧 Tipo:', licenseData.type);
      return { success: true, messageId: 'dev-simulation' };
    }
    
    const emailTemplate = createLicenseConfirmationEmail(licenseData);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };
    
    console.log('📤 Enviando email de confirmação...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmação enviado com sucesso:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação:', error);
    return { success: false, error: error.message };
  }
};

// Função para enviar email de redefinição de senha
const sendPasswordResetEmail = async (email, resetToken, role = 'admin') => {
  try {
    // Determinar a URL correta baseada no role
    let resetUrl;
    if (role === 'admin') {
      // Para admin, usar URL específica do admin panel (gerador de licenças)
      const adminUrl = process.env.ADMIN_FRONTEND_URL || process.env.LICENSES_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5174';
      resetUrl = `${adminUrl}/reset-password?token=${resetToken}`;
    } else {
      // Para outros perfis (student, parent, school), usar FRONTEND_URL do app principal
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    }
    
    // Verificar se as configurações de email estão disponíveis
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ [DEV MODE] Configurações de email não encontradas, simulando envio');
      console.log('📧 Para:', email);
      console.log('🔑 Token:', resetToken);
      console.log('🔗 Link de redefinição:', resetUrl);
      console.log('🔧 Admin URL usada:', adminUrl);
      return { success: true, messageId: 'dev-simulation' };
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'contato.yufin@gmail.com',
      to: email,
      subject: '🔐 YüFin - Redefinição de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #EE9116 0%, #FFB300 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">YüFin</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Redefinição de Senha</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Olá! 👋</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              Recebemos uma solicitação para redefinir a senha da sua conta administrativa na <strong>YüFin</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #EE9116 0%, #FFB300 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${resetUrl}" style="color: #EE9116; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                ⚠️ <strong>Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta redefinição, ignore este email.
              </p>
            </div>
            
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
    console.log('✅ Email de redefinição de senha enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email de redefinição de senha:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendParentValidationEmail,
  sendRegistrationConfirmationEmail,
  sendLicenseConfirmationEmail,
  sendPasswordResetEmail
};
