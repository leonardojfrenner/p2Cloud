// Model da classe Cliente

/**
 * Representa um cliente da barbearia.
 */
export default class Cliente {
  /**
   * @param {Object} options
   * @param {string} options.nome
   * @param {string} options.cpf
   * @param {string} options.telefone
   * @param {string} options.email
   * @param {string|Object} options.endereco
   */
  constructor({ nome = '', cpf = '', telefone = '', email = '', endereco = '' } = {}) {
    this._nome = nome;
    this._cpf = cpf;
    this._telefone = telefone;
    this._email = email;
    this._endereco = endereco;
  }

  get nome() {
    return this._nome;
  }

  set nome(value) {
    this._nome = value;
  }

  get cpf() {
    return this._cpf;
  }

  set cpf(value) {
    this._cpf = value;
  }

  get telefone() {
    return this._telefone;
  }

  set telefone(value) {
    this._telefone = value;
  }

  get email() {
    return this._email;
  }

  set email(value) {
    this._email = value;
  }

  get endereco() {
    return this._endereco;
  }

  set endereco(value) {
    this._endereco = value;
  }

  toJSON() {
    return {
      nome: this._nome,
      cpf: this._cpf,
      telefone: this._telefone,
      email: this._email,
      endereco: this._endereco,
    };
  }
}
