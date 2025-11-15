package br.fatec.p2Cloud.repository;

import br.fatec.p2Cloud.model.Barbearia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BarbeariaRepository extends JpaRepository<Barbearia, Long> {
    
    Optional<Barbearia> findByCnpj(String cnpj);
    
    Optional<Barbearia> findByEmail(String email);
}

