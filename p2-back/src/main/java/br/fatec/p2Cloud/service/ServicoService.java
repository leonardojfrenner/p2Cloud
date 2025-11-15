package br.fatec.p2Cloud.service;

import br.fatec.p2Cloud.model.Servico;
import br.fatec.p2Cloud.repository.ServicoRepository;
import br.fatec.p2Cloud.repository.BarbeariaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ServicoService {

    @Autowired
    private ServicoRepository servicoRepository;

    @Autowired
    private BarbeariaRepository barbeariaRepository;

    public List<Servico> findAll() {
        return servicoRepository.findAll();
    }

    public List<Servico> findByBarbeariaId(Long barbeariaId) {
        return servicoRepository.findByBarbeariaId(barbeariaId);
    }

    public Optional<Servico> findById(Long id) {
        return servicoRepository.findById(id);
    }

    public Servico save(Servico servico) {
        // Validação de valor
        if (servico.getValor() < 0) {
            throw new IllegalArgumentException("Valor não pode ser negativo");
        }
        
        // Validação de duração
        if (servico.getDuracao() < 0) {
            throw new IllegalArgumentException("Duração não pode ser negativa");
        }
        
        return servicoRepository.save(servico);
    }

    public Servico saveWithBarbearia(Servico servico, Long barbeariaId) {
        return barbeariaRepository.findById(barbeariaId)
                .map(barbearia -> {
                    servico.setBarbearia(barbearia);
                    return save(servico);
                })
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada com id: " + barbeariaId));
    }

    public Servico update(Long id, Servico servicoAtualizado) {
        Servico servico = servicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado com id: " + id));
        
        servico.setNome(servicoAtualizado.getNome());
        servico.setValor(servicoAtualizado.getValor());
        servico.setFuncionarios(servicoAtualizado.getFuncionarios());
        servico.setDuracao(servicoAtualizado.getDuracao());
        servico.setDescricao(servicoAtualizado.getDescricao());
        
        return save(servico);
    }

    public void deleteById(Long id) {
        if (!servicoRepository.existsById(id)) {
            throw new RuntimeException("Serviço não encontrado com id: " + id);
        }
        servicoRepository.deleteById(id);
    }
}

