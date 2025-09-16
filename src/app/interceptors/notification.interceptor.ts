import { Injectable } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Interface para tipagem da resposta da API de notificação
 */
interface NotificationResponse {
  mensagemId: string;
  [key: string]: any;
}

/**
 * Interceptor funcional para capturar automaticamente endpoints /api/notificar
 * e iniciar polling automático quando uma notificação é enviada
 */
export const NotificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  console.log('🔍 [INTERCEPTOR] Requisição interceptada:', req.method, req.url);

  // Verifica se é uma requisição para /api/notificar (POST)
  if (req.method === 'POST' && req.url.includes('/api/notificar') && !req.url.includes('/status')) {
    console.log('✅ [INTERCEPTOR] Requisição POST para /api/notificar detectada');
    
    return next(req).pipe(
      tap(event => {
        console.log('📡 [INTERCEPTOR] Evento HTTP recebido:', event.type, event);
        
        // Quando a resposta chegar com sucesso
        if (event.type === 4 && event.status === 200) { // HttpEventType.Response
          const response = event.body as NotificationResponse;
          console.log('✅ [INTERCEPTOR] Resposta 200 recebida:', response);
          
          // Se a resposta contém um ID de mensagem, inicia polling automático
          if (response && response.mensagemId) {
            console.log('🔄 [INTERCEPTOR] Iniciando polling automático para:', response.mensagemId);
            
            // Inicia polling automático para esta mensagem
            const subscription = notificationService.startPollingForMessage(response.mensagemId).subscribe({
              next: (status) => {
                console.log('📡 [INTERCEPTOR] Polling update:', status);
              },
              error: (error) => {
                console.error('❌ [INTERCEPTOR] Erro no polling automático:', error);
              },
              complete: () => {
                console.log('✅ [INTERCEPTOR] Polling automático completado para:', response.mensagemId);
              }
            });

            // Registra a subscription para controle
            notificationService.registerPollingSubscription(response.mensagemId, subscription);
          } else {
            console.warn('⚠️ [INTERCEPTOR] Resposta não contém mensagemId:', response);
          }
        }
      })
    );
  }

  // Para outras requisições, apenas passa adiante
  return next(req);
};