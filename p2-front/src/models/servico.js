/**
 * Representa um serviço oferecido pela barbearia.
 */
export default class Servico {
  /**
   * @param {Object} options
   * @param {string} options.nome - Nome do serviço
   * @param {number} options.valor - Valor em reais
   * @param {string[]} options.funcionarios - Lista de funcionários que realizam o serviço
   * @param {number} options.duracao - Duração em minutos
   * @param {string} options.descricao - Descrição detalhada do serviço
   */
  constructor({ nome, valor, funcionarios = [], duracao = 30, descricao = '' }) {
    this._nome = nome;
    this._valor = valor;
    this._funcionarios = funcionarios;
    this._duracao = duracao;
    this._descricao = descricao;
  }

  // Getters
  get nome() { return this._nome; }
  get valor() { return this._valor; }
  get funcionarios() { return [...this._funcionarios]; } // retorna cópia do array
  get duracao() { return this._duracao; }
  get descricao() { return this._descricao; }

  // Setters
  set nome(value) { this._nome = value; }
  set valor(value) {
    if (value < 0) throw new Error('Valor não pode ser negativo');
    this._valor = value;
  }
  set funcionarios(value) {
    if (!Array.isArray(value)) throw new TypeError('Funcionários deve ser um array');
    this._funcionarios = [...value];
  }
  set duracao(value) {
    if (value < 0) throw new Error('Duração não pode ser negativa');
    this._duracao = value;
  }
  set descricao(value) { this._descricao = value; }

  toJSON() {
    return {
      nome: this._nome,
      valor: this._valor,
      funcionarios: [...this._funcionarios],
      duracao: this._duracao,
      descricao: this._descricao,
    };
  }

  /**
   * Retorna os serviços padrão oferecidos pela barbearia.
   * @returns {Servico[]} Array com os serviços padrão
   */
  static getPadrao() {
    return [
      new Servico({
        nome: 'Corte de Cabelo',
        valor: 45.00,
        funcionarios: ['João', 'Pedro', 'Maria'],
        duracao: 30,
        descricao: 'Corte masculino com técnicas modernas, inclui lavagem e finalização.'
      }),
      new Servico({
        nome: 'Barba',
        valor: 35.00,
        funcionarios: ['João', 'Pedro'],
        duracao: 30,
        descricao: 'Barba tradicional com toalha quente, óleo e finalização.'
      }),
      new Servico({
        nome: 'Limpeza de Pele',
        valor: 75.00,
        funcionarios: ['Maria', 'Ana'],
        duracao: 45,
        descricao: 'Limpeza facial completa com extração, máscara e hidratação.'
      })
    ];
  }
}