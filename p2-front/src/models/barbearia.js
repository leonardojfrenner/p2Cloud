// Model da classe Barbearia
// Atributos: nome, cnpj, telefone, email, endereco, cliente e agenda

import Cliente from './cliente.js';
import Agenda from './agenda.js';

/**
 * Representa uma barbearia.
 */
export default class Barbearia {
	constructor({ nome = '', cnpj = '', telefone = '', email = '', endereco = '', cliente = null, agenda = null } = {}) {
		// usar setters para validação
		this.nome = nome;
		this.cnpj = cnpj;
		this.telefone = telefone;
		this.email = email;
		this.endereco = endereco;
		this.cliente = cliente;
		this.agenda = agenda;
	}

	// Validações simples
	static _isValidEmail(email) {
		if (!email) return true; // aceitar vazio
		return /\S+@\S+\.\S+/.test(email);
	}

	static _isValidCPF(cpf) {
		if (!cpf) return true;
		return /^\d{3}\.??\d{3}\.??\d{3}-?\d{2}$/.test(cpf);
	}

	static _isValidCNPJ(cnpj) {
		if (!cnpj) return true;
		return /^\d{2}\.??\d{3}\.??\d{3}\/?\d{4}-?\d{2}$/.test(cnpj);
	}

	// Getters / Setters
	get nome() {
		return this._nome;
	}

	set nome(value) {
		this._nome = value;
	}

	get cnpj() {
		return this._cnpj;
	}

	set cnpj(value) {
		if (!Barbearia._isValidCNPJ(value)) throw new Error('Invalid CNPJ');
		this._cnpj = value;
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
		if (!Barbearia._isValidEmail(value)) throw new Error('Invalid email');
		this._email = value;
	}

	get endereco() {
		return this._endereco;
	}

	set endereco(value) {
		this._endereco = value;
	}

	get cliente() {
		return this._cliente;
	}

	set cliente(value) {
		if (value === null || value === undefined) {
			this._cliente = null;
			return;
		}
		if (!(value instanceof Cliente)) {
			throw new TypeError('cliente must be an instance of Cliente or null');
		}
		this._cliente = value;
	}

	get agenda() {
		return this._agenda;
	}

	set agenda(value) {
		if (value === null || value === undefined) {
			this._agenda = null;
			return;
		}
		if (!(value instanceof Agenda)) {
			throw new TypeError('agenda must be an instance of Agenda or null');
		}
		this._agenda = value;
	}

	toJSON() {
		return {
			nome: this._nome,
			cnpj: this._cnpj,
			telefone: this._telefone,
			email: this._email,
			endereco: this._endereco,
			cliente: this._cliente && typeof this._cliente.toJSON === 'function' ? this._cliente.toJSON() : this._cliente,
			agenda: this._agenda && typeof this._agenda.toJSON === 'function' ? this._agenda.toJSON() : this._agenda,
		};
	}
}

