package br.fatec.p2Cloud.service;

import br.fatec.p2Cloud.model.Agenda;
import br.fatec.p2Cloud.repository.AgendaRepository;
import br.fatec.p2Cloud.repository.BarbeariaRepository;
import br.fatec.p2Cloud.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AgendaService {

    @Autowired
    private AgendaRepository agendaRepository;

    @Autowired
    private BarbeariaRepository barbeariaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    public List<Agenda> findAll() {
        return agendaRepository.findAll();
    }

    public List<Agenda> findByBarbeariaId(Long barbeariaId) {
        return agendaRepository.findByBarbeariaId(barbeariaId);
    }

    public List<Agenda> findByClienteId(Long clienteId) {
        return agendaRepository.findByClienteId(clienteId);
    }

    public List<Agenda> findByDataBetween(LocalDateTime inicio, LocalDateTime fim) {
        return agendaRepository.findByDataBetween(inicio, fim);
    }

    public Optional<Agenda> findById(Long id) {
        return agendaRepository.findById(id);
    }

    public Agenda save(Agenda agenda) {
        if (agenda.getData() == null) {
            throw new IllegalArgumentException("Data é obrigatória");
        }
        return agendaRepository.save(agenda);
    }

    public Agenda saveWithBarbearia(Agenda agenda, Long barbeariaId) {
        return barbeariaRepository.findById(barbeariaId)
                .map(barbearia -> {
                    agenda.setBarbearia(barbearia);
                    return save(agenda);
                })
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada com id: " + barbeariaId));
    }

    public Agenda saveWithBarbeariaAndCliente(Agenda agenda, Long barbeariaId, Long clienteId) {
        return barbeariaRepository.findById(barbeariaId)
                .map(barbearia -> {
                    agenda.setBarbearia(barbearia);
                    if (clienteId != null) {
                        clienteRepository.findById(clienteId)
                                .ifPresent(agenda::setCliente);
                    }
                    return save(agenda);
                })
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada com id: " + barbeariaId));
    }

    public Agenda update(Long id, Agenda agendaAtualizado) {
        Agenda agenda = agendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agenda não encontrada com id: " + id));
        
        agenda.setData(agendaAtualizado.getData());
        agenda.setDescricao(agendaAtualizado.getDescricao());
        
        return save(agenda);
    }

    public void deleteById(Long id) {
        if (!agendaRepository.existsById(id)) {
            throw new RuntimeException("Agenda não encontrada com id: " + id);
        }
        agendaRepository.deleteById(id);
    }
}

