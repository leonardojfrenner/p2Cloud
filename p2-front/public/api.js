// Serviço de API para comunicação com backend Spring Boot
// Configuração da URL base da API
// A URL pode ser configurada em config.js ou usar o padrão
const API_BASE_URL = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'http://localhost:8080/api';

/**
 * Classe para comunicação com a API de Barbearias
 */
class BarbeariaAPI {
  static async listar() {
    const url = `${API_BASE_URL}/barbearias`;
    console.log('Fazendo requisição para:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Status da resposta:', response.status, response.statusText);
      
      // Ler o texto da resposta primeiro para poder verificar erros
      const text = await response.text();
      
      if (!response.ok) {
        console.error('Erro na resposta:', response.status, text);
        throw new Error(`Erro ao listar barbearias: ${response.status} - ${text}`);
      }
      
      // Se a resposta estiver vazia, retorna array vazio
      if (!text || text.trim() === '') {
        console.warn('Resposta vazia da API');
        return [];
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Erro ao parsear JSON:', text);
        throw new Error('Resposta da API não é um JSON válido: ' + text.substring(0, 100));
      }
      
      // Log para debug
      console.log('Resposta da API /barbearias (raw):', text);
      console.log('Resposta da API /barbearias (parsed):', data);
      console.log('Tipo da resposta:', typeof data, Array.isArray(data));
      
      // Se a resposta for um array, retorna diretamente
      if (Array.isArray(data)) {
        console.log('Retornando array com', data.length, 'barbearias');
        if (data.length > 0) {
          console.log('Primeira barbearia (exemplo):', data[0]);
          console.log('Campos da primeira barbearia:', Object.keys(data[0]));
        }
        return data;
      }
      
      // Se for um objeto com uma propriedade, tenta extrair
      if (data && Array.isArray(data.content)) {
        // Caso a API retorne paginação
        console.log('Resposta com paginação, retornando content');
        return data.content;
      }
      
      if (data && Array.isArray(data.data)) {
        console.log('Resposta com propriedade data, retornando data');
        return data.data;
      }
      
      // Se for um objeto único, retorna em array
      if (data && typeof data === 'object' && data !== null) {
        console.warn('API retornou objeto único, convertendo para array:', data);
        return [data];
      }
      
      // Se não for nenhum dos casos acima, retorna array vazio
      console.warn('Formato de resposta não reconhecido:', data);
      return [];
    } catch (error) {
      console.error('Erro na requisição de listar barbearias:', error);
      // Se for erro de rede/CORS, mostra mensagem mais clara
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Erro de conexão. Verifique se a API Spring Boot está rodando em http://localhost:8080');
      }
      throw error;
    }
  }

  static async buscarPorId(id) {
    const response = await fetch(`${API_BASE_URL}/barbearias/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar barbearia');
    return await response.json();
  }

  static async criar(barbearia) {
    const response = await fetch(`${API_BASE_URL}/barbearias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(barbearia)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar barbearia' }));
      throw new Error(error.message || 'Erro ao criar barbearia');
    }
    return await response.json();
  }

  static async atualizar(id, barbearia) {
    const response = await fetch(`${API_BASE_URL}/barbearias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(barbearia)
    });
    if (!response.ok) throw new Error('Erro ao atualizar barbearia');
    return await response.json();
  }

  static async deletar(id) {
    const response = await fetch(`${API_BASE_URL}/barbearias/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao deletar barbearia');
    return true;
  }
}

/**
 * Classe para comunicação com a API de Clientes
 */
class ClienteAPI {
  static async listar() {
    const response = await fetch(`${API_BASE_URL}/clientes`);
    if (!response.ok) throw new Error('Erro ao listar clientes');
    return await response.json();
  }

  static async buscarPorId(id) {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar cliente');
    return await response.json();
  }

  static async criar(cliente) {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar cliente' }));
      throw new Error(error.message || 'Erro ao criar cliente');
    }
    return await response.json();
  }

  static async criarAssociadoBarbearia(barbeariaId, cliente) {
    const url = `${API_BASE_URL}/clientes/barbearia/${barbeariaId}`;
    console.log('🔵 Criando cliente associado à barbearia:', {
      url,
      barbeariaId,
      cliente
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });

    console.log('🔵 Resposta do servidor:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        console.error('❌ Erro na resposta (texto):', text);
        try {
          errorData = JSON.parse(text);
          console.error('❌ Erro na resposta (JSON):', errorData);
        } catch (e) {
          errorData = { message: text || 'Erro ao criar cliente' };
        }
      } catch (e) {
        errorData = { message: `Erro ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.message || errorData.error || `Erro ao criar cliente: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  static async buscarPorBarbearia(barbeariaId) {
    const response = await fetch(`${API_BASE_URL}/clientes/barbearia/${barbeariaId}`);
    if (!response.ok) throw new Error('Erro ao buscar clientes da barbearia');
    return await response.json();
  }

  static async atualizar(id, cliente) {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });
    if (!response.ok) throw new Error('Erro ao atualizar cliente');
    return await response.json();
  }

  static async deletar(id) {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao deletar cliente');
    return true;
  }
}

