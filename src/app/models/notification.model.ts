import { v4 as uuidv4 } from 'uuid';
import { NotificationRequest, NotificationStatus, StatusType } from './notification.interface';

export class Notification {
  public readonly id: string;
  public readonly content: string;
  public readonly createdAt: Date;
  public status: StatusType;
  public lastUpdated: Date;

  constructor(content: string, id?: string) {
    this.id = id || uuidv4();
    this.content = content;
    this.createdAt = new Date();
    this.status = 'RECEBIDO_PENDENTE'; // Status inicial: 202 Recebido/Pendente
    this.lastUpdated = new Date();
  }

  // Converte para formato da API
  toApiRequest(): NotificationRequest {
    return {
      mensagemId: this.id,
      conteudoMensagem: this.content
    };
  }

  // Atualiza status da notificação de forma imutável
  updateStatus(status: NotificationStatus): Notification {
    if (this.status === status.status) {
        return this;
    }

    // Clona a instância atual para manter a imutabilidade
    const newNotification = Object.assign(new Notification(this.content, this.id), this);

    // Define o novo status e atualiza o timestamp
    newNotification.status = status.status;
    newNotification.lastUpdated = new Date();

    return newNotification;
  }

  // Verifica se está processada com sucesso
  isProcessed(): boolean {
    return this.status === 'PROCESSADO_SUCESSO';
  }

  // Verifica se houve erro
  hasError(): boolean {
    return this.status === 'FALHA_PROCESSAMENTO' || 
           this.status === 'ERRO_PROCESSAMENTO';
  }

  // Verifica se ainda está pendente
  isPending(): boolean {
    return this.status === 'NAO_ENCONTRADO' || this.status === 'RECEBIDO_PENDENTE';
  }
}