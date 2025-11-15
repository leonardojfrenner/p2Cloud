package br.fatec.p2Cloud.service;

import br.fatec.p2Cloud.model.Barbearia;
import br.fatec.p2Cloud.repository.BarbeariaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BarbeariaService {

    @Autowired
    private BarbeariaRepository barbeariaRepository;

    public List<Barbearia> findAll() {
        return barbeariaRepository.findAll();
    }

    public Optional<Barbearia> findById(Long id) {
        return barbeariaRepository.findById(id);
    }

    public Optional<Barbearia> findByCnpj(String cnpj) {
        return barbeariaRepository.findByCnpj(cnpj);
    }

    public Barbearia save(Barbearia barbearia) {
        // Validação: verificar se CNPJ já existe
        if (barbearia.getCnpj() != null && !barbearia.getCnpj().isEmpty()) {
            Optional<Barbearia> barbeariaExistente = barbeariaRepository.findByCnpj(barbearia.getCnpj());
            if (barbeariaExistente.isPresent() && !barbeariaExistente.get().getId().equals(barbearia.getId())) {
                throw new IllegalArgumentException("CNPJ já cadastrado");
            }
        }
        return barbeariaRepository.save(barbearia);
    }

    public Barbearia update(Long id, Barbearia barbeariaAtualizado) {
        Barbearia barbearia = barbeariaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Barbearia não encontrada com id: " + id));
        
        barbearia.setNome(barbeariaAtualizado.getNome());
        barbearia.setCnpj(barbeariaAtualizado.getCnpj());
        barbearia.setTelefone(barbeariaAtualizado.getTelefone());
        barbearia.setEmail(barbeariaAtualizado.getEmail());
        barbearia.setEndereco(barbeariaAtualizado.getEndereco());
        
        return save(barbearia);
    }

    public void deleteById(Long id) {
        if (!barbeariaRepository.existsById(id)) {
            throw new RuntimeException("Barbearia não encontrada com id: " + id);
        }
        barbeariaRepository.deleteById(id);
    }
}

