import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import toast from 'react-hot-toast';

const ResetPassword = ({ onSuccess }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extrair token da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Token não encontrado. Por favor, use o link enviado por email.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!token) {
      setError('Token inválido. Por favor, use o link enviado por email.');
      setLoading(false);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }

      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');
      
      // Limpar token da URL
      const url = new URL(window.location);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url);
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'Erro ao redefinir senha');
      toast.error(error.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successContent}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>Senha Redefinida!</h2>
            <p style={styles.successText}>
              Sua senha foi redefinida com sucesso. Você será redirecionado para a tela de login em instantes.
            </p>
            {onSuccess && (
              <button
                onClick={onSuccess}
                style={styles.button}
              >
                Ir para Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>YüFin</h1>
        <h2 style={styles.subtitle}>Redefinir Senha</h2>
        <p style={styles.description}>Digite sua nova senha abaixo</p>

        {!token && (
          <div style={styles.warningBox}>
            <p style={styles.warningText}>
              ⚠️ Token não encontrado. Por favor, use o link enviado por email.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nova Senha</label>
            <div style={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
                disabled={loading || !token}
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading || !token}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirmar Nova Senha</label>
            <div style={styles.passwordInputWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
                disabled={loading || !token}
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                disabled={loading || !token}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              ...styles.button,
              opacity: (loading || !token) ? 0.6 : 1,
              cursor: (loading || !token) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>

        {onSuccess && (
          <button
            onClick={onSuccess}
            style={styles.backButton}
            disabled={loading}
          >
            Voltar para Login
          </button>
        )}
      </div>
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
  warningBox: {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '24px'
  },
  warningText: {
    fontSize: '13px',
    fontFamily: "'Nunito', sans-serif",
    color: '#856404',
    margin: 0,
    textAlign: 'center'
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
  passwordInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    padding: '12px',
    paddingRight: '45px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box'
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  error: {
    fontSize: '13px',
    fontFamily: "'Nunito', sans-serif",
    color: '#ef4444',
    margin: 0,
    textAlign: 'center'
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
  backButton: {
    marginTop: '16px',
    padding: '10px',
    background: 'transparent',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%'
  },
  successContent: {
    textAlign: 'center'
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  successTitle: {
    fontSize: '24px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px'
  },
  successText: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6'
  }
};

export default ResetPassword;
