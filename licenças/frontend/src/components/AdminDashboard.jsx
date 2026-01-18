import React, { useState, useEffect } from 'react';
import CreateFamilyLicense from './CreateFamilyLicense';
import CreateSchoolLicense from './CreateSchoolLicense';
import LicenseList from './LicenseList';

const AdminDashboard = ({ adminUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('create-family');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tabs = [
    { id: 'create-family', label: 'Criar Licença Família', icon: '👨‍👩‍👧‍👦' },
    { id: 'create-school', label: 'Criar Licença Escola', icon: '🏫' },
    { id: 'list', label: 'Listar Licenças', icon: '📋' }
  ];

  const responsiveStyles = getResponsiveStyles(isMobile);

  return (
    <div style={{ ...styles.container, ...responsiveStyles.container }}>
      <header style={{ ...styles.header, ...responsiveStyles.header }}>
        <div>
          <h1 style={{ ...styles.title, ...responsiveStyles.title }}>
            <span style={styles.logo}>YüFin</span>
            <span style={{ ...styles.subtitleText, ...responsiveStyles.subtitleText }}> Geração Manual de Licenças</span>
          </h1>
          <p style={styles.subtitle}>Bem-vindo, {adminUser?.name || adminUser?.email}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutButton}>
          Sair
        </button>
      </header>

      <nav style={{ ...styles.nav, ...responsiveStyles.nav }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
              ...(isMobile ? styles.tabMobile : {})
            }}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            {isMobile ? (
              <span style={styles.tabLabelMobile}>{tab.label.split(' ').pop()}</span>
            ) : (
              <span>{tab.label}</span>
            )}
          </button>
        ))}
      </nav>

      <main style={{ ...styles.main, ...responsiveStyles.main }}>
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
    padding: '20px',
    overflowX: 'hidden',
    maxWidth: '100vw',
    boxSizing: 'border-box'
  },
  header: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: '1 1 auto',
    minWidth: 0
  },
  logo: {
    fontSize: '32px',
    fontFamily: "'Cherry Bomb One', cursive",
    fontWeight: '400',
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB300 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1',
    display: 'inline-block',
    verticalAlign: 'top',
    marginTop: '-12px'
  },
  subtitleText: {
    fontSize: '24px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    color: '#333',
    marginLeft: '8px',
    wordBreak: 'break-word'
  },
  subtitle: {
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    color: '#666',
    width: '100%'
  },
  logoutButton: {
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    flexShrink: 0
  },
  nav: {
    background: 'white',
    borderRadius: '16px',
    padding: '12px',
    marginBottom: '20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  tab: {
    flex: '1 1 auto',
    minWidth: 0,
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '600',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #EE9116 0%, #FFB84D 100%)',
    color: 'white'
  },
  tabIcon: {
    fontSize: '18px',
    flexShrink: 0
  },
  main: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    width: '100%'
  },
  tabMobile: {
    fontSize: '11px',
    padding: '8px 10px',
    gap: '4px'
  },
  tabLabelMobile: {
    display: 'inline-block'
  }
};

// Media query styles para mobile
const getResponsiveStyles = (isMobile) => {
  if (!isMobile) return {};
  
  return {
    container: {
      padding: '12px'
    },
    header: {
      padding: '16px'
    },
    title: {
      fontSize: '18px'
    },
    subtitleText: {
      fontSize: '16px',
      marginLeft: '4px'
    },
    main: {
      padding: '16px'
    },
    nav: {
      padding: '8px'
    }
  };
};

export default AdminDashboard;

