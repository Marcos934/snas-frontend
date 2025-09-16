import { Component, signal, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { Notification, NotificationStatus } from '../models';

/**
 * Interface para controle de estado das notificações na UI
 */
interface NotificationItem {
  notification: Notification;
  isPolling: boolean;
  error?: string;
}

/**
 * Componente principal do Sistema de Notificações Assíncronas (SNAS)
 * 
 * Funcionalidades implementadas:
 * - Envio de notificações via formulário
 * - Polling automático individual por mensagem
 * - Interceptor HTTP transparente para captura de endpoints
 * - Atualização em tempo real da UI com Angular Signals
 * - Controle de subscriptions para evitar memory leaks
 */

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
            [disabled]="!messageContent().trim() || isLoading()"
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
        
        @for (item of notifications().slice().reverse(); track item.notification.id) {
          <div class="notification-card" [class]="getStatusClass(item.notification.status)">
            <div class="notification-header">
              <span class="notification-id">{{ item.notification.id }}</span>
              <span class="notification-status" [class]="item.notification.status">{{ getStatusText(item.notification.status) }}</span>
            </div>
            
            <div class="notification-content">
              {{ item.notification.content }}
            </div>
            
            <div class="notification-meta">
              <small>Criado: {{ item.notification.createdAt }}</small>
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

    .notification-card.NAO_ENCONTRADO,
    .notification-card.RECEBIDO_PENDENTE {
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

    .notification-status.PROCESSADO_SUCESSO {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .notification-status.FALHA_PROCESSAMENTO,
    .notification-status.ERRO_PROCESSAMENTO {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .notification-status.NAO_ENCONTRADO,
    .notification-status.RECEBIDO_PENDENTE {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
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
})export class NotificationFormComponent implements OnDestroy {
  // Estado reativo da aplicação usando Angular Signals
  messageContent = signal('');
  notifications = signal<NotificationItem[]>([]);
  loading = signal(false);

  constructor(private notificationService: NotificationService, private cdr: ChangeDetectorRef) {}

  /**
   * Lifecycle hook - limpa todas as subscriptions ao destruir o componente
   * Previne memory leaks parando todos os pollings ativos
   */
  ngOnDestroy(): void {
    this.notificationService.stopAllPolling();
  }

  /**
   * Verifica se há alguma operação em andamento
   */
  isLoading(): boolean {
    return this.loading();
  }

  /**
   * Envia uma nova notificação
   * 
   * Fluxo:
   * 1. Cria objeto Notification com conteúdo do formulário
   * 2. Envia via NotificationService
   * 3. Adiciona à lista local para exibição imediata
   * 4. Inicia polling automático (via interceptor HTTP)
   * 5. Limpa formulário
   */
  sendNotification(): void {
    const content = this.messageContent().trim();
    if (!content) return;

    this.loading.set(true);
    const notification = new Notification(content);

    this.notificationService.sendNotification(notification).subscribe({
      next: (response) => {
        console.log('✅ Notificação enviada:', response);
        
        // Adiciona à lista local para exibição imediata
        this.notifications.update(items => [...items, {
          notification,
          isPolling: true, // Será controlado pelo interceptor
          error: undefined
        }]);

        // Limpa o formulário
        this.messageContent.set('');
        this.loading.set(false);

        // Inicia polling manual (backup caso interceptor falhe)
        this.startPolling(notification.id);
      },
      error: (error) => {
        console.error('❌ Erro ao enviar notificação:', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Inicia polling individual para uma mensagem específica
   * 
   * Características:
   * - Controle independente por mensagem
   * - Para automaticamente quando status != 'NAO_ENCONTRADO'
   * - Registra subscription para controle de memory leak
   * - Atualiza UI em tempo real
   */

  private startPolling(messageId: string): void {
    console.log('🚀 [COMPONENT] Iniciando polling para:', messageId);
    this.updateNotificationState(messageId, { isPolling: true }); // Atualização unificada

    const subscription = this.notificationService.startPollingForMessage(messageId).subscribe({
      next: (status) => {
        console.log('📨 [COMPONENT] Status recebido do serviço:', messageId, status);
        const isFinalStatus = status.status !== 'NAO_ENCONTRADO' && status.status !== 'RECEBIDO_PENDENTE';

        if (isFinalStatus) {
          console.log('🛑 [COMPONENT] Parando polling - status final:', status.status);
        }

        // Atualização de estado atômica
        this.updateNotificationState(messageId, { status, isPolling: !isFinalStatus });
      },
      error: (error) => {
        console.error('❌ [COMPONENT] Erro no polling:', error);
        this.updateNotificationState(messageId, { error: 'Erro ao verificar status.', isPolling: false });
      },
      complete: () => {
        console.log('✅ [COMPONENT] Polling completado para:', messageId);
        this.updateNotificationState(messageId, { isPolling: false });
      }
    });

    this.notificationService.registerPollingSubscription(messageId, subscription);
  }

  /**
   * Atualiza o estado de uma notificação de forma atômica e imutável.
   * Centraliza todas as atualizações (status, polling, erro) para evitar race conditions.
   */
  private updateNotificationState(messageId: string, updates: { status?: NotificationStatus; isPolling?: boolean; error?: string }): void {
    this.notifications.update(items =>
      items.map(item => {
        if (item.notification.id === messageId) {
          // Aplica a atualização de status de forma imutável, se fornecida
          const newNotification = updates.status && item.notification.status !== updates.status.status
            ? item.notification.updateStatus(updates.status)
            : item.notification;

          // Retorna um NOVO objeto item com todos os estados atualizados
          return {
            notification: newNotification,
            isPolling: updates.isPolling !== undefined ? updates.isPolling : item.isPolling,
            error: updates.error // Substitui ou limpa o erro
          };
        }
        return item;
      })
    );

    // Força a detecção de mudanças como último recurso.
    this.cdr.detectChanges();
  }

  /**
   * Retorna classe CSS baseada no status da notificação
   * Usado para colorir bordas dos cards de notificação
   */
  getStatusClass(status: string): string {
    return status;
  }

  /**
   * Converte status técnico em texto amigável para o usuário
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'NAO_ENCONTRADO': 'Pendente',
      'RECEBIDO_PENDENTE': '202 Recebido/Pendente',  // Novo status inicial
      'PROCESSADO_SUCESSO': 'Sucesso', 
      'FALHA_PROCESSAMENTO': 'Falha',
      'ERRO_PROCESSAMENTO': 'Erro'
    };
    return statusMap[status] || status;
  }
}