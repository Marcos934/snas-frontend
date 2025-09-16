import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, map } from 'rxjs';
import { environment } from '../../environments/environments';
import { 
  NotificationRequest, 
  NotificationResponse, 
  NotificationStatus,
  Notification 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = environment.apiBaseUrl;

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

  // Polling até completar
  pollUntilComplete(messageId: string): Observable<NotificationStatus> {
    return interval(environment.pollingInterval).pipe(
      switchMap(() => this.getStatus(messageId)),
      takeWhile(status => status.status === 'NAO_ENCONTRADO', true),
      map(status => status)
    );
  }
}