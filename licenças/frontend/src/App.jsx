import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import toast from 'react-hot-toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Verificar se há token de reset de senha na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setShowResetPassword(true);
    }
  }, []);

  // Verificar se há token salvo ao carregar
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Token existe, mas não sabemos se é válido
      // A verificação será feita na primeira requisição
      setIsAuthenticated(true);
    }
  }, []);

  // Listener para token expirado
  useEffect(() => {
    const handleTokenExpired = () => {
      setAdminUser(null);
      setIsAuthenticated(false);
      toast.error('Sessão expirada. Por favor, faça login novamente.');
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  const handleLogin = (user, accessToken) => {
    setAdminUser(user);
    setIsAuthenticated(true);
    // Salvar o accessToken (não user.token, pois o endpoint retorna accessToken)
    localStorage.setItem('adminToken', accessToken);
    toast.success('Login realizado com sucesso!');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminToken');
    toast.success('Logout realizado!');
  };

  const handleResetPasswordSuccess = () => {
    setShowResetPassword(false);
    // Limpar token da URL
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="app">
      {showResetPassword ? (
        <ResetPassword onSuccess={handleResetPasswordSuccess} />
      ) : !isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AdminDashboard adminUser={adminUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

