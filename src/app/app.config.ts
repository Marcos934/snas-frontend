import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Configuração principal da aplicação Angular
 * 
 * Define todos os providers necessários para o funcionamento do SNAS:
 * - HttpClient com fetch API para comunicação com backend
 * - Router para navegação (mesmo que não usado inicialmente)
 * - Detecção de mudanças sem Zone.js para melhor performance
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Tratamento global de erros
    provideBrowserGlobalErrorListeners(),
    
    // Detecção de mudanças otimizada (sem Zone.js)
    provideZonelessChangeDetection(),
    
    // Cliente HTTP com fetch API moderna
    provideHttpClient(withFetch()),
    
    // Sistema de rotas (preparado para expansão futura)
    provideRouter(routes)
  ]
};
