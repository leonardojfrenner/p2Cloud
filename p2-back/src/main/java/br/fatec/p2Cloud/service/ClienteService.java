package br.fatec.p2Cloud.service;

import br.fatec.p2Cloud.model.Cliente;
import br.fatec.p2Cloud.repository.ClienteRepository;
import br.fatec.p2Cloud.repository.BarbeariaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private BarbeariaRepository barbeariaRepository;

    public List<Cliente> findAll() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> findById(Long id) {
        return clienteRepository.findById(id);
    }

    public Optional<Cliente> findByCpf(String cpf) {
        return clienteRepository.findByCpf(cpf);
    }

    public List<Cliente> findByBarbeariaId(Long barbeariaId) {
        return clienteRepository.findByBarbeariaId(barbeariaId);
    }

    public Cliente save(Cliente cliente) {
        // Validação: verificar se CPF já existe
        if (cliente.getCpf() != null && !cliente.getCpf().isEmpty()) {
            Optional<Cliente> clienteExistente = clienteRepository.findByCpf(cliente.getCpf());
            if (clienteExistente.isPresent() && !clienteExistente.get().getId().equals(cliente.getId())) {
                throw new IllegalArgumentException("CPF já cadastrado");
            }
        }
        return clienteRepository.save(cliente);
    }

    public Cliente update(Long id, Cliente clienteAtualizado) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado com id: " + id));
        
        cliente.setNome(clienteAtualizado.getNome());
        cliente.setCpf(clienteAtualizado.getCpf());
        cliente.setTelefone(clienteAtualizado.getTelefone());
        cliente.setEmail(clienteAtualizado.getEmail());
        cliente.setEndereco(clienteAtualizado.getEndereco());
        
        return save(cliente);
    }

    public Cliente saveWithBarbearia(Cliente cliente, Long barbeariaId) {
        return barbeariaRepository.findById(barbeariaId)
                .map(barbearia -> {
                    cliente.setBarbearia(barbearia);
                    return save(cliente);
                })
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada com id: " + barbeariaId));
    }

    public void deleteById(Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new RuntimeException("Cliente não encontrado com id: " + id);
        }
        clienteRepository.deleteById(id);
    }
}

