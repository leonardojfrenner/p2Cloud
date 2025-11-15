import assert from 'assert';
import Cliente from '../src/models/cliente.js';
import Agenda from '../src/models/agenda.js';
import Barbearia from '../src/models/barbearia.js';

function testCliente() {
  const c = new Cliente({ nome: 'Ana', cpf: '123.456.789-00', telefone: '11999990000', email: 'ana@example.com' });
  assert.strictEqual(c.nome, 'Ana');
  assert.strictEqual(c.cpf, '123.456.789-00');
}

function testAgenda() {
  const a = new Agenda({ data: '2025-11-05T10:30:00Z', descricao: 'Corte' });
  assert.ok(a.data instanceof Date);
  assert.strictEqual(a.descricao, 'Corte');
}

function testBarbeariaValid() {
  const cliente = new Cliente({ nome: 'Ana', cpf: '123.456.789-00' });
  const agenda = new Agenda({ data: '2025-11-05T10:30:00Z', descricao: 'Corte' });
  const b = new Barbearia({ nome: 'Barbearia Central', cnpj: '00.000.000/0001-00', email: 'contato@barbearia.com', cliente, agenda });
  assert.strictEqual(b.nome, 'Barbearia Central');
  assert.strictEqual(b.cliente.nome, 'Ana');
  assert.ok(b.agenda.data instanceof Date);
  const json = b.toJSON();
  assert.strictEqual(json.nome, 'Barbearia Central');
  assert.strictEqual(json.cliente.nome, 'Ana');
  assert.strictEqual(typeof json.agenda.data, 'string');
}

function testBarbeariaInvalids() {
  assert.throws(() => new Barbearia({ email: 'not-an-email' }), /Invalid email/);
  assert.throws(() => new Barbearia({ cnpj: '123' }), /Invalid CNPJ/);
  // cliente must be instance
  assert.throws(() => new Barbearia({ cliente: {} }), /cliente must be an instance/);
  assert.throws(() => new Barbearia({ agenda: {} }), /agenda must be an instance/);
}

// Run tests
testCliente();
testAgenda();
testBarbeariaValid();
testBarbeariaInvalids();

console.log('All tests passed');
