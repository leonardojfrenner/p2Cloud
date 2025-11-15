package br.fatec.p2Cloud.controller;

import br.fatec.p2Cloud.model.Agenda;
import br.fatec.p2Cloud.service.AgendaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/agendas")
@CrossOrigin(origins = "*")
public class AgendaController {

    @Autowired
    private AgendaService agendaService;

    @GetMapping
    public ResponseEntity<List<Agenda>> getAllAgendas() {
        List<Agenda> agendas = agendaService.findAll();
        return ResponseEntity.ok(agendas);
    }

    @GetMapping("/barbearia/{barbeariaId}")
    public ResponseEntity<List<Agenda>> getAgendasByBarbearia(@PathVariable Long barbeariaId) {
        List<Agenda> agendas = agendaService.findByBarbeariaId(barbeariaId);
        return ResponseEntity.ok(agendas);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Agenda>> getAgendasByCliente(@PathVariable Long clienteId) {
        List<Agenda> agendas = agendaService.findByClienteId(clienteId);
        return ResponseEntity.ok(agendas);
    }

    @GetMapping("/periodo")
    public ResponseEntity<List<Agenda>> getAgendasByPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        List<Agenda> agendas = agendaService.findByDataBetween(inicio, fim);
        return ResponseEntity.ok(agendas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Agenda> getAgendaById(@PathVariable Long id) {
        return agendaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createAgenda(@Valid @RequestBody Agenda agenda) {
        try {
            Agenda agendaSalva = agendaService.save(agenda);
            return ResponseEntity.status(HttpStatus.CREATED).body(agendaSalva);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/barbearia/{barbeariaId}")
    public ResponseEntity<?> createAgendaWithBarbearia(
            @PathVariable Long barbeariaId,
            @Valid @RequestBody Agenda agenda) {
        try {
            Agenda agendaSalva = agendaService.saveWithBarbearia(agenda, barbeariaId);
            return ResponseEntity.status(HttpStatus.CREATED).body(agendaSalva);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/barbearia/{barbeariaId}/cliente/{clienteId}")
    public ResponseEntity<?> createAgendaWithBarbeariaAndCliente(
            @PathVariable Long barbeariaId,
            @PathVariable(required = false) Long clienteId,
            @Valid @RequestBody Agenda agenda) {
        try {
            Agenda agendaSalva = agendaService.saveWithBarbeariaAndCliente(agenda, barbeariaId, clienteId);
            return ResponseEntity.status(HttpStatus.CREATED).body(agendaSalva);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAgenda(@PathVariable Long id, @Valid @RequestBody Agenda agenda) {
        try {
            Agenda agendaAtualizada = agendaService.update(id, agenda);
            return ResponseEntity.ok(agendaAtualizada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAgenda(@PathVariable Long id) {
        try {
            agendaService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

