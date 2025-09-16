import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { switchMap, takeWhile, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { Notification, NotificationResponse, NotificationStatus } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = environment.apiBaseUrl;
  private pollingSubscriptions = new Map<string, Subscription>(); // Controle individual

  constructor(private http: HttpClient) {}

  // Envia notificação
  sendNotification(notification: Notification): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.apiUrl}/api/notificar`,
      notification.toApiRequest()
    );
  }

  // Consulta status
  getStatus(messageId: string): Observable<NotificationStatus> {
    console.log('🔍 [SERVICE] Consultando status para:', messageId);
    console.log('🔍 [SERVICE] URL completa:', `${this.apiUrl}/api/notificar/status/${messageId}`);
    
    return this.http.get<NotificationStatus>(
      `${this.apiUrl}/api/notificar/status/${messageId}`
    ).pipe(
      tap(response => {
        console.log('📡 [SERVICE] Resposta da API recebida:', response);
        console.log('📡 [SERVICE] Tipo da resposta:', typeof response);
        console.log('📡 [SERVICE] Status na resposta:', response?.status);
      })
    );
  }

  // Polling individual por mensagem
  startPollingForMessage(messageId: string): Observable<NotificationStatus> {
    console.log('🚀 Iniciando polling para mensagem:', messageId);
    
    // Para polling anterior se existir
    this.stopPollingForMessage(messageId);

    return interval(environment.pollingInterval).pipe(
      switchMap(() => {
        console.log('🔄 Fazendo consulta de status para:', messageId);
        return this.getStatus(messageId);
      }),
      tap(status => {
        console.log('📊 Status recebido para', messageId, ':', status);
        console.log('📊 Tipo do status:', typeof status.status, 'Valor:', status.status);
      }),
      takeWhile(status => {
        // Continua polling enquanto estiver em qualquer status pendente
        const shouldContinue = status.status === 'NAO_ENCONTRADO' || status.status === 'RECEBIDO_PENDENTE';
        console.log('🔄 Deve continuar polling?', shouldContinue, 'Status atual:', status.status);
        console.log('🔄 Status é NAO_ENCONTRADO?', status.status === 'NAO_ENCONTRADO');
        console.log('🔄 Status é RECEBIDO_PENDENTE?', status.status === 'RECEBIDO_PENDENTE');
        console.log('🔄 Status atual (raw):', JSON.stringify(status.status));
        
        return shouldContinue; // Continua enquanto for verdadeiro
      }, true), // includeLastValue = true para emitir o último valor quando parar
      tap(status => {
        // Quando o polling parar, limpa a subscription
        const shouldContinue = status.status === 'NAO_ENCONTRADO' || status.status === 'RECEBIDO_PENDENTE';
        if (!shouldContinue) {
          console.log('✅ Parando polling para:', messageId, 'Status final:', status.status);
          this.stopPollingForMessage(messageId);
        }
      }),
      map(status => {
        console.log('📤 Emitindo status:', status);
        return status;
      })
    );
  }

  // Para polling específico
  stopPollingForMessage(messageId: string): void {
    const subscription = this.pollingSubscriptions.get(messageId);
    if (subscription) {
      subscription.unsubscribe();
      this.pollingSubscriptions.delete(messageId);
    }
  }

  // Registra subscription para controle
  registerPollingSubscription(messageId: string, subscription: Subscription): void {
    this.pollingSubscriptions.set(messageId, subscription);
  }

  // Para todos os pollings
  stopAllPolling(): void {
    this.pollingSubscriptions.forEach(sub => sub.unsubscribe());
    this.pollingSubscriptions.clear();
  }

  // Polling até completar (mantido para compatibilidade)
  pollUntilComplete(messageId: string): Observable<NotificationStatus> {
    return this.startPollingForMessage(messageId);
  }
}