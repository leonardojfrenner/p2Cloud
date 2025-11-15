// Configuração da API
// Detecta automaticamente a URL base da API baseado no ambiente

(function() {
  // Função para obter a URL base da API
  function getApiBaseUrl() {
    // 1. Verificar se há uma configuração injetada pelo servidor (prioridade máxima)
    if (window.__API_CONFIG__ && window.__API_CONFIG__.BASE_URL) {
      return window.__API_CONFIG__.BASE_URL;
    }
    
    // 2. Verificar variável de ambiente do navegador (se disponível)
    if (window.ENV && window.ENV.API_BASE_URL) {
      return window.ENV.API_BASE_URL;
    }
    
    // 3. Detectar automaticamente baseado no hostname atual
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // Se estiver em produção (não localhost), usar o mesmo host
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Em produção, assumir que a API está no mesmo domínio
      // Opção 1: Mesmo domínio, porta 8080
      // Opção 2: Mesmo domínio, subdomínio api
      // Opção 3: Mesmo domínio, path /api (se estiver no mesmo servidor)
      
      // Por padrão, usar o mesmo protocolo e hostname, porta 8080
      // Isso pode ser sobrescrito pela configuração do servidor
      return `${protocol}//${hostname}:8080/api`;
    }
    
    // 4. Fallback para desenvolvimento local
    return 'http://localhost:8080/api';
  }
  
  // Configurar a URL base
  window.API_CONFIG = {
    BASE_URL: getApiBaseUrl()
  };
  
  // Log para debug (apenas em desenvolvimento)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 API Config:', window.API_CONFIG);
  }
})();
