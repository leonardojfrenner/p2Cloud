package br.fatec.p2Cloud.controller;

import br.fatec.p2Cloud.model.Barbearia;
import br.fatec.p2Cloud.service.BarbeariaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/barbearias")
@CrossOrigin(origins = "*")
public class BarbeariaController {

    @Autowired
    private BarbeariaService barbeariaService;

    @GetMapping
    public ResponseEntity<List<Barbearia>> getAllBarbearias() {
        List<Barbearia> barbearias = barbeariaService.findAll();
        return ResponseEntity.ok(barbearias);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Barbearia> getBarbeariaById(@PathVariable Long id) {
        return barbeariaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createBarbearia(@Valid @RequestBody Barbearia barbearia) {
        try {
            Barbearia barbeariaSalva = barbeariaService.save(barbearia);
            return ResponseEntity.status(HttpStatus.CREATED).body(barbeariaSalva);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBarbearia(@PathVariable Long id, @Valid @RequestBody Barbearia barbearia) {
        try {
            Barbearia barbeariaAtualizada = barbeariaService.update(id, barbearia);
            return ResponseEntity.ok(barbeariaAtualizada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBarbearia(@PathVariable Long id) {
        try {
            barbeariaService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

