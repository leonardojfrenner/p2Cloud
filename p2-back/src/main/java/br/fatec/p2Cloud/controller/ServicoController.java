package br.fatec.p2Cloud.controller;

import br.fatec.p2Cloud.model.Servico;
import br.fatec.p2Cloud.service.ServicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/servicos")
@CrossOrigin(origins = "*")
public class ServicoController {

    @Autowired
    private ServicoService servicoService;

    @GetMapping
    public ResponseEntity<List<Servico>> getAllServicos() {
        List<Servico> servicos = servicoService.findAll();
        return ResponseEntity.ok(servicos);
    }

    @GetMapping("/barbearia/{barbeariaId}")
    public ResponseEntity<List<Servico>> getServicosByBarbearia(@PathVariable Long barbeariaId) {
        List<Servico> servicos = servicoService.findByBarbeariaId(barbeariaId);
        return ResponseEntity.ok(servicos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Servico> getServicoById(@PathVariable Long id) {
        return servicoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createServico(@Valid @RequestBody Servico servico) {
        try {
            Servico servicoSalvo = servicoService.save(servico);
            return ResponseEntity.status(HttpStatus.CREATED).body(servicoSalvo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/barbearia/{barbeariaId}")
    public ResponseEntity<?> createServicoWithBarbearia(
            @PathVariable Long barbeariaId,
            @Valid @RequestBody Servico servico) {
        try {
            Servico servicoSalvo = servicoService.saveWithBarbearia(servico, barbeariaId);
            return ResponseEntity.status(HttpStatus.CREATED).body(servicoSalvo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateServico(@PathVariable Long id, @Valid @RequestBody Servico servico) {
        try {
            Servico servicoAtualizado = servicoService.update(id, servico);
            return ResponseEntity.ok(servicoAtualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteServico(@PathVariable Long id) {
        try {
            servicoService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

