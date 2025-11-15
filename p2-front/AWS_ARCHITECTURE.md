# 🏗️ Arquitetura AWS - Upload para S3

## 📋 Opções Disponíveis

### Opção 1: Backend Express → S3 (✅ **ATUAL - Recomendada para começar**)

**Como funciona:**
```
Frontend → Backend Express → S3
```

**Vantagens:**
- ✅ **Já implementado** - código pronto
- ✅ **Simples** - sem infraestrutura adicional
- ✅ **Seguro** - credenciais AWS no backend (não expostas)
- ✅ **Controle total** - validações, logging, transformações
- ✅ **Custo baixo** - apenas S3 + servidor (EC2/ECS/Fargate)
- ✅ **Fallback automático** - se S3 falhar, salva localmente

**Desvantagens:**
- ⚠️ **Latência** - arquivo passa pelo backend (para arquivos pequenos, não é problema)
- ⚠️ **Custo do servidor** - precisa manter servidor rodando
- ⚠️ **Limite de tamanho** - limitado pela memória do servidor

**Quando usar:**
- ✅ Arquivos pequenos (< 10MB)
- ✅ Precisa de validações complexas
- ✅ Quer simplicidade
- ✅ Já tem servidor rodando

---

### Opção 2: Frontend → S3 Direto (com Presigned URLs)

**Como funciona:**
```
Frontend → Lambda (gera presigned URL) → Frontend → S3 (upload direto)
```

**Vantagens:**
- ✅ **Performance** - upload direto ao S3 (sem passar pelo backend)
- ✅ **Escalável** - S3 escala automaticamente
- ✅ **Custo baixo** - apenas S3 + Lambda (pay-per-use)
- ✅ **Arquivos grandes** - suporta arquivos grandes (até 5GB)
- ✅ **Menos carga no servidor** - servidor não processa arquivo

**Desvantagens:**
- ⚠️ **Mais complexo** - precisa Lambda + configuração S3
- ⚠️ **Validações limitadas** - validações no frontend são menos seguras
- ⚠️ **CORS** - precisa configurar CORS no S3

**Quando usar:**
- ✅ Arquivos grandes (> 10MB)
- ✅ Muitos uploads simultâneos
- ✅ Quer reduzir carga no servidor
- ✅ Performance é crítica

---

### Opção 3: Lambda + API Gateway → S3

**Como funciona:**
```
Frontend → API Gateway → Lambda → S3
```

**Vantagens:**
- ✅ **Serverless** - sem servidor para gerenciar
- ✅ **Escalável** - escala automaticamente
- ✅ **Custo baixo** - pay-per-use (Lambda + API Gateway)
- ✅ **Seguro** - credenciais no Lambda (IAM roles)
- ✅ **Validações** - pode validar antes de salvar

**Desvantagens:**
- ⚠️ **Latência** - arquivo passa pela Lambda (cold start)
- ⚠️ **Limite de tamanho** - API Gateway tem limite de 10MB
- ⚠️ **Mais complexo** - precisa configurar Lambda + API Gateway
- ⚠️ **Custo** - pode ser mais caro para muitos uploads

**Quando usar:**
- ✅ Arquitetura serverless completa
- ✅ Quer evitar gerenciar servidor
- ✅ Uploads esporádicos
- ✅ Arquivos pequenos (< 10MB)

---

## 🎯 **RECOMENDAÇÃO**

### Para seu caso (arquivos de agendamento - TXT/CSV pequenos):

**✅ OPÇÃO 1 (Atual) - Backend Express → S3**

**Por quê?**
1. ✅ **Já está implementado** - funciona agora
2. ✅ **Arquivos pequenos** - TXT/CSV são leves (< 1MB)
3. ✅ **Simples** - sem infraestrutura adicional
4. ✅ **Seguro** - credenciais no backend
5. ✅ **Custo baixo** - apenas S3 + servidor que já tem

**Quando migrar para outra opção?**
- Se arquivos ficarem muito grandes (> 10MB)
- Se tiver muitos uploads simultâneos (> 1000/min)
- Se quiser arquitetura 100% serverless

---

## 🚀 Implementação Recomendada (Híbrida - Melhor dos dois mundos)

### Arquitetura Híbrida (Futuro):

```
Frontend → Backend Express (valida) → Lambda (gera presigned URL) → Frontend → S3 (upload direto)
```

**Vantagens:**
- ✅ Validações no backend
- ✅ Upload direto ao S3 (performance)
- ✅ Credenciais seguras (Lambda com IAM role)
- ✅ Escalável

**Implementação:**
1. Backend valida dados do agendamento
2. Backend chama Lambda para gerar presigned URL
3. Frontend faz upload direto ao S3 usando presigned URL
4. Frontend confirma upload para o backend

---

## 📊 Comparação Rápida

| Critério | Express → S3 | Presigned URL | Lambda → S3 |
|----------|--------------|---------------|-------------|
| **Complexidade** | ⭐ Simples | ⭐⭐ Média | ⭐⭐⭐ Alta |
| **Performance** | ⭐⭐ Boa | ⭐⭐⭐ Excelente | ⭐⭐ Boa |
| **Custo** | ⭐⭐ Baixo | ⭐⭐⭐ Muito Baixo | ⭐⭐ Baixo |
| **Segurança** | ⭐⭐⭐ Excelente | ⭐⭐ Boa | ⭐⭐⭐ Excelente |
| **Escalabilidade** | ⭐⭐ Boa | ⭐⭐⭐ Excelente | ⭐⭐⭐ Excelente |
| **Arquivos Grandes** | ⭐ Limitado | ⭐⭐⭐ Suporta | ⭐ Limitado |
| **Já Implementado** | ✅ Sim | ❌ Não | ❌ Não |

---

## 🔧 Configuração Atual (Opção 1)

### Variáveis de Ambiente:

```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=sua-key
AWS_SECRET_ACCESS_KEY=sua-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu-bucket
SAVE_TO_SERVER=true
```

### IAM Policy para o Servidor:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::seu-bucket/agendamentos/*"
    }
  ]
}
```

---

## 🎓 Conclusão

**Para começar:** Use a **Opção 1 (Express → S3)** que já está implementada.

**Para otimizar depois:** Migre para **Presigned URLs** se precisar de:
- Arquivos maiores
- Mais performance
- Reduzir carga no servidor

**Para arquitetura serverless:** Use **Lambda + API Gateway** se quiser evitar gerenciar servidor.

---

## 📚 Referências

- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [AWS Lambda + S3](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html)
- [AWS API Gateway Limits](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html)

