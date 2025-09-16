// Interfaces para o sistema de notificações baseadas na API

export interface NotificationRequest {
  mensagemId: string;
  conteudoMensagem: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  mensagemId: string;
}

export interface NotificationStatus {
  mensagemId: string;
  status: StatusType;
  timestamp?: string;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export type StatusType = 
  | 'NAO_ENCONTRADO'
  | 'PROCESSADO_SUCESSO' 
  | 'FALHA_PROCESSAMENTO'
  | 'ERRO_PROCESSAMENTO';