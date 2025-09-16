import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models';

interface NotificationItem {
  notification: Notification;
  isPolling: boolean;
  error?: string;
}

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Sistema de Notificações Assíncronas</h1>
      
      <!-- Formulário -->
      <div class="form-section">
        <h2>Enviar Notificação</h2>
        <form (ngSubmit)="sendNotification()" #form="ngForm">
          <div class="form-group">
            <label for="message">Mensagem:</label>
            <textarea 
              id="message"
              [(ngModel)]="messageContent" 
              name="message"
              required
              placeholder="Digite sua mensagem aqui..."
              rows="3">
            </textarea>
          </div>
          <button 
            type="submit" 
            [disabled]="!messageContent.trim() || isLoading()"
            class="btn-primary">
            {{ isLoading() ? 'Enviando...' : 'Enviar Notificação' }}
          </button>
        </form>
      </div>

      <!-- Lista de Notificações -->
      <div class="notifications-section">
        <h2>Notificações ({{ notifications().length }})</h2>
        
        @if (notifications().length === 0) {
          <p class="empty-state">Nenhuma notificação enviada ainda.</p>
        }
        
        @for (item of notifications(); track item.notification.id) {
          <div class="notification-card" [class]="getStatusClass(item.notification.status)">
            <div class="notification-header">
              <span class="notification-id">{{ item.notification.id }}</span>
              <span class="notification-status">{{ getStatusText(item.notification.status) }}</span>
            </div>
            
            <div class="notification-content">
              {{ item.notification.content }}
            </div>
            
            <div class="notification-meta">
              <small>Criado: {{ item.notification.createdAt | date:'short' }}</small>
              @if (item.isPolling) {
                <small class="polling">🔄 Verificando...</small>
              }
              @if (item.error) {
                <small class="error">❌ {{ item.error }}</small>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }

    .form-section, .notifications-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #495057;
    }

    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      resize: vertical;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .notification-card {
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 10px;
      background: white;
    }

    .notification-card.PROCESSADO_SUCESSO {
      border-left: 4px solid #28a745;
    }

    .notification-card.FALHA_PROCESSAMENTO,
    .notification-card.ERRO_PROCESSAMENTO {
      border-left: 4px solid #dc3545;
    }

    .notification-card.NAO_ENCONTRADO {
      border-left: 4px solid #ffc107;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .notification-id {
      font-family: monospace;
      font-size: 12px;
      color: #6c757d;
    }

    .notification-status {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .notification-content {
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .notification-meta {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #6c757d;
    }

    .polling {
      color: #007bff !important;
    }

    .error {
      color: #dc3545 !important;
    }

    .empty-state {
      text-align: center;
      color: #6c757d;
      font-style: italic;
    }
  `]
})
export class NotificationFormComponent {
  messageContent = '';
  notifications = signal<NotificationItem[]>([]);
  isLoading = signal(false);

  constructor(private notificationService: NotificationService) {}

  sendNotification(): void {
    if (!this.messageContent.trim()) return;

    this.isLoading.set(true);
    const notification = new Notification(this.messageContent.trim());
    
    // Adiciona à lista
    const item: NotificationItem = {
      notification,
      isPolling: false
    };
    
    this.notifications.update(items => [item, ...items]);

    // Envia para API
    this.notificationService.sendNotification(notification).subscribe({
      next: (response) => {
        console.log('Notificação enviada:', response);
        this.startPolling(notification.id);
        this.messageContent = '';
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao enviar:', error);
        this.updateNotificationError(notification.id, 'Erro ao enviar notificação');
        this.isLoading.set(false);
      }
    });
  }

  private startPolling(messageId: string): void {
    this.updateNotificationPolling(messageId, true);
    
    this.notificationService.pollUntilComplete(messageId).subscribe({
      next: (status) => {
        this.updateNotificationStatus(messageId, status);
        
        // Para o polling se não estiver mais pendente
        if (status.status !== 'NAO_ENCONTRADO') {
          this.updateNotificationPolling(messageId, false);
        }
      },
      error: (error) => {
        console.error('Erro no polling:', error);
        this.updateNotificationError(messageId, 'Erro ao verificar status');
        this.updateNotificationPolling(messageId, false);
      }
    });
  }

  private updateNotificationStatus(messageId: string, status: any): void {
    this.notifications.update(items => 
      items.map(item => {
        if (item.notification.id === messageId) {
          item.notification.updateStatus(status);
          item.error = undefined;
        }
        return item;
      })
    );
  }

  private updateNotificationPolling(messageId: string, isPolling: boolean): void {
    this.notifications.update(items => 
      items.map(item => {
        if (item.notification.id === messageId) {
          item.isPolling = isPolling;
        }
        return item;
      })
    );
  }

  private updateNotificationError(messageId: string, error: string): void {
    this.notifications.update(items => 
      items.map(item => {
        if (item.notification.id === messageId) {
          item.error = error;
          item.isPolling = false;
        }
        return item;
      })
    );
  }

  getStatusClass(status: string): string {
    return status;
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'NAO_ENCONTRADO': 'Pendente',
      'PROCESSADO_SUCESSO': 'Sucesso',
      'FALHA_PROCESSAMENTO': 'Falha',
      'ERRO_PROCESSAMENTO': 'Erro'
    };
    return statusMap[status] || status;
  }
}