package br.fatec.p2Cloud.repository;

import br.fatec.p2Cloud.model.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicoRepository extends JpaRepository<Servico, Long> {
    
    List<Servico> findByBarbeariaId(Long barbeariaId);
}

