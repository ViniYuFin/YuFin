// src/utils/performanceService.js
class PerformanceService {
  constructor() {
    this.metrics = {
      pageLoadTimes: {},
      componentRenderTimes: {},
      lessonLoadTimes: {},
      memoryUsage: []
    };
    this.initializeMonitoring();
  }

  // Monitorar tempo de carregamento de páginas
  startPageLoadTimer(pageName) {
    const startTime = performance.now();
    return () => {
      const loadTime = performance.now() - startTime;
      this.metrics.pageLoadTimes[pageName] = loadTime;
      console.log(`📊 ${pageName} carregou em ${loadTime.toFixed(2)}ms`);
      
      // Alertar se carregamento for lento
      if (loadTime > 3000) {
        console.warn(`⚠️ Carregamento lento detectado: ${pageName} (${loadTime.toFixed(2)}ms)`);
      }
    };
  }

  // Monitorar renderização de componentes
  measureComponentRender(componentName, renderFunction) {
    const startTime = performance.now();
    const result = renderFunction();
    const renderTime = performance.now() - startTime;
    
    this.metrics.componentRenderTimes[componentName] = renderTime;
    
    if (renderTime > 100) {
      console.warn(`⚠️ Renderização lenta: ${componentName} (${renderTime.toFixed(2)}ms)`);
    }
    
    return result;
  }

  // Lazy loading para lições
  async preloadLesson(lessonId) {
    const startTime = performance.now();
    
    try {
      // Simular carregamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const loadTime = performance.now() - startTime;
      this.metrics.lessonLoadTimes[lessonId] = loadTime;
      
      return { success: true, loadTime };
    } catch (error) {
      console.error(`❌ Erro ao pré-carregar lição ${lessonId}:`, error);
      return { success: false, error };
    }
  }

  // Otimizar imagens
  optimizeImage(imageUrl, width = 300) {
    // Em produção, usar CDN ou serviço de otimização
    return `${imageUrl}?w=${width}&q=80&format=webp`;
  }

  // Debounce para inputs
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle para scroll events
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Limpar dados antigos
  cleanupOldData() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Limpar métricas antigas
    Object.keys(this.metrics.pageLoadTimes).forEach(key => {
      if (this.metrics.pageLoadTimes[key].timestamp < oneWeekAgo) {
        delete this.metrics.pageLoadTimes[key];
      }
    });
  }

  // Gerar relatório de performance
  generatePerformanceReport() {
    const avgPageLoad = Object.values(this.metrics.pageLoadTimes).reduce((a, b) => a + b, 0) / 
                       Object.values(this.metrics.pageLoadTimes).length || 0;
    
    const avgComponentRender = Object.values(this.metrics.componentRenderTimes).reduce((a, b) => a + b, 0) / 
                              Object.values(this.metrics.componentRenderTimes).length || 0;

    return {
      averagePageLoadTime: avgPageLoad,
      averageComponentRenderTime: avgComponentRender,
      totalPagesTracked: Object.keys(this.metrics.pageLoadTimes).length,
      totalComponentsTracked: Object.keys(this.metrics.componentRenderTimes).length,
      recommendations: this.generateRecommendations()
    };
  }

  // Gerar recomendações baseadas nas métricas
  generateRecommendations() {
    const recommendations = [];
    
    const avgPageLoad = Object.values(this.metrics.pageLoadTimes).reduce((a, b) => a + b, 0) / 
                       Object.values(this.metrics.pageLoadTimes).length || 0;
    
    if (avgPageLoad > 2000) {
      recommendations.push('Implementar lazy loading para componentes pesados');
    }
    
    if (avgPageLoad > 3000) {
      recommendations.push('Considerar code splitting para reduzir bundle size');
    }
    
    return recommendations;
  }

  // Inicializar monitoramento
  initializeMonitoring() {
    // Monitorar uso de memória
    if ('memory' in performance) {
      setInterval(() => {
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        });
      }, 30000); // A cada 30 segundos
    }

    // Limpeza automática
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Diariamente
  }
}

export default new PerformanceService(); 