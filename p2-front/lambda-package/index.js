// Função Lambda para recuperação de dados do S3 (versão CommonJS)
// Compatível com AWS Lambda e API Gateway

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

// Configurações do S3 (variáveis de ambiente)
const AWS_ACCESS_KEY_ID = process.env.ACESS_KEY_S3;
const AWS_SECRET_ACCESS_KEY = process.env.ACESS_SECRET_KEY;
// Priorizar S3_REGION explicitamente
const AWS_REGION = process.env.S3_REGION;
const AWS_S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_ENDPOINT = process.env.S3_BUCKET_ENDPOINT;

// Log para debug - verificar qual região está sendo usada
console.log('🔧 Configuração S3:', {
  'S3_REGION (env)': process.env.S3_REGION,
  'AWS_REGION (env)': process.env.AWS_REGION,
  'Região usada': AWS_REGION,
  'Bucket': AWS_S3_BUCKET,
  'Endpoint': S3_ENDPOINT || 'padrão'
});

// Configurar cliente S3
const s3Config = {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
};

// Lightsail Object Storage pode precisar de endpoint específico
// Mas precisamos usar forcePathStyle para evitar duplicação do bucket no hostname
if (S3_ENDPOINT) {
  // Extrair apenas o domínio base do endpoint (sem o bucket)
  // Exemplo: barbearia-fatec.s3.us-east-1.amazonaws.com -> s3.us-east-1.amazonaws.com
  const endpoint = S3_ENDPOINT.replace(/^https?:\/\//, '');
  // Se o endpoint contém o nome do bucket, remover
  const baseEndpoint = endpoint.replace(new RegExp(`^${AWS_S3_BUCKET}\\.`), '');
  s3Config.endpoint = `https://${baseEndpoint}`;
  s3Config.forcePathStyle = true; // Usar path-style para evitar problemas com certificado
} else {
  // Para S3 padrão, usar endpoint baseado na região
  s3Config.endpoint = `https://s3.${AWS_REGION}.amazonaws.com`;
  s3Config.forcePathStyle = true;
}

const s3Client = new S3Client(s3Config);

/**
 * Handler principal da função Lambda
 * @param {Object} event - Evento do API Gateway
 * @param {Object} context - Contexto da Lambda
 * @returns {Object} Resposta formatada para API Gateway
 */
exports.handler = async (event) => {
  console.log('📥 Evento recebido:', JSON.stringify(event, null, 2));
  
  try {
    // Extrair parâmetros da query string ou path
    const queryParams = event.queryStringParameters || {};
    const pathParams = event.pathParameters || {};
    const httpMethod = event.httpMethod || 'GET';
    
    // Determinar ação baseado nos parâmetros
    const action = queryParams.action || pathParams.action || 'list';
    const protocolo = queryParams.protocolo || pathParams.protocolo;
    const key = queryParams.key || pathParams.key;
    
    let result;
    
    switch (action) {
      case 'get':
      case 'download':
        // Buscar arquivo específico
        if (key) {
          result = await buscarArquivo(key);
        } else if (protocolo) {
          // Buscar por protocolo
          result = await buscarPorProtocolo(protocolo);
        } else {
          throw new Error('Parâmetro "key" ou "protocolo" é obrigatório para buscar arquivo');
        }
        break;
        
      case 'list':
      default:
        // Listar arquivos
        const prefix = queryParams.prefix || 'agendamentos/';
        const maxKeys = parseInt(queryParams.maxKeys || '100', 10);
        result = await listarArquivos(prefix, maxKeys);
        break;
    }
    
    // Retornar resposta formatada para API Gateway
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Erro na função Lambda:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Lista arquivos do S3
 * @param {string} prefix - Prefixo para filtrar (ex: 'agendamentos/')
 * @param {number} maxKeys - Número máximo de objetos a retornar
 * @returns {Promise<Object>} Lista de arquivos
 */
async function listarArquivos(prefix = 'agendamentos/', maxKeys = 100) {
  console.log(`📋 Listando arquivos do S3 com prefixo: ${prefix}`);
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: AWS_S3_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys
    });
    
    const response = await s3Client.send(command);
    
    const arquivos = (response.Contents || []).map(obj => ({
      key: obj.Key,
      tamanho: obj.Size,
      dataModificacao: obj.LastModified?.toISOString(),
      url: S3_ENDPOINT 
        ? `https://${S3_ENDPOINT.replace(/^https?:\/\//, '')}/${obj.Key}`
        : `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${obj.Key}`,
      protocolo: extrairProtocolo(obj.Key)
    }));
    
    return {
      bucket: AWS_S3_BUCKET,
      prefix: prefix,
      total: arquivos.length,
      arquivos: arquivos,
      isTruncated: response.IsTruncated || false
    };
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
    throw new Error(`Erro ao listar arquivos do S3: ${error.message}`);
  }
}

/**
 * Busca um arquivo específico do S3
 * @param {string} key - Chave do arquivo no S3
 * @returns {Promise<Object>} Conteúdo do arquivo
 */
async function buscarArquivo(key) {
  console.log(`🔍 Buscando arquivo: ${key}`);
  
  try {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    // Ler o conteúdo do arquivo
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const conteudo = buffer.toString('utf-8');
    
    return {
      key: key,
      tamanho: response.ContentLength,
      tipo: response.ContentType,
      dataModificacao: response.LastModified?.toISOString(),
      conteudo: conteudo,
      url: S3_ENDPOINT 
        ? `https://${S3_ENDPOINT.replace(/^https?:\/\//, '')}/${key}`
        : `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
    };
  } catch (error) {
    console.error('❌ Erro ao buscar arquivo:', error);
    if (error.name === 'NoSuchKey') {
      throw {
        statusCode: 404,
        message: `Arquivo não encontrado: ${key}`
      };
    }
    throw new Error(`Erro ao buscar arquivo do S3: ${error.message}`);
  }
}

/**
 * Busca arquivos por protocolo
 * @param {string} protocolo - Protocolo do agendamento (ex: 'AGD-1234567890-1')
 * @returns {Promise<Object>} Arquivos encontrados
 */
async function buscarPorProtocolo(protocolo) {
  console.log(`🔍 Buscando arquivos por protocolo: ${protocolo}`);
  
  try {
    // Buscar na pasta do protocolo
    const prefix = `agendamentos/${protocolo}/`;
    const command = new ListObjectsV2Command({
      Bucket: AWS_S3_BUCKET,
      Prefix: prefix
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return {
        protocolo: protocolo,
        encontrado: false,
        mensagem: 'Nenhum arquivo encontrado para este protocolo'
      };
    }
    
    // Buscar conteúdo de cada arquivo
    const arquivos = await Promise.all(
      response.Contents.map(async (obj) => {
        const arquivo = await buscarArquivo(obj.Key);
        return {
          ...arquivo,
          protocolo: protocolo
        };
      })
    );
    
    return {
      protocolo: protocolo,
      encontrado: true,
      total: arquivos.length,
      arquivos: arquivos
    };
  } catch (error) {
    console.error('❌ Erro ao buscar por protocolo:', error);
    throw new Error(`Erro ao buscar arquivos por protocolo: ${error.message}`);
  }
}

/**
 * Extrai o protocolo do caminho do arquivo
 * @param {string} key - Chave do arquivo
 * @returns {string|null} Protocolo extraído
 */
function extrairProtocolo(key) {
  const match = key.match(/agendamentos\/(AGD-[^\/]+)/);
  return match ? match[1] : null;
}

