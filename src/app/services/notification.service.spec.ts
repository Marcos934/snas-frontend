import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotificationService } from './notification.service';
import { Notification, NotificationResponse, NotificationStatus } from '../models';
import { environment } from '../../environments/environments';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let mockNotification: Notification;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationService,
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Mock de notificação para testes
    mockNotification = new Notification('Test message');
  });

  afterEach(() => {
    // Para todos os pollings ativos se o service existir
    if (service && service.stopAllPolling) {
      service.stopAllPolling();
    }
    // Verifica se não há requisições HTTP pendentes
    if (httpMock && httpMock.verify) {
      httpMock.verify();
    }
  });

  describe('sendNotification', () => {
    it('deve enviar notificação e retornar resposta da API', () => {
      const mockResponse: NotificationResponse = {
        success: true,
        message: 'Notificação enviada com sucesso',
        mensagemId: 'test-id-123'
      };

      service.sendNotification(mockNotification).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.mensagemId).toBe('test-id-123');
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/notificar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockNotification.toApiRequest());
      req.flush(mockResponse);
    });

    it('deve tratar erro na requisição', () => {
      const errorMessage = 'Erro interno do servidor';

      service.sendNotification(mockNotification).subscribe({
        next: () => fail('Deveria ter falhado'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/notificar`);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getStatus', () => {
    it('deve consultar status da mensagem', () => {
      const messageId = 'test-id-123';
      const mockStatus: NotificationStatus = {
        mensagemId: messageId,
        status: 'PROCESSADO_SUCESSO',
        timestamp: new Date().toISOString(),
        message: 'Mensagem enviada com sucesso'
      };

      service.getStatus(messageId).subscribe(status => {
        expect(status).toEqual(mockStatus);
        expect(status.status).toBe('PROCESSADO_SUCESSO');
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/notificar/status/${messageId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });

    it('deve tratar status não encontrado', () => {
      const messageId = 'invalid-id';

      service.getStatus(messageId).subscribe({
        next: () => fail('Deveria ter falhado'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/notificar/status/${messageId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('stopPollingForMessage', () => {
    it('deve parar polling específico', () => {
      const messageId = 'test-id-123';
      
      // Testa se o método existe e não gera erro
      expect(() => service.stopPollingForMessage(messageId)).not.toThrow();
    });

    it('deve ignorar se não houver polling ativo', () => {
      expect(() => service.stopPollingForMessage('inexistente')).not.toThrow();
    });
  });

  describe('stopAllPolling', () => {
    it('deve parar todos os pollings ativos', () => {
      // Testa se o método existe e não gera erro
      expect(() => service.stopAllPolling()).not.toThrow();
    });
  });

  describe('registerPollingSubscription', () => {
    it('deve registrar subscription para controle', () => {
      const messageId = 'test-id-123';
      const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);

      // Testa se o método existe e não gera erro
      expect(() => service.registerPollingSubscription(messageId, mockSubscription)).not.toThrow();
    });
  });

  describe('service initialization', () => {
    it('deve criar o serviço', () => {
      expect(service).toBeTruthy();
    });

    it('deve ter todos os métodos necessários', () => {
      expect(service.sendNotification).toBeDefined();
      expect(service.getStatus).toBeDefined();
      expect(service.startPollingForMessage).toBeDefined();
      expect(service.stopPollingForMessage).toBeDefined();
      expect(service.stopAllPolling).toBeDefined();
      expect(service.registerPollingSubscription).toBeDefined();
    });
  });
});