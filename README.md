# Documentação do Sistema SNAS (Sistema de Notificação Assíncrona)

Este documento fornece uma visão geral de como o sistema funciona e como executá-lo localmente.

## Arquitetura

O sistema é composto por duas partes principais:

1.  **Frontend:** Uma aplicação Angular (`snas-frontend`) responsável pela interface do usuário, permitindo o envio de notificações e a visualização de seu status em tempo real.
2.  **Backend:** Uma API em NestJS (`snas-backend` - presente neste repositório [https://github.com/Marcos934/snas-backend]) que recebe as notificações, as processa de forma assíncrona e fornece endpoints para consulta de status.

## Fluxo de Funcionamento

1.  O usuário preenche o formulário no frontend e envia uma notificação.
2.  O frontend envia uma requisição `POST` para a API backend.
3.  A API backend recebe a requisição, a coloca em uma fila de processamento e retorna imediatamente um ID de mensagem com o status `RECEBIDO_PENDENTE`.
4.  O frontend, ao receber o ID, inicia um processo de *polling*, consultando o endpoint de status da API a cada 3 segundos.
5.  O backend processa a mensagem em background. Quando o processamento termina, o status da mensagem é atualizado para `PROCESSADO_SUCESSO` ou `FALHA_PROCESSAMENTO`.
6.  Na próxima vez que o frontend consultar o status, ele receberá o status final e atualizará a interface do usuário, encerrando o polling para aquela mensagem.

## Como Executar o Frontend

Para executar a aplicação frontend localmente, siga os passos abaixo.

### Pré-requisitos

*   Node.js e npm instalados.
*   Angular CLI instalado (`npm install -g @angular/cli`).
*   O **servidor backend** deve estar em execução.

### Passos

1.  **Instalar as dependências:**
    Navegue até a pasta raiz do projeto `snas-frontend` e execute o comando:
    ```bash
    npm install
    ```

2.  **Executar a aplicação:**
    Após a instalação das dependências, execute o seguinte comando para iniciar o servidor de desenvolvimento do Angular:
    ```bash
    npm start
    ```
    ou
    ```bash
    ng serve
    ```

3.  **Acessar a aplicação:**
    Abra seu navegador e acesse `http://localhost:4200/`. A aplicação estará disponível.
