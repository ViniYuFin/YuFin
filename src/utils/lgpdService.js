// Utilitários para conformidade LGPD
import { authenticatedRequest } from '../config/api';
import notificationService from './notificationService';

export const lgpdService = {
  // Exportar dados pessoais
  async exportUserData(userId) {
    try {
      const response = await authenticatedRequest(`/lgpd/export-data/${userId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      const data = await response.json();
      
      // Criar e baixar arquivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dados-pessoais-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notificationService.success('Dados exportados com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      notificationService.error('Erro ao exportar dados: ' + error.message);
      throw error;
    }
  },

  // Solicitar exclusão de dados
  async requestDataDeletion(userId) {
    try {
      const response = await authenticatedRequest(`/lgpd/delete-data/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao solicitar exclusão de dados');
      }

      const result = await response.json();
      
      notificationService.success('Solicitação de exclusão enviada com sucesso!');
      return result;
    } catch (error) {
      console.error('Erro ao solicitar exclusão:', error);
      notificationService.error('Erro ao solicitar exclusão: ' + error.message);
      throw error;
    }
  },

  // Verificar status de solicitação de exclusão
  async checkDeletionStatus(userId) {
    try {
      const response = await authenticatedRequest(`/lgpd/deletion-status/${userId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar status');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  },

  // Validar consentimento parental
  validateParentalConsent(consentData) {
    const required = ['termsAccepted', 'privacyAccepted', 'dataProcessingAccepted', 'parentEmail'];
    
    for (const field of required) {
      if (!consentData[field]) {
        throw new Error(`Campo obrigatório não fornecido: ${field}`);
      }
    }

    if (!consentData.termsAccepted || !consentData.privacyAccepted || !consentData.dataProcessingAccepted) {
      throw new Error('Todos os termos devem ser aceitos');
    }

    // Validar email do responsável
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(consentData.parentEmail)) {
      throw new Error('E-mail do responsável inválido');
    }

    return true;
  },

  // Gerar registro de consentimento
  generateConsentRecord(consentData, studentInfo) {
    return {
      studentId: studentInfo.id,
      studentName: studentInfo.name,
      parentEmail: consentData.parentEmail,
      consentGiven: true,
      consentDate: consentData.consentDate || new Date().toISOString(),
      termsAccepted: consentData.termsAccepted,
      privacyAccepted: consentData.privacyAccepted,
      dataProcessingAccepted: consentData.dataProcessingAccepted,
      ipAddress: 'N/A', // Será preenchido pelo backend
      userAgent: navigator.userAgent,
      version: '1.0'
    };
  }
};

export default lgpdService;
