import { Notification } from './notification.model';
import { NotificationStatus, StatusType } from './notification.interface';

describe('Notification Model', () => {
  let notification: Notification;

  beforeEach(() => {
    notification = new Notification('Mensagem de teste');
  });

  describe('Construtor', () => {
    it('deve criar uma notificação com content obrigatório', () => {
      expect(notification.content).toBe('Mensagem de teste');
      expect(notification.id).toBeDefined();
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.status).toBe('RECEBIDO_PENDENTE');
      expect(notification.lastUpdated).toBeInstanceOf(Date);
    });

    it('deve aceitar id personalizado no construtor', () => {
      const customNotification = new Notification('Teste', 'custom-id');
      expect(customNotification.id).toBe('custom-id');
      expect(customNotification.content).toBe('Teste');
    });

    it('deve gerar id único quando não fornecido', () => {
      const notification1 = new Notification('Teste 1');
      const notification2 = new Notification('Teste 2');
      expect(notification1.id).not.toBe(notification2.id);
    });
  });

  describe('toApiRequest', () => {
    it('deve retornar objeto com estrutura correta para API', () => {
      const apiRequest = notification.toApiRequest();
      
      expect(apiRequest).toEqual({
        mensagemId: notification.id,
        conteudoMensagem: 'Mensagem de teste'
      });
    });

    it('deve manter dados consistentes após mudança de status', () => {
      const statusUpdate: NotificationStatus = {
        mensagemId: notification.id,
        status: 'PROCESSADO_SUCESSO'
      };
      
      const updatedNotification = notification.updateStatus(statusUpdate);
      const apiRequest = updatedNotification.toApiRequest();
      
      expect(apiRequest.mensagemId).toBe(notification.id);
      expect(apiRequest.conteudoMensagem).toBe('Mensagem de teste');
    });
  });

  describe('updateStatus', () => {
    it('deve retornar nova instância com status atualizado', (done) => {
      const statusUpdate: NotificationStatus = {
        mensagemId: notification.id,
        status: 'PROCESSADO_SUCESSO'
      };
      
      // Aguarda um pouco para garantir diferença no timestamp
      setTimeout(() => {
        const updatedNotification = notification.updateStatus(statusUpdate);
        
        expect(updatedNotification).not.toBe(notification); // Nova instância
        expect(updatedNotification.status).toBe('PROCESSADO_SUCESSO');
        expect(updatedNotification.lastUpdated.getTime()).toBeGreaterThan(notification.lastUpdated.getTime());
        done();
      }, 10);
    });

    it('deve aceitar diferentes status válidos', () => {
      const statusProcessado: NotificationStatus = {
        mensagemId: notification.id,
        status: 'PROCESSADO_SUCESSO'
      };
      
      const statusFalha: NotificationStatus = {
        mensagemId: notification.id,
        status: 'FALHA_PROCESSAMENTO'
      };

      const notification1 = notification.updateStatus(statusProcessado);
      expect(notification1.status).toBe('PROCESSADO_SUCESSO');

      const notification2 = notification1.updateStatus(statusFalha);
      expect(notification2.status).toBe('FALHA_PROCESSAMENTO');
    });

    it('deve manter createdAt e outros dados inalterados', () => {
      const statusUpdate: NotificationStatus = {
        mensagemId: notification.id,
        status: 'PROCESSADO_SUCESSO'
      };
      
      const updatedNotification = notification.updateStatus(statusUpdate);
      
      expect(updatedNotification.id).toBe(notification.id);
      expect(updatedNotification.content).toBe(notification.content);
      expect(updatedNotification.createdAt).toBe(notification.createdAt);
    });

    it('deve retornar a mesma instância se status não mudou', () => {
      const statusUpdate: NotificationStatus = {
        mensagemId: notification.id,
        status: 'RECEBIDO_PENDENTE' // Mesmo status atual
      };
      
      const result = notification.updateStatus(statusUpdate);
      
      expect(result).toBe(notification); // Mesma instância
    });
  });

  describe('Métodos de verificação de status', () => {
    it('deve verificar se está processada com sucesso', () => {
      expect(notification.isProcessed()).toBeFalse();
      
      const statusUpdate: NotificationStatus = {
        mensagemId: notification.id,
        status: 'PROCESSADO_SUCESSO'
      };
      
      const updatedNotification = notification.updateStatus(statusUpdate);
      expect(updatedNotification.isProcessed()).toBeTrue();
    });

    it('deve verificar se houve erro', () => {
      expect(notification.hasError()).toBeFalse();
      
      const statusFalha: NotificationStatus = {
        mensagemId: notification.id,
        status: 'FALHA_PROCESSAMENTO'
      };
      
      const notificationComFalha = notification.updateStatus(statusFalha);
      expect(notificationComFalha.hasError()).toBeTrue();
      
      const statusErro: NotificationStatus = {
        mensagemId: notification.id,
        status: 'ERRO_PROCESSAMENTO'
      };
      
      const notificationComErro = notification.updateStatus(statusErro);
      expect(notificationComErro.hasError()).toBeTrue();
    });

    it('deve verificar se está pendente', () => {
      expect(notification.isPending()).toBeTrue();
      
      const statusUpdate: NotificationStatus = {
        mensagemId: notification.id,
        status: 'PROCESSADO_SUCESSO'
      };
      
      const updatedNotification = notification.updateStatus(statusUpdate);
      expect(updatedNotification.isPending()).toBeFalse();
    });
  });

  describe('Validações de integridade', () => {
    it('deve manter integridade dos dados após múltiplas operações', (done) => {
      const originalId = notification.id;
      const originalContent = notification.content;
      const originalCreatedAt = notification.createdAt;

      // Aguarda um pouco para garantir diferença no timestamp
      setTimeout(() => {
        // Múltiplas atualizações de status
        const status1: NotificationStatus = {
          mensagemId: notification.id,
          status: 'PROCESSADO_SUCESSO'
        };
        
        const status2: NotificationStatus = {
          mensagemId: notification.id,
          status: 'FALHA_PROCESSAMENTO'
        };
        
        const notification1 = notification.updateStatus(status1);
        const notification2 = notification1.updateStatus(status2);
        
        // Verificar que dados essenciais não mudaram
        expect(notification2.id).toBe(originalId);
        expect(notification2.content).toBe(originalContent);
        expect(notification2.createdAt).toBe(originalCreatedAt);
        
        // Verificar que status foi atualizado
        expect(notification2.status).toBe('FALHA_PROCESSAMENTO');
        expect(notification2.lastUpdated.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
        done();
      }, 10);
    });

    it('deve gerar toApiRequest consistente', () => {
      const request1 = notification.toApiRequest();
      const request2 = notification.toApiRequest();
      
      expect(request1).toEqual(request2);
    });
  });
});