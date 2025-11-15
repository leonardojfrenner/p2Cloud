// Funções auxiliares
function isValidEmail(email) {
  if (!email) return true; // aceitar vazio opcionalmente
  return /\S+@\S+\.\S+/.test(email);
}

function formatCPF(value) {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');
  
  // Aplica a máscara XXX.XXX.XXX-XX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  } else if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  }
}

function isValidCPF(cpf) {
  if (!cpf) return true;
  const digits = cpf.replace(/\D/g, '');
  return digits.length === 11;
}

// Remove formatação do CPF (apenas números)
function limparCPF(cpf) {
  return cpf.replace(/\D/g, '');
}

// Carregar barbearias no select
async function carregarBarbearias() {
  const select = document.getElementById('barbearia-select');
  if (!select) return;

  try {
    select.innerHTML = '<option value="">Carregando barbearias...</option>';
    const barbearias = await BarbeariaAPI.listar();
    
    // Verificar se barbearias é um array válido
    if (!Array.isArray(barbearias)) {
      console.error('Resposta da API não é um array:', barbearias);
      select.innerHTML = '<option value="">Erro: formato de resposta inválido</option>';
      return;
    }
    
    select.innerHTML = '<option value="">Selecione uma barbearia...</option>';
    
    if (barbearias.length === 0) {
      select.innerHTML = '<option value="">Nenhuma barbearia cadastrada</option>';
      return;
    }

    console.log('Processando', barbearias.length, 'barbearias');
    
    barbearias.forEach((barbearia, index) => {
      console.log(`Barbearia ${index + 1}:`, barbearia);
      
      const option = document.createElement('option');
      
      // Verificar diferentes formatos de ID (pode ser id, Id, ou outro)
      const id = barbearia.id || barbearia.Id || barbearia.ID;
      const nome = barbearia.nome || barbearia.Nome || barbearia.name || barbearia.Name;
      
      if (id && nome) {
        option.value = id.toString(); // Garantir que é string
        option.textContent = nome;
        select.appendChild(option);
        console.log(`Adicionada barbearia: ${nome} (ID: ${id})`);
      } else {
        console.warn('Barbearia sem id ou nome válidos:', {
          id: id,
          nome: nome,
          objetoCompleto: barbearia
        });
      }
    });
    
    console.log('Total de opções adicionadas:', select.options.length - 1); // -1 porque tem a opção padrão
  } catch (error) {
    console.error('Erro ao carregar barbearias:', error);
    const errorMessage = error.message || 'Erro desconhecido';
    select.innerHTML = `<option value="">Erro: ${errorMessage}</option>`;
    // Mostrar alerta para ajudar no debug
    console.error('Detalhes do erro:', {
      message: error.message,
      stack: error.stack
    });
    
    // Tentar fazer uma requisição de teste para verificar a conexão
    console.log('Testando conexão com a API...');
    fetch(`${window.API_CONFIG?.BASE_URL || 'http://localhost:8080/api'}/barbearias`)
      .then(res => {
        console.log('Status da resposta:', res.status);
        console.log('Headers:', [...res.headers.entries()]);
        return res.text();
      })
      .then(text => {
        console.log('Resposta da API:', text);
        try {
          const json = JSON.parse(text);
          console.log('JSON parseado:', json);
        } catch (e) {
          console.log('Não é JSON válido');
        }
      })
      .catch(err => {
        console.error('Erro no teste de conexão:', err);
      });
  }
}

