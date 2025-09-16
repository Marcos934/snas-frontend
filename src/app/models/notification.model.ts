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
    this.status = 'NAO_ENCONTRADO';
    this.lastUpdated = new Date();
  }

  // Converte para formato da API
  toApiRequest(): NotificationRequest {
    return {
      mensagemId: this.id,
      conteudoMensagem: this.content
    };
  }

  // Atualiza status da notificação
  updateStatus(status: NotificationStatus): void {
    this.status = status.status;
    this.lastUpdated = new Date();
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
    return this.status === 'NAO_ENCONTRADO';
  }
}