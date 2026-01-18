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

