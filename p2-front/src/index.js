// Carregar variáveis de ambiente do arquivo .env (apenas em desenvolvimento)
// Em produção, as variáveis são injetadas automaticamente pelo servidor
import 'dotenv/config';

import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import Barbearia from './models/barbearia.js';
import Cliente from './models/cliente.js';
import Agenda from './models/agenda.js';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração da API Spring Boot via variáveis de ambiente
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '8080';
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const API_BASE_URL = process.env.API_BASE_URL || `${API_PROTOCOL}://${API_HOST}:${API_PORT}/api`;
// API Gateway (opcional)
const API_GATEWAY = process.env.API_GATEWAY;

// Configuração de storage para arquivos exportados
let STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local' ou 's3'
const STORAGE_PATH = process.env.STORAGE_PATH || './uploads/agendamentos'; // Caminho local ou bucket name
const SAVE_TO_SERVER = process.env.SAVE_TO_SERVER !== 'false'; // Por padrão, salva no servidor

// Configurações AWS S3 (suporta múltiplas nomenclaturas de variáveis)
// Suporta: AWS_ACCESS_KEY_ID ou ACESS_KEY_S3
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.ACESS_KEY_S3;
// Suporta: AWS_SECRET_ACCESS_KEY ou ACESS_SECRET_KEY
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.ACESS_SECRET_KEY;
// Suporta: AWS_REGION ou S3_REGION
const AWS_REGION = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
// Suporta: AWS_S3_BUCKET ou S3_BUCKET_NAME
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME || STORAGE_PATH;
// Suporta endpoint customizado (útil para Lightsail Object Storage)
const S3_ENDPOINT = process.env.S3_BUCKET_ENDPOINT || process.env.AWS_S3_ENDPOINT;

// Se as credenciais S3 estiverem definidas, usar S3 automaticamente
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && !process.env.STORAGE_TYPE) {
  STORAGE_TYPE = 's3';
}

console.log('🔧 API Config:', {
  API_HOST,
  API_PORT,
  API_PROTOCOL,
  API_BASE_URL,
  API_GATEWAY: API_GATEWAY || 'não configurado'
});

console.log('📦 Storage Config:', {
  STORAGE_TYPE,
  STORAGE_PATH,
  SAVE_TO_SERVER,
  ...(STORAGE_TYPE === 's3' ? {
    AWS_REGION,
    AWS_S3_BUCKET,
    S3_ENDPOINT: S3_ENDPOINT || 'padrão',
    HAS_CREDENTIALS: !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY)
  } : {})
});

// Endpoint para retornar a configuração da API (para o frontend)
app.get('/api/config', (req, res) => {
  res.json({
    BASE_URL: API_BASE_URL,
    API_GATEWAY: API_GATEWAY || null
  });
});

