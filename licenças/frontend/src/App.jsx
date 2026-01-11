import React, { useState } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import toast from 'react-hot-toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

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

  return (
    <div className="app">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AdminDashboard adminUser={adminUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