// Carregar serviços da barbearia selecionada
async function carregarServicos(barbeariaId) {
  const select = document.getElementById('servico-select');
  if (!select || !barbeariaId) {
    if (select) {
      select.innerHTML = '<option value="">Selecione primeiro uma barbearia...</option>';
    }
    return;
  }

  try {
    const servicos = await ServicoAPI.buscarPorBarbearia(barbeariaId);
    select.innerHTML = '<option value="">Selecione um serviço...</option>';
    
    if (servicos.length === 0) {
      select.innerHTML = '<option value="">Nenhum serviço disponível</option>';
      return;
    }

    servicos.forEach(servico => {
      const option = document.createElement('option');
      option.value = servico.id;
      option.textContent = `${servico.nome} - R$ ${servico.valor.toFixed(2)}`;
      option.dataset.servico = JSON.stringify(servico);
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
    select.innerHTML = '<option value="">Erro ao carregar serviços</option>';
  }
}

// Atualizar informações do serviço selecionado
function updateServiceInfo(servicoId) {
  const infoSection = document.querySelector('.service-info');
  const durationEl = document.getElementById('service-duration');
  const staffEl = document.getElementById('service-staff');
  const valueEl = document.getElementById('service-value');

  if (!servicoId) {
    infoSection.hidden = true;
    return;
  }

  const select = document.getElementById('servico-select');
  const option = select.querySelector(`option[value="${servicoId}"]`);
  
  if (option && option.dataset.servico) {
    try {
      const servico = JSON.parse(option.dataset.servico);
      durationEl.textContent = servico.duracao ? `${servico.duracao} min` : '--';
      staffEl.textContent = servico.funcionarios && servico.funcionarios.length > 0 
        ? servico.funcionarios.join(', ') 
        : '--';
      valueEl.textContent = servico.valor ? `R$ ${servico.valor.toFixed(2).replace('.', ',')}` : '--';
      infoSection.hidden = false;
    } catch (e) {
      console.error('Erro ao parsear dados do serviço:', e);
      infoSection.hidden = true;
    }
  } else {
    infoSection.hidden = true;
  }
}

function showResult(message, obj = null) {
  document.getElementById('result-text').textContent = message;
  // JSON removido - não exibir mais na tela
  document.getElementById('result').hidden = false;
  const gridSection = document.querySelector('.grid');
  if (gridSection) {
    gridSection.hidden = true;
  }
}

function resetFormUI() {
  document.getElementById('booking-form').reset();
  document.getElementById('result').hidden = true;
  document.querySelector('.grid').hidden = false;
  
  // Limpar informações do serviço
  const infoSection = document.querySelector('.service-info');
  if (infoSection) {
    infoSection.hidden = true;
  }
  
  // Resetar os valores dos campos de serviço
  const durationEl = document.getElementById('service-duration');
  const staffEl = document.getElementById('service-staff');
  const valueEl = document.getElementById('service-value');
  
  if (durationEl) durationEl.textContent = '--';
  if (staffEl) staffEl.textContent = '--';
  if (valueEl) valueEl.textContent = '--';
  
  // Resetar o select de serviços
  const servicoSelect = document.getElementById('servico-select');
  if (servicoSelect) {
    servicoSelect.innerHTML = '<option value="">Selecione primeiro uma barbearia...</option>';
  }
  
  // Recarregar barbearias
  carregarBarbearias();
}

// Inicialização quando a página carregar
window.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('booking-form');
  if (!form) {
    console.error('Formulário booking-form não encontrado');
    return;
  }
  
  // Verificar se o botão existe no formulário ao carregar
  const testButton = form.querySelector('button[type="submit"]');
  console.log('Botão encontrado ao carregar:', testButton);
  if (testButton) {
    console.log('Botão encontrado - tipo:', testButton.type, 'texto:', testButton.textContent);
  } else {
    console.warn('AVISO: Botão não encontrado ao carregar a página!');
    console.log('Todos os botões na página:', document.querySelectorAll('button'));
  }

  const resetBtn = document.getElementById('reset-btn');
  const newBookBtn = document.getElementById('new-book');
  const barbeariaSelect = document.getElementById('barbearia-select');
  const servicoSelect = document.getElementById('servico-select');
  const cpfInput = document.querySelector('input[data-mask="cpf"]');
  
  // Máscara de CPF
  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
      e.target.value = formatCPF(valor);
    });
  }

  // Carregar barbearias ao iniciar (fazer isso primeiro, antes de configurar o submit)
  console.log('=== Iniciando carregamento de barbearias ===');
  await carregarBarbearias();
  console.log('=== Carregamento de barbearias concluído ===');

  // Listener para mudança de barbearia
  if (barbeariaSelect) {
    barbeariaSelect.addEventListener('change', async (e) => {
      const barbeariaId = e.target.value;
      await carregarServicos(barbeariaId);
      updateServiceInfo(''); // Limpar informações do serviço
    });
  }

  // Listener para mudança de serviço
  if (servicoSelect) {
    servicoSelect.addEventListener('change', (e) => {
      updateServiceInfo(e.target.value);
    });
  }

  // Botão reset
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      
      // Limpar informações do serviço
      const infoSection = document.querySelector('.service-info');
      if (infoSection) {
        infoSection.hidden = true;
      }
      
      const durationEl = document.getElementById('service-duration');
      const staffEl = document.getElementById('service-staff');
      const valueEl = document.getElementById('service-value');
      
      if (durationEl) durationEl.textContent = '--';
      if (staffEl) staffEl.textContent = '--';
      if (valueEl) valueEl.textContent = '--';
      
      // Resetar o select de serviços
      const servicoSelect = document.getElementById('servico-select');
      if (servicoSelect) {
        servicoSelect.innerHTML = '<option value="">Selecione primeiro uma barbearia...</option>';
      }
      
      updateServiceInfo('');
    });
  }

  // Botão novo agendamento
  if (newBookBtn) {
    newBookBtn.addEventListener('click', () => {
      resetFormUI();
    });
  }

  // Função para processar o submit
  async function processarSubmit(ev) {
    if (ev) {
      ev.preventDefault();
    }
    
    // Buscar o botão usando múltiplas estratégias
    let submitButton = form.querySelector('button[type="submit"]');
    
    // Se não encontrou, tentar buscar por classe ou texto
    if (!submitButton) {
      submitButton = form.querySelector('.btn.primary');
    }
    
    // Se ainda não encontrou, buscar por ID ou texto
    if (!submitButton) {
      const allButtons = form.querySelectorAll('button');
      console.log('Todos os botões encontrados:', allButtons);
      submitButton = Array.from(allButtons).find(btn => {
        const isSubmit = btn.type === 'submit';
        const hasAgendar = btn.textContent && btn.textContent.includes('Agendar');
        const hasPrimary = btn.classList.contains('primary');
        console.log('Verificando botão:', {
          elemento: btn,
          type: btn.type,
          textContent: btn.textContent,
          classes: btn.className,
          isSubmit,
          hasAgendar,
          hasPrimary
        });
        return isSubmit || hasAgendar || hasPrimary;
      });
    }
    
    // Se ainda não encontrou, tentar buscar em todo o documento
    if (!submitButton) {
      submitButton = document.querySelector('button[type="submit"]');
    }
    
    // Log para debug
    console.log('=== DEBUG SUBMIT ===');
    console.log('Form encontrado:', form);
    console.log('Form ID:', form.id);
    console.log('Todos os botões no form:', Array.from(form.querySelectorAll('button')).map(b => ({
      type: b.type,
      text: b.textContent,
      classes: b.className
    })));
    console.log('Botão de submit encontrado:', submitButton);
    
    if (!submitButton) {
      console.error('Botão de submit não encontrado no formulário');
      console.error('Tentando buscar em todo o documento...');
      const allPageButtons = document.querySelectorAll('button');
      console.error('Todos os botões na página:', Array.from(allPageButtons).map(b => ({
        type: b.type,
        text: b.textContent,
        classes: b.className,
        parent: b.parentElement?.tagName
      })));
      alert('Erro: botão de submit não encontrado. Verifique o console para mais detalhes.');
      return;
    }
    
    const originalText = submitButton.textContent || 'Agendar';
    submitButton.disabled = true;
    submitButton.textContent = 'Agendando...';

    try {
      const fd = new FormData(form);
      const barbeariaId = fd.get('barbearia');
      const servicoId = fd.get('servico');
      const datetime = fd.get('datetime');
      const observacoes = fd.get('observacoes') || '';

      // Validações
      if (!barbeariaId) {
        alert('Selecione uma barbearia');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
      }

      if (!servicoId) {
        alert('Selecione um serviço');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
      }

      if (!datetime) {
        alert('Escolha data e hora do agendamento');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
      }

      const email = fd.get('email');
      if (email && !isValidEmail(email)) {
        alert('E-mail inválido');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
      }

      const cpf = fd.get('cpf');
      if (cpf && !isValidCPF(cpf)) {
        alert('CPF inválido. Use o formato 000.000.000-00');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
      }

      // Preparar dados do cliente
      const nomeCliente = fd.get('nome');
      const telefoneCliente = fd.get('telefone');
      const enderecoCliente = fd.get('endereco');
      
      const clienteData = {
        nome: nomeCliente ? nomeCliente.trim() : null,
        cpf: cpf ? limparCPF(cpf) : null,
        telefone: telefoneCliente ? telefoneCliente.trim() : null,
        email: email ? email.trim() : null,
        endereco: enderecoCliente ? enderecoCliente.trim() : null
      };

      // Remover campos vazios (null ou string vazia)
      Object.keys(clienteData).forEach(key => {
        if (clienteData[key] === null || clienteData[key] === '') {
          delete clienteData[key];
        }
      });

      console.log('📝 Dados do cliente preparados:', clienteData);
      console.log('📝 Barbearia ID:', barbeariaId);
      console.log('📝 Tipo do barbeariaId:', typeof barbeariaId);

      // Validar dados obrigatórios
      if (!clienteData.nome || clienteData.nome.trim() === '') {
        throw new Error('Nome do cliente é obrigatório');
      }
      if (!barbeariaId || barbeariaId === '') {
        throw new Error('Barbearia não selecionada');
      }
      
      // Garantir que barbeariaId é um número
      const barbeariaIdNum = parseInt(barbeariaId, 10);
      if (isNaN(barbeariaIdNum)) {
        throw new Error('ID da barbearia inválido');
      }

      // Lógica de negócio: buscar cliente existente ou criar novo
      // O foco é no agendamento, não no cadastro de cliente
      // CPF é opcional e pode repetir (mesma pessoa pode fazer vários agendamentos)
      let cliente;
      
      if (clienteData.cpf) {
        // Se CPF foi fornecido, tentar buscar cliente existente
        try {
          console.log('🔍 Buscando cliente existente pelo CPF:', clienteData.cpf);
          const clientes = await ClienteAPI.buscarPorBarbearia(barbeariaIdNum);
          const clienteExistente = clientes.find(c => c.cpf === clienteData.cpf);
          
          if (clienteExistente) {
            console.log('✅ Cliente existente encontrado:', clienteExistente);
            // Usar cliente existente diretamente (não precisa atualizar)
            cliente = clienteExistente;
          } else {
            console.log('📝 Cliente não encontrado, tentando criar novo...');
            try {
              cliente = await ClienteAPI.criarAssociadoBarbearia(barbeariaIdNum, clienteData);
            } catch (createError) {
              // Se der erro de CPF duplicado, buscar novamente
              if (createError.message && createError.message.includes('CPF')) {
                console.log('⚠️ CPF já cadastrado, buscando cliente existente novamente...');
                const clientesRetry = await ClienteAPI.buscarPorBarbearia(barbeariaIdNum);
                const clienteRetry = clientesRetry.find(c => c.cpf === clienteData.cpf);
                if (clienteRetry) {
                  console.log('✅ Cliente encontrado após erro:', clienteRetry);
                  cliente = clienteRetry;
                } else {
                  throw new Error('CPF já cadastrado, mas cliente não encontrado na busca');
                }
              } else {
                throw createError;
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar cliente existente:', error.message);
          // Se der erro ao buscar, tentar criar (pode dar erro de CPF duplicado)
          try {
            cliente = await ClienteAPI.criarAssociadoBarbearia(barbeariaIdNum, clienteData);
          } catch (createError) {
            // Se der erro de CPF duplicado, buscar novamente
            if (createError.message && createError.message.includes('CPF')) {
              console.log('⚠️ CPF já cadastrado, buscando cliente existente...');
              const clientesRetry = await ClienteAPI.buscarPorBarbearia(barbeariaIdNum);
              const clienteRetry = clientesRetry.find(c => c.cpf === clienteData.cpf);
              if (clienteRetry) {
                console.log('✅ Cliente encontrado após erro:', clienteRetry);
                cliente = clienteRetry;
              } else {
                throw new Error('CPF já cadastrado, mas cliente não encontrado na busca');
              }
            } else {
              throw createError;
            }
          }
        }
      } else {
        // Se não tem CPF, criar novo cliente
        console.log('📝 Criando novo cliente sem CPF...');
        cliente = await ClienteAPI.criarAssociadoBarbearia(barbeariaIdNum, clienteData);
      }

      // Preparar dados da agenda
      // Converter datetime-local para formato ISO (LocalDateTime do Spring Boot espera formato: yyyy-MM-ddTHH:mm:ss)
      // O input datetime-local retorna no formato: yyyy-MM-ddTHH:mm
      // Vamos adicionar os segundos para garantir compatibilidade
      const dataFormatada = datetime + ':00'; // Adiciona segundos (formato: yyyy-MM-ddTHH:mm:ss)

      const agendaData = {
        data: dataFormatada,
        descricao: observacoes || `Agendamento de serviço`
      };

      // Criar agenda associada à barbearia e cliente
      const agenda = await AgendaAPI.criarAssociadoBarbeariaECliente(barbeariaIdNum, cliente.id, agendaData);

      // Buscar dados completos da barbearia e serviço para o export
      const barbearia = await BarbeariaAPI.buscarPorId(barbeariaIdNum);
      const servicoCompleto = await ServicoAPI.buscarPorId(servicoId);
      
      const agendamentoCompleto = {
        cliente,
        agenda,
        servico: servicoCompleto,
        barbearia
      };

      // Mostrar resultado
      showResult('Agendamento realizado com sucesso!', agendamentoCompleto);

      // Exportar agendamento automaticamente
      try {
        if (typeof exportarAgendamento === 'function') {
          await exportarAgendamento(agendamentoCompleto, 'html');
          console.log('✅ Arquivo de agendamento exportado com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao exportar agendamento:', error);
        // Não interrompe o fluxo, apenas loga o erro
      }
    } catch (error) {
      console.error('❌ Erro completo:', error);
      console.error('❌ Stack trace:', error.stack);
      alert('Erro ao realizar agendamento: ' + error.message);
    } finally {
      // Garantir que o botão seja reabilitado
      const btn = form.querySelector('button[type="submit"]') || 
                  form.querySelector('.btn.primary') ||
                  document.querySelector('button[type="submit"]') ||
                  submitButton;
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  }

  // Adicionar listener no formulário
  form.addEventListener('submit', processarSubmit);
  
  // Modal de agendamentos
  const modal = document.getElementById('agendamentos-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCloseFooter = document.getElementById('modal-close-footer');
  const modalLoading = document.getElementById('modal-loading');
  const modalContent = document.getElementById('modal-content');
  const modalError = document.getElementById('modal-error');
  const modalErrorText = document.getElementById('modal-error-text');
  const modalList = document.getElementById('modal-list');
  const modalTotal = document.getElementById('modal-total');

  // Função para abrir modal
  function abrirModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  // Função para fechar modal
  function fecharModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  // Event listeners para fechar modal
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', fecharModal);
  }
  if (modalCloseFooter) {
    modalCloseFooter.addEventListener('click', fecharModal);
  }
  
  // Fechar ao clicar fora do modal
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        fecharModal();
      }
    });
  }

  // Função para formatar data
  function formatarData(dataISO) {
    if (!dataISO) return 'N/A';
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Função para formatar tamanho
  function formatarTamanho(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Função para exibir agendamentos no modal
  function exibirAgendamentos(data) {
    modalLoading.hidden = true;
    modalError.hidden = true;
    modalContent.hidden = false;

    if (!data.arquivos || data.arquivos.length === 0) {
      modalList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">Nenhum agendamento encontrado.</p>';
      modalTotal.textContent = '0';
      return;
    }

    modalTotal.textContent = data.total;

    modalList.innerHTML = data.arquivos.map(arquivo => {
      const tipoArquivo = arquivo.key.endsWith('.html') ? 'HTML' : 'TXT';
      const iconeTipo = arquivo.key.endsWith('.html') ? '🌐' : '📄';
      
      return `
        <div class="agendamento-item">
          <div class="agendamento-header">
            <div>
              <div class="agendamento-protocolo">${arquivo.protocolo || 'N/A'}</div>
              <div class="agendamento-data">${formatarData(arquivo.dataModificacao)}</div>
            </div>
            <div style="font-size: 24px;">${iconeTipo}</div>
          </div>
          <div class="agendamento-info">
            <div class="agendamento-info-item">
              <span class="agendamento-info-label">Tipo</span>
              <span class="agendamento-info-value">${tipoArquivo}</span>
            </div>
            <div class="agendamento-info-item">
              <span class="agendamento-info-label">Tamanho</span>
              <span class="agendamento-info-value">${formatarTamanho(arquivo.tamanho)}</span>
            </div>
            <div class="agendamento-info-item">
              <span class="agendamento-info-label">Data</span>
              <span class="agendamento-info-value">${formatarData(arquivo.dataModificacao)}</span>
            </div>
          </div>
          <div class="agendamento-actions">
            <a href="${arquivo.url}" target="_blank" class="btn primary" style="text-decoration: none; display: inline-block;">
              🔗 Abrir no S3
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  // Botão de teste da API Gateway
  const testGatewayBtn = document.getElementById('test-gateway-btn');
  if (testGatewayBtn) {
    testGatewayBtn.addEventListener('click', async () => {
      const originalText = testGatewayBtn.textContent;
      testGatewayBtn.disabled = true;
      testGatewayBtn.textContent = 'Carregando...';
      
      // Abrir modal e mostrar loading
      abrirModal();
      modalLoading.hidden = false;
      modalContent.hidden = true;
      modalError.hidden = true;
      
      try {
        const apiGateway = window.API_CONFIG?.API_GATEWAY;
        
        if (!apiGateway) {
          modalLoading.hidden = true;
          modalError.hidden = false;
          modalErrorText.textContent = '⚠️ API_GATEWAY não configurada. Verifique a variável de ambiente.';
          return;
        }
        
        console.log('🔗 Testando API Gateway via proxy:', apiGateway);
        
        // Usar proxy do backend para evitar problemas de CORS
        const response = await fetch('/api/gateway/test', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        console.log('📥 Resposta completa do proxy:', result);
        console.log('📦 Dados recebidos:', result.data);
        
        if (result.success && result.data) {
          // Verificar se result.data tem a estrutura esperada
          if (result.data.arquivos && Array.isArray(result.data.arquivos)) {
            // Exibir agendamentos no modal
            console.log('✅ Exibindo agendamentos no modal');
            exibirAgendamentos(result.data);
          } else {
            console.warn('⚠️ Estrutura de dados inesperada:', result.data);
            modalLoading.hidden = true;
            modalError.hidden = false;
            modalErrorText.textContent = 'Estrutura de dados inesperada. Verifique o console.';
          }
        } else {
          modalLoading.hidden = true;
          modalError.hidden = false;
          modalErrorText.textContent = result.error || result.message || 'Erro desconhecido';
        }
        
      } catch (error) {
        console.error('❌ Erro ao testar API Gateway:', error);
        modalLoading.hidden = true;
        modalError.hidden = false;
        modalErrorText.textContent = '❌ Erro ao carregar agendamentos: ' + error.message;
      } finally {
        testGatewayBtn.disabled = false;
        testGatewayBtn.textContent = originalText;
      }
    });
  }
  
  // Verificar se o botão de submit existe (apenas para debug)
  const submitBtnDirect = form.querySelector('button[type="submit"]');
  if (!submitBtnDirect) {
    console.warn('⚠️ Botão de submit não encontrado no formulário');
  } else {
    console.log('✅ Botão de submit encontrado, listener do formulário ativo');
  }
});
