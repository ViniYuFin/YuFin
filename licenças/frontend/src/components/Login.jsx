import React, { useState } from 'react';
import API_BASE_URL, { apiRequest } from '../config/api';
import toast from 'react-hot-toast';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Debug: verificar o que está sendo enviado
      console.log('🔐 Frontend - Dados do login:', {
        email: email.toLowerCase().trim(),
        passwordLength: password.length,
        passwordPreview: password.substring(0, 3) + '***',
        apiUrl: API_BASE_URL
      });

      // Tentar login via endpoint de auth usando API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password: password, // Garantir que a senha completa seja enviada
          role: 'admin' // Especificar role admin para login administrativo
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Verificar se é admin
      if (data.user.role !== 'admin') {
        throw new Error('Acesso negado. Apenas administradores podem acessar.');
      }

      // Passar o user e o accessToken para o App
      onLogin(data.user, data.accessToken);
    } catch (error) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: forgotPasswordEmail.toLowerCase().trim(),
          role: 'admin' // Especificar role admin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar redefinição de senha');
      }

      toast.success('Email de redefinição enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error) {
      toast.error(error.message || 'Erro ao solicitar redefinição de senha');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.card,
        opacity: showForgotPassword ? 0.3 : 1,
        pointerEvents: showForgotPassword ? 'none' : 'auto',
        transition: 'opacity 0.3s ease'
      }}>
        <h1 style={styles.title}>YüFin</h1>
        <h2 style={styles.subtitle}>Geração Manual de Licenças</h2>
        <p style={styles.description}>Acesso restrito a administradores</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="admin@yufin.com.br"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(true);
              }}
              style={styles.forgotPasswordLink}
            >
              Esqueci minha senha
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      {showForgotPassword && (
        <div style={styles.forgotPasswordModal}>
          <div style={styles.forgotPasswordCard}>
            <h3 style={styles.forgotPasswordTitle}>Esqueci minha senha</h3>
            <p style={styles.forgotPasswordDescription}>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleForgotPassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="admin@yufin.com"
                />
              </div>
              <div style={styles.forgotPasswordActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                  }}
                  style={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  style={{
                    ...styles.button,
                    opacity: forgotPasswordLoading ? 0.6 : 1,
                    cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {forgotPasswordLoading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '48px',
    fontFamily: "'Cherry Bomb One', cursive",
    fontWeight: '400',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center',
    marginBottom: '8px',
    lineHeight: '1'
  },
  subtitle: {
    fontSize: '20px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: '8px'
  },
  description: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666',
    textAlign: 'center',
    marginBottom: '32px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    color: '#333'
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB84D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  forgotPasswordLink: {
    fontSize: '12px',
    fontFamily: "'Nunito', sans-serif",
    color: '#EE9116',
    textDecoration: 'none',
    textAlign: 'left',
    marginTop: '4px',
    cursor: 'pointer'
  },
  forgotPasswordModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(4px)'
  },
  forgotPasswordCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    position: 'relative',
    zIndex: 1001
  },
  forgotPasswordTitle: {
    fontSize: '24px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    textAlign: 'center'
  },
  forgotPasswordDescription: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666',
    textAlign: 'center',
    marginBottom: '24px'
  },
  forgotPasswordActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '12px 20px',
    background: '#f3f4f6',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  }
};

export default Login;

