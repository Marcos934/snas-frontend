import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';

import { NotificationFormComponent } from './notification-form.component';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/notification.model';
import { NotificationResponse, NotificationStatus, StatusType } from '../models/notification.interface';

/**
 * Testes abrangentes do NotificationFormComponent
 * 
 * Cobertura:
 * - Inicialização do componente
 * - Envio de notificações (sucesso e erro)
 * - Polling automático e manual
 * - Estados da UI (loading, empty state)
 * - Atualização de status das notificações
 * - Cleanup de subscriptions
 * - Métodos utilitários (getStatusClass, getStatusText)
 */

describe('NotificationFormComponent', () => {
  let component: NotificationFormComponent;
  let fixture: ComponentFixture<NotificationFormComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  // Mock de resposta da API
  const mockApiResponse: NotificationResponse = {
    success: true,
    message: 'Notificação enviada com sucesso',
    mensagemId: 'test-id-123'
  };

  beforeEach(async () => {
    // Criação de spies para os serviços
    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'sendNotification',
      'startPollingForMessage',
      'stopAllPolling',
      'registerPollingSubscription'
    ]);

    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [NotificationFormComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationFormComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com estado vazio', () => {
      expect(component.messageContent()).toBe('');
      expect(component.notifications()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('deve ter template renderizado corretamente', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      
      expect(compiled.querySelector('h1').textContent).toContain('Sistema de Notificações Assíncronas');
      expect(compiled.querySelector('textarea')).toBeTruthy();
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });
  });

  describe('Envio de Notificações', () => {
    beforeEach(() => {
      mockNotificationService.sendNotification.and.returnValue(of(mockApiResponse));
      mockNotificationService.startPollingForMessage.and.returnValue(of({
        mensagemId: 'test-id-123',
        status: 'PROCESSADO_SUCESSO' as StatusType,
        timestamp: new Date().toISOString(),
        message: 'Mensagem processada com sucesso'
      }));
    });

    it('deve enviar notificação com sucesso', (done) => {
      // Arrange
      component.messageContent.set('Mensagem de teste');
      
      // Act
      component.sendNotification();

      // Assert - Usar setTimeout para aguardar operações assíncronas
      setTimeout(() => {
        expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
          jasmine.any(Notification)
        );
        expect(component.notifications().length).toBe(1);
        expect(component.messageContent()).toBe(''); // Formulário limpo
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });

    it('não deve enviar notificação com conteúdo vazio', () => {
      // Arrange
      component.messageContent.set('   '); // Apenas espaços
      
      // Act
      component.sendNotification();

      // Assert
      expect(mockNotificationService.sendNotification).not.toHaveBeenCalled();
      expect(component.notifications().length).toBe(0);
    });

    it('deve tratar erro no envio de notificação', (done) => {
      // Arrange
      const errorResponse = new Error('Erro de rede');
      mockNotificationService.sendNotification.and.returnValue(throwError(() => errorResponse));
      component.messageContent.set('Mensagem de teste');
      
      // Spy no console.error
      spyOn(console, 'error');
      
      // Act
      component.sendNotification();

      // Assert - Usar setTimeout para aguardar operações assíncronas
      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith('❌ Erro ao enviar notificação:', errorResponse);
        expect(component.isLoading()).toBe(false);
        expect(component.notifications().length).toBe(0);
        done();
      }, 10);
    });

    it('deve iniciar polling após envio bem-sucedido', (done) => {
      // Arrange
      component.messageContent.set('Mensagem de teste');
      
      // Act
      component.sendNotification();

      // Assert - Usar setTimeout para aguardar operações assíncronas
      setTimeout(() => {
        expect(mockNotificationService.startPollingForMessage).toHaveBeenCalled();
        expect(mockNotificationService.registerPollingSubscription).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('Estados da UI', () => {
    it('deve mostrar estado de loading durante envio', () => {
      // Arrange
      component.messageContent.set('Teste');
      const subject = new Subject<NotificationResponse>();
      const pollingSubject = new Subject<NotificationStatus>();
      mockNotificationService.sendNotification.and.returnValue(subject.asObservable());
      mockNotificationService.startPollingForMessage.and.returnValue(pollingSubject.asObservable());
      
      // Act
      component.sendNotification();
      
      // Assert
      expect(component.isLoading()).toBe(true);
      
      // Cleanup
      subject.next(mockApiResponse);
      subject.complete();
      pollingSubject.complete();
    });

    it('deve desabilitar botão quando loading ou sem conteúdo', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      
      // Sem conteúdo
      expect(button.disabled).toBe(true);
      
      // Com conteúdo
      component.messageContent.set('Teste');
      fixture.detectChanges();
      expect(button.disabled).toBe(false);
      
      // Durante loading
      component.loading.set(true);
      fixture.detectChanges();
      expect(button.disabled).toBe(true);
    });

    it('deve mostrar empty state quando não há notificações', () => {
      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('Nenhuma notificação enviada ainda');
    });
  });

  describe('Polling de Status', () => {
    let pollingSubject: Subject<NotificationStatus>;

    beforeEach(() => {
      pollingSubject = new Subject<NotificationStatus>();
      mockNotificationService.startPollingForMessage.and.returnValue(pollingSubject.asObservable());
      mockNotificationService.sendNotification.and.returnValue(of(mockApiResponse));
    });

    it('deve atualizar status da notificação via polling', (done) => {
      // Arrange - Enviar notificação primeiro
      component.messageContent.set('Teste');
      component.sendNotification();

      setTimeout(() => {
        expect(component.notifications()[0].isPolling).toBe(true);

        // Act - Simular resposta do polling
        const statusUpdate: NotificationStatus = {
          mensagemId: 'test-id-123',
          status: 'PROCESSADO_SUCESSO' as StatusType,
          timestamp: new Date().toISOString(),
          message: 'Mensagem processada com sucesso'
        };

        pollingSubject.next(statusUpdate);

        setTimeout(() => {
          // Assert
          const notification = component.notifications()[0];
          expect(notification.notification.status).toBe('PROCESSADO_SUCESSO');
          expect(notification.isPolling).toBe(false); // Para quando status final
          done();
        }, 10);
      }, 10);
    });

    it('deve continuar polling para status não finais', (done) => {
      // Arrange
      component.messageContent.set('Teste');
      component.sendNotification();

      setTimeout(() => {
        // Act - Status ainda pendente
        const statusUpdate: NotificationStatus = {
          mensagemId: 'test-id-123',
          status: 'RECEBIDO_PENDENTE' as StatusType,
          timestamp: new Date().toISOString(),
          message: 'Mensagem ainda em processamento'
        };

        pollingSubject.next(statusUpdate);

        setTimeout(() => {
          // Assert
          const notification = component.notifications()[0];
          expect(notification.isPolling).toBe(true); // Continua polling
          done();
        }, 10);
      }, 10);
    });

    it('deve tratar erro no polling', (done) => {
      // Arrange
      component.messageContent.set('Teste');
      component.sendNotification();

      setTimeout(() => {
        // Act - Simular erro no polling
        pollingSubject.error(new Error('Erro de polling'));

        setTimeout(() => {
          // Assert
          const notification = component.notifications()[0];
          expect(notification.error).toBe('Erro ao verificar status.');
          expect(notification.isPolling).toBe(false);
          done();
        }, 10);
      }, 10);
    });
  });

  describe('Cleanup e Memory Leaks', () => {
    it('deve parar todos os pollings no ngOnDestroy', () => {
      // Act
      component.ngOnDestroy();

      // Assert
      expect(mockNotificationService.stopAllPolling).toHaveBeenCalled();
    });
  });

  describe('Métodos Utilitários', () => {
    it('deve retornar classe CSS correta para status', () => {
      expect(component.getStatusClass('PROCESSADO_SUCESSO')).toBe('PROCESSADO_SUCESSO');
      expect(component.getStatusClass('FALHA_PROCESSAMENTO')).toBe('FALHA_PROCESSAMENTO');
    });

    it('deve converter status técnico em texto amigável', () => {
      expect(component.getStatusText('NAO_ENCONTRADO')).toBe('Pendente');
      expect(component.getStatusText('RECEBIDO_PENDENTE')).toBe('202 Recebido/Pendente');
      expect(component.getStatusText('PROCESSADO_SUCESSO')).toBe('Sucesso');
      expect(component.getStatusText('FALHA_PROCESSAMENTO')).toBe('Falha');
      expect(component.getStatusText('ERRO_PROCESSAMENTO')).toBe('Erro');
      expect(component.getStatusText('STATUS_DESCONHECIDO')).toBe('STATUS_DESCONHECIDO');
    });
  });

  describe('Integração e Fluxo Completo', () => {
    it('deve executar fluxo completo: envio → polling → atualização final', (done) => {
      // Arrange
      const pollingSubject = new Subject<NotificationStatus>();
      mockNotificationService.sendNotification.and.returnValue(of(mockApiResponse));
      mockNotificationService.startPollingForMessage.and.returnValue(pollingSubject.asObservable());

      // Act 1: Enviar notificação
      component.messageContent.set('Teste de integração');
      component.sendNotification();

      setTimeout(() => {
        // Assert 1: Notificação adicionada e polling iniciado
        expect(component.notifications().length).toBe(1);
        expect(component.notifications()[0].isPolling).toBe(true);
        expect(component.messageContent()).toBe('');

        // Act 2: Simular atualizações de polling
        pollingSubject.next({
          mensagemId: 'test-id-123',
          status: 'RECEBIDO_PENDENTE' as StatusType,
          timestamp: new Date().toISOString(),
          message: 'Teste de integração em processamento'
        });

        setTimeout(() => {
          // Assert 2: Status atualizado, ainda em polling
          expect(component.notifications()[0].notification.status).toBe('RECEBIDO_PENDENTE');
          expect(component.notifications()[0].isPolling).toBe(true);

          // Act 3: Status final
          pollingSubject.next({
            mensagemId: 'test-id-123',
            status: 'PROCESSADO_SUCESSO' as StatusType,
            timestamp: new Date().toISOString(),
            message: 'Teste de integração processado com sucesso'
          });

          setTimeout(() => {
            // Assert 3: Polling parado, status final
            expect(component.notifications()[0].notification.status).toBe('PROCESSADO_SUCESSO');
            expect(component.notifications()[0].isPolling).toBe(false);
            expect(component.notifications()[0].error).toBeUndefined();
            done();
          }, 10);
        }, 10);
      }, 10);
    });
  });
});