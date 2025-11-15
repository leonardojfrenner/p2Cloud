// Model da classe Agenda (substitui Data1)

/**
 * Representa um item de agenda/compromisso. Usa JS Date internamente.
 */
export default class Agenda {
  /**
   * @param {Object} options
   * @param {Date|string|null} options.data - Date object ou string parsable
   * @param {string} options.descricao
   */
  constructor({ data = null, descricao = '' } = {}) {
    this._data = data instanceof Date ? data : data ? new Date(data) : null;
    this._descricao = descricao;
  }

  get data() {
    return this._data;
  }

  set data(value) {
    if (value instanceof Date) {
      this._data = value;
    } else if (value === null) {
      this._data = null;
    } else {
      // tenta parsear
      const d = new Date(value);
      this._data = isNaN(d.getTime()) ? null : d;
    }
  }

  get descricao() {
    return this._descricao;
  }

  set descricao(value) {
    this._descricao = value;
  }

  toJSON() {
    return {
      data: this._data ? this._data.toISOString() : null,
      descricao: this._descricao,
    };
  }
}