// Endpoint para servir o config.js dinamicamente
app.get('/static/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
// Configuração da API injetada pelo servidor
window.__API_CONFIG__ = {
  BASE_URL: '${API_BASE_URL}',
  API_GATEWAY: ${API_GATEWAY ? `'${API_GATEWAY}'` : 'null'}
};

// Resto do código de detecção automática
(function() {
  function getApiBaseUrl() {
    if (window.__API_CONFIG__ && window.__API_CONFIG__.BASE_URL) {
      return window.__API_CONFIG__.BASE_URL;
    }
    
    if (window.ENV && window.ENV.API_BASE_URL) {
      return window.ENV.API_BASE_URL;
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return \`\${protocol}//\${hostname}:8080/api\`;
    }
    
    return 'http://localhost:8080/api';
  }
  
  window.API_CONFIG = {
    BASE_URL: getApiBaseUrl(),
    SAVE_TO_SERVER: ${SAVE_TO_SERVER},
    API_GATEWAY: window.__API_CONFIG__?.API_GATEWAY || null
  };
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 API Config:', window.API_CONFIG);
  }
})();
  `);
});

// servir assets estáticos em /static
// Nota: O endpoint /static/config.js acima tem prioridade sobre o arquivo estático
// Adicionar headers de no-cache para arquivos JavaScript para evitar cache do navegador
app.use('/static', (req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
}, express.static(join(__dirname, '..', 'public')));

// servir a pasta 'public' como /app (index.html será servido automaticamente)
app.use('/app', express.static(join(__dirname, '..', 'public')));

// rota de API simples — retorna um exemplo de Barbearia
app.get('/api/barbearia/sample', (req, res) => {
  const cliente = new Cliente({ nome: 'Ana Silva', cpf: '123.456.789-00', telefone: '11999990000', email: 'ana@example.com' });
  const agenda = new Agenda({ data: new Date(), descricao: 'Corte de cabelo' });
  const barbearia = new Barbearia({ nome: 'Barbearia Central', cnpj: '00.000.000/0001-00', telefone: '11988881111', email: 'contato@barbearia.com', endereco: 'Rua Exemplo, 123', cliente, agenda });
  res.json(barbearia.toJSON());
});

// Endpoint proxy para API Gateway (evita problemas de CORS)
app.get('/api/gateway/test', async (req, res) => {
  try {
    if (!API_GATEWAY) {
      return res.status(500).json({ 
        error: 'API_GATEWAY não configurada',
        message: 'Configure a variável de ambiente API_GATEWAY' 
      });
    }

    console.log('🔗 Fazendo proxy para API Gateway:', API_GATEWAY);
    
    const response = await fetch(API_GATEWAY, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Retornar resposta com headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Se a resposta da API Gateway já tem estrutura {success, data}, extrair apenas o data interno
    // Caso contrário, retornar como está
    let responseData = data;
    if (data && typeof data === 'object' && data.data && data.success !== undefined) {
      // A API Gateway retornou {success: true, data: {...}}
      // Retornar apenas o data interno para o frontend
      responseData = data.data;
    }
    
    res.status(response.status).json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Erro no proxy da API Gateway:', error);
    res.status(500).json({ 
      error: 'Erro ao acessar API Gateway',
      message: error.message 
    });
  }
});

// Endpoint para salvar arquivo de agendamento exportado
app.post('/api/agendamentos/exportar', async (req, res) => {
  try {
    let { protocolo, nomeArquivo, conteudo, agendamento } = req.body;

    if (!protocolo || !nomeArquivo || !conteudo) {
      return res.status(400).json({ 
        error: 'Dados incompletos: protocolo, nomeArquivo e conteudo são obrigatórios' 
      });
    }

    // Corrigir nome do arquivo se vier como .txt (forçar HTML)
    if (nomeArquivo.endsWith('.txt')) {
      console.log('⚠️ Arquivo recebido como .txt, convertendo para .html');
      nomeArquivo = nomeArquivo.replace(/\.txt$/, '.html');
    }
    
    console.log('📥 Recebendo arquivo para salvar:', nomeArquivo);

    let caminhoArquivo;
    let urlArquivo;
    let storageTypeUsed = STORAGE_TYPE;
    let erroS3 = null;

    // Tentar salvar no S3 primeiro (se configurado)
    if (STORAGE_TYPE === 's3' && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
      console.log('📤 Tentando salvar no S3...');
      console.log('🔑 Configuração S3:', {
        bucket: AWS_S3_BUCKET,
        region: AWS_REGION,
        endpoint: S3_ENDPOINT || 'padrão',
        key: `agendamentos/${protocolo}/${nomeArquivo}`
      });
      
      try {
        // Importar AWS SDK dinamicamente
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        
        // Configurar cliente S3
        // Lightsail Object Storage é compatível com S3 padrão, então não precisa de endpoint customizado
        // O SDK já sabe como se conectar usando apenas a região
        const s3Config = {
          region: AWS_REGION,
          credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY
          }
        };
        
        // Só usar endpoint customizado se for realmente um servidor S3 customizado (não Lightsail)
        // Para Lightsail Object Storage, deixar o SDK usar o endpoint padrão do S3
        // O endpoint fornecido (bucket.s3.region.amazonaws.com) é apenas para referência de URL, não para conexão
        
        const s3Client = new S3Client(s3Config);

        const key = `agendamentos/${protocolo}/${nomeArquivo}`;
        
        // Determinar ContentType baseado na extensão do arquivo
        let contentType = 'text/plain';
        if (nomeArquivo.endsWith('.html')) {
          contentType = 'text/html';
        } else if (nomeArquivo.endsWith('.csv')) {
          contentType = 'text/csv';
        }
        
        const command = new PutObjectCommand({
          Bucket: AWS_S3_BUCKET,
          Key: key,
          Body: conteudo,
          ContentType: contentType,
          ContentEncoding: 'utf-8'
        });

        await s3Client.send(command);
        
        // Construir URL do arquivo
        // Usar o endpoint fornecido se disponível, senão construir a URL padrão do S3
        if (S3_ENDPOINT) {
          // O endpoint fornecido já está no formato correto (bucket.s3.region.amazonaws.com)
          const endpoint = S3_ENDPOINT.replace(/^https?:\/\//, '');
          urlArquivo = `https://${endpoint}/${key}`;
        } else {
          // URL padrão do S3
          urlArquivo = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
        }
        caminhoArquivo = `s3://${AWS_S3_BUCKET}/${key}`;
        
        console.log(`✅ Arquivo salvo no S3: ${caminhoArquivo}`);
        console.log(`🔗 URL do arquivo: ${urlArquivo}`);
      } catch (s3Error) {
        console.error('Erro ao salvar no S3:', s3Error);
        erroS3 = s3Error.message;
        // Continuar para fallback local
        storageTypeUsed = 'local';
      }
    }
    
    // Salvar localmente (se não for S3 ou se S3 falhou)
    if (storageTypeUsed === 'local') {
      // Salvar localmente
      const storageDir = join(__dirname, '..', STORAGE_PATH);
      
      // Criar diretório se não existir
      if (!existsSync(storageDir)) {
        await mkdir(storageDir, { recursive: true });
      }

      // Criar subpasta com protocolo para organização
      const protocoloDir = join(storageDir, protocolo);
      if (!existsSync(protocoloDir)) {
        await mkdir(protocoloDir, { recursive: true });
      }

      const caminhoCompleto = join(protocoloDir, nomeArquivo);
      await writeFile(caminhoCompleto, conteudo, 'utf-8');
      
      caminhoArquivo = caminhoCompleto;
      urlArquivo = `/uploads/agendamentos/${protocolo}/${nomeArquivo}`;
      
      console.log(`✅ Arquivo salvo localmente: ${caminhoArquivo}`);
    }

    res.json({
      sucesso: true,
      protocolo,
      nomeArquivo,
      caminho: caminhoArquivo,
      url: urlArquivo,
      storageType: storageTypeUsed,
      s3Error: erroS3 || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar arquivo',
      message: error.message 
    });
  }
});

// Servir arquivos de agendamentos salvos localmente (se não estiver usando S3)
if (STORAGE_TYPE === 'local') {
  const storageDir = join(__dirname, '..', STORAGE_PATH);
  app.use('/uploads/agendamentos', express.static(storageDir));
}

// redirecionar raiz para a interface em /app
app.get('/', (req, res) => {
  res.redirect('/app');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
})
export default app;
