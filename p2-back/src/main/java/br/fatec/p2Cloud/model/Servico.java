package br.fatec.p2Cloud.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "servicos")
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome do serviço é obrigatório")
    @Column(nullable = false)
    private String nome;

    @NotNull(message = "Valor é obrigatório")
    @Min(value = 0, message = "Valor não pode ser negativo")
    @Column(nullable = false)
    private Double valor;

    @ElementCollection
    @CollectionTable(name = "servico_funcionarios", joinColumns = @JoinColumn(name = "servico_id"))
    @Column(name = "funcionario")
    private List<String> funcionarios = new ArrayList<>();

    @Min(value = 0, message = "Duração não pode ser negativa")
    @Column(nullable = false)
    private Integer duracao = 30; // minutos

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @ManyToOne
    @JoinColumn(name = "barbearia_id")
    @JsonIgnoreProperties({"clientes", "agendas", "servicos"})
    private Barbearia barbearia;

    // Construtores
    public Servico() {
    }

    public Servico(String nome, Double valor, List<String> funcionarios, Integer duracao, String descricao) {
        this.nome = nome;
        this.valor = valor;
        this.funcionarios = funcionarios != null ? new ArrayList<>(funcionarios) : new ArrayList<>();
        this.duracao = duracao != null ? duracao : 30;
        this.descricao = descricao;
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Double getValor() {
        return valor;
    }

    public void setValor(Double valor) {
        if (valor < 0) {
            throw new IllegalArgumentException("Valor não pode ser negativo");
        }
        this.valor = valor;
    }

    public List<String> getFuncionarios() {
        return new ArrayList<>(funcionarios);
    }

    public void setFuncionarios(List<String> funcionarios) {
        this.funcionarios = funcionarios != null ? new ArrayList<>(funcionarios) : new ArrayList<>();
    }

    public Integer getDuracao() {
        return duracao;
    }

    public void setDuracao(Integer duracao) {
        if (duracao < 0) {
            throw new IllegalArgumentException("Duração não pode ser negativa");
        }
        this.duracao = duracao;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Barbearia getBarbearia() {
        return barbearia;
    }

    public void setBarbearia(Barbearia barbearia) {
        this.barbearia = barbearia;
    }
}

