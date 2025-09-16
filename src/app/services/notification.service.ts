import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { switchMap, takeWhile, tap, finalize } from 'rxjs/operators';
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
    return this.http.get<NotificationStatus>(
      `${this.apiUrl}/api/notificar/status/${messageId}`
    );
  }

  // Polling individual por mensagem
  startPollingForMessage(messageId: string): Observable<NotificationStatus> {
    // Para polling anterior se existir
    this.stopPollingForMessage(messageId);

    return interval(environment.pollingInterval).pipe(
      switchMap(() => this.getStatus(messageId)),
      takeWhile(status => {
        // Continua polling enquanto estiver em qualquer status pendente
        const shouldContinue = status.status === 'NAO_ENCONTRADO' || status.status === 'RECEBIDO_PENDENTE';
        return shouldContinue; // Continua enquanto for verdadeiro
      }, true), // includeLastValue = true para emitir o último valor quando parar
      finalize(() => {
        this.stopPollingForMessage(messageId);
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