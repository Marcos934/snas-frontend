/**
 * Configurações de ambiente para o Sistema de Notificações Assíncronas (SNAS)
 * 
 * Este arquivo centraliza todas as configurações específicas do ambiente,
 * facilitando a manutenção e permitindo diferentes configurações para dev/prod.
 */
export const environment = {
  /**
   * Indica se a aplicação está em modo de produção
   */
  production: false,

  /**
   * URL base da API do sistema de notificações
   * Baseado na documentação api-back.md - API roda na porta 3000
   */
  apiBaseUrl: 'http://localhost:3000',

  /**
   * Intervalo de polling para consulta de status das notificações (em milissegundos)
   * Configurado para 3 segundos conforme especificação
   */
  pollingInterval: 3000,

  /**
   * Configurações específicas da aplicação
   */
  app: {
    /**
     * Nome da aplicação para logs e identificação
     */
    name: 'SNAS Frontend',
    
    /**
     * Versão da aplicação
     */
    version: '1.0.0'
  }
};