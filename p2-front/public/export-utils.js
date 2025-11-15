// Utilitários para exportação de agendamentos

/**
 * Formata data para exibição
 */
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

/**
 * Formata CPF para exibição
 */
function formatarCPF(cpf) {
  if (!cpf || cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Gera número de protocolo único baseado na data e ID
 */
function gerarProtocolo(agendaId, data) {
  const timestamp = new Date(data).getTime();
  const id = agendaId || timestamp;
  return `AGD-${timestamp}-${id}`;
}

/**
 * Gera conteúdo HTML do agendamento
 */
function gerarHTML(agendamento) {
  const { cliente, agenda, servico, barbearia } = agendamento;
  const protocolo = gerarProtocolo(agenda.id, agenda.data);
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protocolo de Agendamento - ${protocolo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .protocolo {
      font-size: 18px;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 8px;
      display: inline-block;
      margin-top: 10px;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section-title {
      font-size: 20px;
      color: #667eea;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .info-label {
      font-weight: 600;
      color: #666;
    }
    .info-value {
      color: #333;
    }
    .highlight {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      margin-top: 15px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .valor {
      font-size: 24px;
      font-weight: bold;
      color: #28a745;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 PROTOCOLO DE AGENDAMENTO</h1>
      <div class="protocolo">${protocolo}</div>
      <p style="margin-top: 15px; opacity: 0.9;">Data de Emissão: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">👤 DADOS DO CLIENTE</div>
        <div class="info-grid">
          <div class="info-label">Nome:</div>
          <div class="info-value">${cliente.nome || 'N/A'}</div>
          <div class="info-label">CPF:</div>
          <div class="info-value">${formatarCPF(cliente.cpf) || 'N/A'}</div>
          <div class="info-label">Telefone:</div>
          <div class="info-value">${cliente.telefone || 'N/A'}</div>
          <div class="info-label">E-mail:</div>
          <div class="info-value">${cliente.email || 'N/A'}</div>
          <div class="info-label">Endereço:</div>
          <div class="info-value">${cliente.endereco || 'N/A'}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">🏪 DADOS DA BARBEARIA</div>
        <div class="info-grid">
          <div class="info-label">Nome:</div>
          <div class="info-value">${barbearia?.nome || 'N/A'}</div>
          <div class="info-label">CNPJ:</div>
          <div class="info-value">${barbearia?.cnpj || 'N/A'}</div>
          <div class="info-label">Telefone:</div>
          <div class="info-value">${barbearia?.telefone || 'N/A'}</div>
          <div class="info-label">E-mail:</div>
          <div class="info-value">${barbearia?.email || 'N/A'}</div>
          <div class="info-label">Endereço:</div>
          <div class="info-value">${barbearia?.endereco || 'N/A'}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📅 DADOS DO AGENDAMENTO</div>
        <div class="info-grid">
          <div class="info-label">Data e Hora:</div>
          <div class="info-value"><strong>${formatarData(agenda.data)}</strong></div>
          <div class="info-label">Serviço:</div>
          <div class="info-value">${servico?.nome || 'N/A'}</div>
          <div class="info-label">Valor:</div>
          <div class="info-value"><span class="valor">R$ ${servico?.valor?.toFixed(2).replace('.', ',') || '0,00'}</span></div>
          <div class="info-label">Duração:</div>
          <div class="info-value">${servico?.duracao || 'N/A'} minutos</div>
          <div class="info-label">Profissionais:</div>
          <div class="info-value">${servico?.funcionarios?.join(', ') || 'N/A'}</div>
          <div class="info-label">Observações:</div>
          <div class="info-value">${agenda.descricao || 'Nenhuma'}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">ℹ️ INFORMAÇÕES ADICIONAIS</div>
        <div class="info-grid">
          <div class="info-label">ID do Agendamento:</div>
          <div class="info-value">${agenda.id || 'N/A'}</div>
          <div class="info-label">ID do Cliente:</div>
          <div class="info-value">${cliente.id || 'N/A'}</div>
          <div class="info-label">ID da Barbearia:</div>
          <div class="info-value">${barbearia?.id || 'N/A'}</div>
        </div>
      </div>
      
      <div class="highlight">
        <strong>📌 Importante:</strong> Este documento é um comprovante de agendamento. Guarde este protocolo para referência futura.
      </div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Barbearia Central - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Gera conteúdo CSV do agendamento (mantido para compatibilidade)
 */
function gerarCSV(agendamento) {
  const { cliente, agenda, servico, barbearia } = agendamento;
  const protocolo = gerarProtocolo(agenda.id, agenda.data);
  
  const linhas = [
    'PROTOCOLO DE AGENDAMENTO',
    `Protocolo: ${protocolo}`,
    `Data de Emissão: ${new Date().toLocaleString('pt-BR')}`,
    '',
    '=== DADOS DO CLIENTE ===',
    `Nome: ${cliente.nome || 'N/A'}`,
    `CPF: ${formatarCPF(cliente.cpf) || 'N/A'}`,
    `Telefone: ${cliente.telefone || 'N/A'}`,
    `E-mail: ${cliente.email || 'N/A'}`,
    `Endereço: ${cliente.endereco || 'N/A'}`,
    '',
    '=== DADOS DA BARBEARIA ===',
    `Nome: ${barbearia?.nome || 'N/A'}`,
    `CNPJ: ${barbearia?.cnpj || 'N/A'}`,
    `Telefone: ${barbearia?.telefone || 'N/A'}`,
    `E-mail: ${barbearia?.email || 'N/A'}`,
    `Endereço: ${barbearia?.endereco || 'N/A'}`,
    '',
    '=== DADOS DO AGENDAMENTO ===',
    `Data e Hora: ${formatarData(agenda.data)}`,
    `Serviço: ${servico?.nome || 'N/A'}`,
    `Valor: R$ ${servico?.valor?.toFixed(2).replace('.', ',') || '0,00'}`,
    `Duração: ${servico?.duracao || 'N/A'} minutos`,
    `Profissionais: ${servico?.funcionarios?.join(', ') || 'N/A'}`,
    `Observações: ${agenda.descricao || 'Nenhuma'}`,
    '',
    '=== INFORMAÇÕES ADICIONAIS ===',
    `ID do Agendamento: ${agenda.id || 'N/A'}`,
    `ID do Cliente: ${cliente.id || 'N/A'}`,
    `ID da Barbearia: ${barbearia?.id || 'N/A'}`,
    '',
    'Este documento é um comprovante de agendamento.',
    'Guarde este protocolo para referência futura.'
  ];
  
  return linhas.join('\n');
}

/**
 * Gera conteúdo CSV formatado (separado por vírgulas)
 */
function gerarCSVFormatado(agendamento) {
  const { cliente, agenda, servico, barbearia } = agendamento;
  const protocolo = gerarProtocolo(agenda.id, agenda.data);
  
  const linhas = [
    'Protocolo,Data Emissão,Nome Cliente,CPF,Telefone,Email,Endereço Cliente,Barbearia,CNPJ,Telefone Barbearia,Email Barbearia,Endereço Barbearia,Data Agendamento,Serviço,Valor,Duração,Profissionais,Observações,ID Agendamento,ID Cliente,ID Barbearia',
    [
      protocolo,
      new Date().toLocaleString('pt-BR'),
      cliente.nome || '',
      formatarCPF(cliente.cpf) || '',
      cliente.telefone || '',
      cliente.email || '',
      cliente.endereco || '',
      barbearia?.nome || '',
      barbearia?.cnpj || '',
      barbearia?.telefone || '',
      barbearia?.email || '',
      barbearia?.endereco || '',
      formatarData(agenda.data),
      servico?.nome || '',
      servico?.valor?.toFixed(2).replace('.', ',') || '0,00',
      servico?.duracao || '',
      servico?.funcionarios?.join('; ') || '',
      (agenda.descricao || '').replace(/,/g, ';'),
      agenda.id || '',
      cliente.id || '',
      barbearia?.id || ''
    ].map(campo => `"${campo}"`).join(',')
  ];
  
  return linhas.join('\n');
}

/**
 * Faz download do arquivo
 */
function downloadArquivo(conteudo, nomeArquivo, tipo = 'text/plain') {
  const blob = new Blob([conteudo], { type: tipo });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Exporta agendamento como HTML/CSV/TXT
 */
async function exportarAgendamento(agendamento, formato = 'html') {
  try {
    const protocolo = gerarProtocolo(agendamento.agenda.id, agendamento.agenda.data);
    
    // Garantir que o formato padrão seja HTML
    if (!formato || formato === 'txt') {
      formato = 'html';
    }
    
    console.log('📄 Exportando agendamento no formato:', formato);
    
    let conteudo, nomeArquivo, tipoMime;
    
    if (formato === 'csv') {
      conteudo = gerarCSVFormatado(agendamento);
      nomeArquivo = `${protocolo}.csv`;
      tipoMime = 'text/csv;charset=utf-8;';
    } else if (formato === 'txt') {
      conteudo = gerarCSV(agendamento);
      nomeArquivo = `${protocolo}.txt`;
      tipoMime = 'text/plain;charset=utf-8;';
    } else {
      // HTML (padrão)
      conteudo = gerarHTML(agendamento);
      nomeArquivo = `${protocolo}.html`;
      tipoMime = 'text/html;charset=utf-8;';
    }
    
    console.log('📝 Nome do arquivo:', nomeArquivo);
    
    // Para HTML não precisa de BOM, para CSV/TXT adicionar BOM para UTF-8
    let conteudoFinal = conteudo;
    if (formato !== 'html') {
      const bom = '\uFEFF';
      conteudoFinal = bom + conteudo;
    }
    
    // Fazer download
    downloadArquivo(conteudoFinal, nomeArquivo, tipoMime);
    
    // Opcionalmente, salvar no servidor/bucket
    if (window.API_CONFIG?.SAVE_TO_SERVER !== 'false') {
      try {
        await salvarArquivoNoServidor(conteudo, nomeArquivo, protocolo, agendamento);
      } catch (error) {
        console.warn('Não foi possível salvar no servidor:', error);
        // Não interrompe o download, apenas loga o erro
      }
    }
    
    return { sucesso: true, protocolo, nomeArquivo };
  } catch (error) {
    console.error('Erro ao exportar agendamento:', error);
    throw error;
  }
}

/**
 * Salva arquivo no servidor/bucket
 */
async function salvarArquivoNoServidor(conteudo, nomeArquivo, protocolo, agendamento) {
  // Verificar se deve salvar no servidor
  const saveToServer = window.API_CONFIG?.SAVE_TO_SERVER !== false;
  if (!saveToServer) {
    console.log('Salvamento no servidor desabilitado');
    return;
  }

  const FRONTEND_BASE_URL = window.location.origin;
  
  try {
    const response = await fetch(`${FRONTEND_BASE_URL}/api/agendamentos/exportar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        protocolo,
        nomeArquivo,
        conteudo,
        agendamento: {
          id: agendamento.agenda.id,
          clienteId: agendamento.cliente.id,
          barbeariaId: agendamento.barbearia?.id,
          data: agendamento.agenda.data
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || 'Erro ao salvar arquivo no servidor');
    }
    
    const resultado = await response.json();
    console.log('✅ Arquivo salvo no servidor/bucket:', resultado);
    return resultado;
  } catch (error) {
    // Se o endpoint não existir ou houver erro, apenas loga o erro
    // Não interrompe o download local
    console.warn('⚠️ Não foi possível salvar no servidor/bucket:', error.message);
    return null;
  }
}

// Exportar funções para uso global
window.exportarAgendamento = exportarAgendamento;
window.gerarProtocolo = gerarProtocolo;

