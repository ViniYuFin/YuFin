import React, { useState, useEffect } from 'react';
import LicenseCodeModal from './LicenseCodeModal';
import SchoolLicenseCodeModal from './SchoolLicenseCodeModal';

const Welcome = ({ setActiveScreen }) => {
  console.log('🏠 Welcome component renderizado!');
  
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showRegisterOptions, setShowRegisterOptions] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showSchoolLicenseModal, setShowSchoolLicenseModal] = useState(false);
  const [autoLicenseCode, setAutoLicenseCode] = useState(null);

  // Detectar parâmetros de licença na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const license = urlParams.get('license');
    const type = urlParams.get('type');
    
    console.log('🔍 Welcome: Detectando parâmetros de URL - license:', license, 'type:', type);
    
    if (license && type) {
      console.log('✅ Welcome: Licença detectada, abrindo modal automaticamente');
      setAutoLicenseCode(license);
      
      if (type === 'family') {
        console.log('👨‍👩‍👧‍👦 Welcome: Abrindo modal de licença familiar');
        setShowLicenseModal(true);
      } else if (type === 'school') {
        console.log('🏫 Welcome: Abrindo modal de licença escolar');
        setShowSchoolLicenseModal(true);
      }
    }
  }, []);

  const handleLicenseConfirm = (licenseCode) => {
    // Aqui seria validada a licença e depois redirecionado para registro
    setShowLicenseModal(false);
    // Armazenar o código da licença no localStorage para o componente Register acessar
    localStorage.setItem('pendingFamilyLicense', licenseCode);
    setActiveScreen('register-parent');
  };

  const handleLicenseCancel = () => {
    setShowLicenseModal(false);
  };

  const handleSchoolLicenseConfirm = (licenseCode) => {
    setShowSchoolLicenseModal(false);
    // Armazenar o código da licença no localStorage para o componente Register acessar
    localStorage.setItem('pendingSchoolLicense', licenseCode);
    setActiveScreen('register-school');
  };

  const handleSchoolLicenseCancel = () => {
    setShowSchoolLicenseModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen auth-background p-4 animate-fadeIn">
      <div className="animate-bounce-in">
        <h1 className="text-6xl font-yufin text-white mb-4 drop-shadow-lg text-center">YüFin</h1>
        <p className="text-xl lg:text-2xl xl:text-3xl text-white mb-10 text-center max-w-md lg:max-w-lg xl:max-w-xl animate-slideIn">
          Desvende o mundo das finanças de forma divertida e gamificada!
        </p>
      </div>

      <div className="flex flex-col space-y-4 w-full max-w-xs lg:max-w-sm xl:max-w-md animate-slideIn">
        {/* Botão de Entrar */}
        <div className="relative">
          <button
            onClick={() => setShowLoginOptions(!showLoginOptions)}
            className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-opacity-90 transition-all duration-300 text-lg hover-lift"
          >
            Entrar
          </button>
          {showLoginOptions && (
            <div className="flex flex-col items-center justify-center space-y-2 mt-2 animate-fadeIn">
              <button
                onClick={() => { setActiveScreen('login-student'); setShowLoginOptions(false); }}
                className="w-full bg-white text-primary border-2 text-sm py-2 rounded-lg shadow-sm hover:bg-primary hover:text-white transition-colors duration-200 hover-lift"
                style={{ borderColor: 'rgb(238, 145, 22)' }}
              >
                Sou Aluno
              </button>
              <button
                onClick={() => { setActiveScreen('login-parent'); setShowLoginOptions(false); }}
                className="w-full bg-white text-primary border-2 text-sm py-2 rounded-lg shadow-sm hover:bg-primary hover:text-white transition-colors duration-200 hover-lift"
                style={{ borderColor: 'rgb(238, 145, 22)' }}
              >
                Sou Pai/Responsável
              </button>
              <button
                onClick={() => { setActiveScreen('login-school'); setShowLoginOptions(false); }}
                className="w-full bg-white text-primary border-2 text-sm py-2 rounded-lg shadow-sm hover:bg-primary hover:text-white transition-colors duration-200 hover-lift"
                style={{ borderColor: 'rgb(238, 145, 22)' }}
              >
                Sou Escola
              </button>
            </div>
          )}
        </div>

        {/* Botão de Registrar */}
        <div className="relative">
          <button
            onClick={() => setShowRegisterOptions(!showRegisterOptions)}
            className="w-full bg-teal text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-opacity-90 transition-all duration-300 text-lg hover-lift"
          >
            Registrar
          </button>
          {showRegisterOptions && (
            <div className="flex flex-col items-center justify-center space-y-2 mt-2 animate-fadeIn">
              <button
                onClick={() => { setActiveScreen('register-student'); setShowRegisterOptions(false); }}
                className="w-full bg-white text-teal border-2 text-sm py-2 rounded-lg shadow-sm hover:bg-teal hover:text-white transition-colors duration-200 hover-lift"
                style={{ borderColor: 'rgb(238, 145, 22)' }}
              >
                Sou Aluno
              </button>
              <button
                onClick={() => { setShowLicenseModal(true); setShowRegisterOptions(false); }}
                className="w-full bg-white text-teal border-2 text-sm py-2 rounded-lg shadow-sm hover:bg-teal hover:text-white transition-colors duration-200 hover-lift"
                style={{ borderColor: 'rgb(238, 145, 22)' }}
              >
                Sou Pai/Responsável
              </button>
              <button
                onClick={() => { setShowSchoolLicenseModal(true); setShowRegisterOptions(false); }}
                className="w-full bg-white text-teal border-2 text-sm py-2 rounded-lg shadow-sm hover:bg-teal hover:text-white transition-colors duration-200 hover-lift"
                style={{ borderColor: 'rgb(238, 145, 22)' }}
              >
                Sou Escola
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Código de Licença */}
      <LicenseCodeModal
        isOpen={showLicenseModal}
        onClose={handleLicenseCancel}
        onConfirm={handleLicenseConfirm}
        initialLicenseCode={autoLicenseCode}
      />
      <SchoolLicenseCodeModal
        isOpen={showSchoolLicenseModal}
        onClose={handleSchoolLicenseCancel}
        onConfirm={handleSchoolLicenseConfirm}
        initialLicenseCode={autoLicenseCode}
      />
    </div>
  );
};

export default Welcome;