/**
 * Classe para comunicação com a API de Serviços
 */
class ServicoAPI {
  static async listar() {
    const response = await fetch(`${API_BASE_URL}/servicos`);
    if (!response.ok) throw new Error('Erro ao listar serviços');
    return await response.json();
  }

  static async buscarPorId(id) {
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar serviço');
    return await response.json();
  }

  static async criar(servico) {
    const response = await fetch(`${API_BASE_URL}/servicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servico)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar serviço' }));
      throw new Error(error.message || 'Erro ao criar serviço');
    }
    return await response.json();
  }

  static async criarAssociadoBarbearia(barbeariaId, servico) {
    const response = await fetch(`${API_BASE_URL}/servicos/barbearia/${barbeariaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servico)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar serviço' }));
      throw new Error(error.message || 'Erro ao criar serviço');
    }
    return await response.json();
  }

  static async buscarPorBarbearia(barbeariaId) {
    const response = await fetch(`${API_BASE_URL}/servicos/barbearia/${barbeariaId}`);
    if (!response.ok) throw new Error('Erro ao buscar serviços da barbearia');
    return await response.json();
  }

  static async atualizar(id, servico) {
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servico)
    });
    if (!response.ok) throw new Error('Erro ao atualizar serviço');
    return await response.json();
  }

  static async deletar(id) {
    const response = await fetch(`${API_BASE_URL}/servicos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao deletar serviço');
    return true;
  }
}

/**
 * Classe para comunicação com a API de Agendas
 */
class AgendaAPI {
  static async listar() {
    const response = await fetch(`${API_BASE_URL}/agendas`);
    if (!response.ok) throw new Error('Erro ao listar agendas');
    return await response.json();
  }

  static async buscarPorId(id) {
    const response = await fetch(`${API_BASE_URL}/agendas/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar agenda');
    return await response.json();
  }

  static async criar(agenda) {
    const response = await fetch(`${API_BASE_URL}/agendas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agenda)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar agenda' }));
      throw new Error(error.message || 'Erro ao criar agenda');
    }
    return await response.json();
  }

  static async criarAssociadoBarbearia(barbeariaId, agenda) {
    const response = await fetch(`${API_BASE_URL}/agendas/barbearia/${barbeariaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agenda)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar agenda' }));
      throw new Error(error.message || 'Erro ao criar agenda');
    }
    return await response.json();
  }

  static async criarAssociadoBarbeariaECliente(barbeariaId, clienteId, agenda) {
    const response = await fetch(`${API_BASE_URL}/agendas/barbearia/${barbeariaId}/cliente/${clienteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agenda)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar agenda' }));
      throw new Error(error.message || 'Erro ao criar agenda');
    }
    return await response.json();
  }

  static async buscarPorBarbearia(barbeariaId) {
    const response = await fetch(`${API_BASE_URL}/agendas/barbearia/${barbeariaId}`);
    if (!response.ok) throw new Error('Erro ao buscar agendas da barbearia');
    return await response.json();
  }

  static async buscarPorCliente(clienteId) {
    const response = await fetch(`${API_BASE_URL}/agendas/cliente/${clienteId}`);
    if (!response.ok) throw new Error('Erro ao buscar agendas do cliente');
    return await response.json();
  }

  static async buscarPorPeriodo(dataInicio, dataFim) {
    const params = new URLSearchParams({
      dataInicio: dataInicio,
      dataFim: dataFim
    });
    const response = await fetch(`${API_BASE_URL}/agendas/periodo?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar agendas por período');
    return await response.json();
  }

  static async atualizar(id, agenda) {
    const response = await fetch(`${API_BASE_URL}/agendas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agenda)
    });
    if (!response.ok) throw new Error('Erro ao atualizar agenda');
    return await response.json();
  }

  static async deletar(id) {
    const response = await fetch(`${API_BASE_URL}/agendas/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao deletar agenda');
    return true;
  }
}

// Exportar as classes para uso global
window.BarbeariaAPI = BarbeariaAPI;
window.ClienteAPI = ClienteAPI;
window.ServicoAPI = ServicoAPI;
window.AgendaAPI = AgendaAPI;
window.API_BASE_URL = API_BASE_URL;

