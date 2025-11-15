# Dockerfile para o sistema de agendamento de barbearia

# Estágio 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Estágio 2: Produção
FROM node:18-alpine

WORKDIR /app

# Copiar node_modules do estágio de build
COPY --from=builder /app/node_modules ./node_modules

# Copiar código da aplicação
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/

# Criar diretório para uploads
RUN mkdir -p /app/uploads/agendamentos

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expor a porta (pode ser sobrescrita via variável de ambiente)
EXPOSE 3000

# Variáveis de ambiente padrão (podem ser sobrescritas)
ENV NODE_ENV=production
ENV PORT=3000
ENV API_HOST=localhost
ENV API_PORT=8080
ENV API_PROTOCOL=http
ENV STORAGE_TYPE=local
ENV STORAGE_PATH=./uploads/agendamentos
ENV SAVE_TO_SERVER=true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/config', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]

