import React, { useState } from 'react';
import CreateFamilyLicense from './CreateFamilyLicense';
import CreateSchoolLicense from './CreateSchoolLicense';
import LicenseList from './LicenseList';

const AdminDashboard = ({ adminUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('create-family');

  const tabs = [
    { id: 'create-family', label: 'Criar Licença Família', icon: '👨‍👩‍👧‍👦' },
    { id: 'create-school', label: 'Criar Licença Escola', icon: '🏫' },
    { id: 'list', label: 'Listar Licenças', icon: '📋' }
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span style={styles.logo}>YüFin</span>
            <span style={styles.subtitleText}> - Geração Manual de Licenças</span>
          </h1>
          <p style={styles.subtitle}>Bem-vindo, {adminUser?.name || adminUser?.email}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutButton}>
          Sair
        </button>
      </header>

      <nav style={styles.nav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeTab === 'create-family' && <CreateFamilyLicense />}
        {activeTab === 'create-school' && <CreateSchoolLicense />}
        {activeTab === 'list' && <LicenseList />}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    padding: '20px'
  },
  header: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    fontSize: '32px',
    fontFamily: "'Cherry Bomb One', cursive",
    fontWeight: '400',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1'
  },
  subtitleText: {
    fontSize: '24px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    color: '#333',
    marginLeft: '8px'
  },
  subtitle: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666'
  },
  logoutButton: {
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600'
  },
  nav: {
    background: 'white',
    borderRadius: '16px',
    padding: '12px',
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  tab: {
    flex: 1,
    padding: '12px 20px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB84D 100%)',
    color: 'white'
  },
  tabIcon: {
    fontSize: '20px'
  },
  main: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }
};

export default AdminDashboard;

