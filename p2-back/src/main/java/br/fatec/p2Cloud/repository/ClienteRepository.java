package br.fatec.p2Cloud.repository;

import br.fatec.p2Cloud.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    
    Optional<Cliente> findByCpf(String cpf);
    
    Optional<Cliente> findByEmail(String email);
    
    List<Cliente> findByBarbeariaId(Long barbeariaId);
}

