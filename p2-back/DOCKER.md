# Docker - Build e Deploy

## Pré-requisitos
- Docker instalado
- Conta no Docker Hub (usuário: leonardorennerdev)

## Build da Imagem

### Opção 1: Usando o script (Windows)
```bash
docker-build.bat
```

### Opção 2: Usando o script (Linux/Mac)
```bash
chmod +x docker-build.sh
./docker-build.sh
```

### Opção 3: Comando manual
```bash
docker build -t leonardorennerdev/p2cloud:latest .
```

## Push para Docker Hub

1. Faça login no Docker Hub:
```bash
docker login
```

2. Faça o push da imagem:
```bash
docker push leonardorennerdev/p2cloud:latest
```

## Executar Localmente

```bash
docker run -p 8080:8080 leonardorennerdev/p2cloud:latest
```

## Executar com Variáveis de Ambiente

Se precisar sobrescrever configurações do banco de dados:

```bash
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://seu-host:5432/barbearia \
  -e SPRING_DATASOURCE_USERNAME=seu-usuario \
  -e SPRING_DATASOURCE_PASSWORD=sua-senha \
  leonardorennerdev/p2cloud:latest
```

## Tags Disponíveis

- `latest` - Última versão
- `0.0.1-SNAPSHOT` - Versão específica (quando disponível)

## Estrutura do Dockerfile

O Dockerfile usa multi-stage build:
1. **Stage 1 (build)**: Compila a aplicação usando Maven
2. **Stage 2 (runtime)**: Cria imagem final apenas com JRE e o JAR

Isso resulta em uma imagem menor e mais eficiente.


