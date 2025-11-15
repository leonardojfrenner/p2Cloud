# Sistema de Agendamento de Barbearia

Sistema frontend para agendamento de serviços em barbearias, integrado com API Spring Boot.

## Estrutura do Projeto

- `public/` - Arquivos estáticos do frontend (HTML, CSS, JS)
- `src/` - Código do servidor Express (servidor de desenvolvimento)
- `public/api.js` - Serviços de comunicação com a API Spring Boot
- `public/config.js` - Configuração da URL da API (detecção automática)
- `public/app.js` - Lógica principal da página de agendamento
- `public/cadastro.html` - Página de cadastro de barbearia
- `public/index.html` - Página principal de agendamento

## Configuração

### 1. Variáveis de Ambiente

O sistema suporta variáveis de ambiente para configuração da API. Crie um arquivo `.env` na raiz do projeto:

```bash
# Configuração da API Spring Boot
API_HOST=localhost          # Host da API (padrão: localhost)
API_PORT=8080              # Porta da API (padrão: 8080)
API_PROTOCOL=http          # Protocolo (http ou https)
API_BASE_URL=http://localhost:8080/api  # URL completa (opcional, sobrescreve as acima)

# Porta do servidor frontend
PORT=3000                  # Porta do servidor (padrão: 3000)

# Configuração de Storage para arquivos exportados
STORAGE_TYPE=local         # Tipo: 'local' ou 's3' (padrão: local)
STORAGE_PATH=./uploads/agendamentos  # Caminho local ou nome do bucket
SAVE_TO_SERVER=true        # Salvar arquivos no servidor/bucket (padrão: true)

# Configurações AWS S3 (apenas se STORAGE_TYPE=s3)
# AWS_ACCESS_KEY_ID=sua-access-key
# AWS_SECRET_ACCESS_KEY=sua-secret-key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=nome-do-bucket
```

**Para produção na nuvem**, configure as variáveis de ambiente no seu provedor:

- **Heroku**: `heroku config:set API_BASE_URL=https://sua-api.herokuapp.com/api`
- **Vercel**: Configure no painel de variáveis de ambiente
- **Railway**: Configure no painel de variáveis
- **Render**: Configure no painel de Environment Variables

### 2. Detecção Automática

O sistema detecta automaticamente a URL da API baseado no ambiente:

1. **Configuração do servidor** (prioridade máxima): O servidor Express injeta a configuração via `window.__API_CONFIG__`
2. **Variáveis de ambiente do navegador**: Se disponível via `window.ENV`
3. **Detecção automática**: Em produção, usa o mesmo hostname na porta 8080
4. **Fallback**: Em desenvolvimento local, usa `http://localhost:8080/api`

### 3. Iniciar o Servidor Frontend

```bash
# Instalar dependências
npm install

# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

O servidor Express estará rodando na porta configurada (padrão: 3000)

### 4. Iniciar a API Spring Boot

Certifique-se de que a API Spring Boot está rodando e acessível na URL configurada.

## Funcionalidades

### Cadastro de Barbearia (`/cadastro.html`)

- Cadastro de barbearia com nome, CNPJ, telefone, email e endereço
- Criação automática de serviços associados à barbearia
- Integração com endpoint: `POST /api/barbearias`

### Agendamento (`/index.html`)

- Seleção de barbearia (carrega dinamicamente do banco)
- Cadastro de cliente (nome, CPF, telefone, email, endereço)
- Seleção de serviço (carrega serviços da barbearia selecionada)
- Agendamento de data/hora
- Criação automática de cliente e agenda via API
- Integração com endpoints:
  - `GET /api/barbearias` - Listar barbearias
  - `GET /api/servicos/barbearia/{id}` - Listar serviços da barbearia
  - `POST /api/clientes/barbearia/{id}` - Criar cliente associado à barbearia
  - `POST /api/agendas/barbearia/{id}/cliente/{clienteId}` - Criar agenda

## Endpoints da API Utilizados

### Barbearias
- `GET /api/barbearias` - Listar todas
- `POST /api/barbearias` - Criar nova

### Clientes
- `POST /api/clientes/barbearia/{barbeariaId}` - Criar cliente associado à barbearia

### Serviços
- `GET /api/servicos/barbearia/{barbeariaId}` - Listar serviços da barbearia
- `POST /api/servicos/barbearia/{barbeariaId}` - Criar serviço associado à barbearia

### Agendas
- `POST /api/agendas/barbearia/{barbeariaId}/cliente/{clienteId}` - Criar agenda associada

## Deploy em Produção

### Heroku

1. Crie um arquivo `Procfile`:
```
web: node src/index.js
```

2. Configure as variáveis de ambiente:
```bash
heroku config:set API_BASE_URL=https://sua-api.herokuapp.com/api
heroku config:set PORT=3000
```

### Vercel / Netlify

1. Configure as variáveis de ambiente no painel
2. O sistema detectará automaticamente o ambiente de produção

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Configure as variáveis de ambiente no `docker-compose.yml` ou via `-e` no docker run.

## Validações

- CPF: Formato XXX.XXX.XXX-XX (máscara automática)
- CNPJ: Formato XX.XXX.XXX/XXXX-XX (máscara automática)
- Email: Validação de formato
- Campos obrigatórios: Nome do cliente, barbearia, serviço e data/hora

## Notas

- O frontend remove automaticamente a formatação de CPF e CNPJ antes de enviar para a API
- A data é enviada no formato `yyyy-MM-ddTHH:mm:ss` para compatibilidade com LocalDateTime do Spring Boot
- Todos os endpoints têm tratamento de erro com mensagens amigáveis
- A configuração da API é injetada automaticamente pelo servidor Express baseado nas variáveis de ambiente
