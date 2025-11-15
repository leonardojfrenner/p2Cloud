package br.fatec.p2Cloud.repository;

import br.fatec.p2Cloud.model.Agenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgendaRepository extends JpaRepository<Agenda, Long> {
    
    List<Agenda> findByBarbeariaId(Long barbeariaId);
    
    List<Agenda> findByClienteId(Long clienteId);
    
    List<Agenda> findByDataBetween(LocalDateTime inicio, LocalDateTime fim);
}

