import { readFileSync } from 'fs';
import { resolve } from 'path';

export function simpleLandingPlugin() {
  return {
    name: 'simple-landing',
    configureServer(server) {
      server.middlewares.use('/', (req, res, next) => {
        // Se for uma rota do app ou assets do Vite, continuar
        if (req.url.startsWith('/app') || 
            req.url.startsWith('/@vite') || 
            req.url.startsWith('/src') || 
            req.url.startsWith('/node_modules')) {
          next();
          return;
        }
        
        // Para assets da landing (CSS, JS, favicon, etc.)
        if (req.url.startsWith('/css/') || 
            req.url.startsWith('/js/') || 
            req.url.startsWith('/assets/') ||
            req.url === '/favicon.ico' ||
            req.url.endsWith('.json') ||
            req.url.endsWith('.txt') ||
            req.url.endsWith('.xml') ||
            req.url.endsWith('.css') ||
            req.url.endsWith('.js')) {
          try {
            // Remover a barra inicial da URL
            const cleanUrl = req.url.startsWith('/') ? req.url.substring(1) : req.url;
            const filePath = resolve(process.cwd(), 'public-landing', cleanUrl);
            const content = readFileSync(filePath);
            
            // Determinar tipo de conteúdo
            if (req.url.endsWith('.css')) {
              res.setHeader('Content-Type', 'text/css');
            } else if (req.url.endsWith('.js')) {
              res.setHeader('Content-Type', 'application/javascript');
            } else if (req.url.endsWith('.ico')) {
              res.setHeader('Content-Type', 'image/x-icon');
            } else if (req.url.endsWith('.json')) {
              res.setHeader('Content-Type', 'application/json');
            } else if (req.url.includes('/assets/')) {
              res.setHeader('Content-Type', 'image/x-icon');
            }
            
            if (!res.headersSent) {
              res.end(content);
              return;
            }
          } catch (error) {
            next();
          }
        }
        
        // Para outras páginas da landing
        if (req.url === '/planos.html' || req.url === '/sobre-contato.html') {
          try {
            const fileName = req.url.substring(1);
            const filePath = resolve(process.cwd(), 'public-landing', fileName);
            const content = readFileSync(filePath, 'utf-8');
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'text/html');
              res.end(content);
              return;
            }
          } catch (error) {
            // Continuar se houver erro
          }
        }
        
        // Para a raiz ou index, servir landing page
        if (req.url === '/' || req.url === '/index.html') {
          try {
            const landingPath = resolve(process.cwd(), 'public-landing/index-clean.html');
            const landingHtml = readFileSync(landingPath, 'utf-8');
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'text/html');
              res.end(landingHtml);
              return;
            }
          } catch (error) {
            // Continuar se houver erro
          }
        }
        
        // Para qualquer outra requisição, continuar
        next();
      });
    }
  };
}
