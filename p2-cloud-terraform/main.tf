# 1. Configuração do Provedor AWS
# Usa as variáveis carregadas do seu .env
provider "aws" {
  region     = var.REGION
  access_key = var.ACCESS_KEY
  secret_key = var.SECRET_KEY
}

# Vamos migrar a instancia do lightsail para ec2 que possui suporte do CloudWatch

# Instância EC2 para Frontend (Substitui Lightsail Instance)
# Mantém Database, Container Service e Bucket no Lightsail

# Security Group para a instância EC2
resource "aws_security_group" "frontend_sg" {
  name        = "frontend-sg"
  description = "Security group for frontend instance"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # Egress - permite todo tráfego de saída
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "frontend-security-group"
  }
}

# Key Pair para EC2 (pode reutilizar a mesma chave SSH)
resource "aws_key_pair" "ec2_key" {
  key_name   = "ec2-frontend-key-${var.REGION}"
  public_key = var.PUBLIC_KEY_CONTENT

  tags = {
    Name = "EC2 Frontend Key"
  }
}

# Instância EC2 para Frontend
resource "aws_instance" "frontend_ec2" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"  # ou t2.micro para Free Tier
  key_name      = aws_key_pair.ec2_key.key_name

  vpc_security_group_ids = [aws_security_group.frontend_sg.id]

  # Script de inicialização
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # 1. Atualiza o sistema
    apt-get update -y
    
    # 2. Instala o Docker
    apt-get install -y docker.io
    
    # 3. Inicia e habilita o serviço Docker
    systemctl start docker
    systemctl enable docker
    
    # 4. Adiciona o usuário ubuntu ao grupo docker
    usermod -aG docker ubuntu
    
    # 5. Para o container antigo se existir
    docker stop meu-front-container 2>/dev/null || true
    docker rm meu-front-container 2>/dev/null || true
    
    # 6. Executa o container do frontend com variáveis de ambiente
    docker run -d \
      --name meu-front-container \
      --restart unless-stopped \
      -p 80:3000 \
      -e API_HOST=${replace(aws_lightsail_container_service.meu_backend_service.url, "https://", "")} \
      -e API_PORT=443 \
      -e API_PROTOCOL=https \
      -e API_BASE_URL=${aws_lightsail_container_service.meu_backend_service.url}/api \
      -e PORT=3000 \
      -e STORAGE_TYPE=s3 \
      -e STORAGE_PATH=./uploads/agendamentos \
      -e SAVE_TO_SERVER=true \
      -e ACESS_KEY_S3="${var.BUCKET_ACCESS_KEY_ID}" \
      -e ACESS_SECRET_KEY="${var.BUCKET_SECRET_ACCESS_KEY}" \
      -e S3_BUCKET_NAME=${aws_lightsail_bucket.meu_bucket_lightsail.name} \
      -e S3_BUCKET_ENDPOINT=${aws_lightsail_bucket.meu_bucket_lightsail.name}.s3.${var.REGION}.amazonaws.com \
      -e S3_REGION=${var.REGION} \
      -e API_GATEWAY=${aws_apigatewayv2_api.api_gw.api_endpoint}/hello \
      leonardorennerdev/barbearia-frontend
    
    echo "Container do frontend iniciado com sucesso!"
  EOF

  # Depende da criação do bucket, container service e API Gateway
  depends_on = [
    aws_s3_bucket.meu_bucket_s3,
    aws_lightsail_container_service.meu_backend_service,
    aws_apigatewayv2_api.api_gw
  ]

  tags = {
    Name = "meu-front-ec2"
    Type = "Frontend"
  }
}

# Data source para AMI Ubuntu mais recente
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Outputs para EC2
output "ec2_instance_id" {
  description = "ID da instância EC2"
  value       = aws_instance.frontend_ec2.id
}

output "ec2_public_ip" {
  description = "IP público da instância EC2"
  value       = aws_instance.frontend_ec2.public_ip
}

output "ec2_public_dns" {
  description = "DNS público da instância EC2"
  value       = aws_instance.frontend_ec2.public_dns
}

output "ec2_ssh_command" {
  description = "Comando SSH para conectar na instância"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.frontend_ec2.public_ip}"
}

# 3. Banco de Dados Lightsail
resource "aws_lightsail_database" "barbearia_db" {
  relational_database_name  = "barbearia"
  master_database_name      = "barbearia" 
  master_username           = "barbearia_user"    
  master_password           = var.DB_PASSWORD 
  
  availability_zone         = "${var.REGION}a" 
  blueprint_id              = "postgres_17"
  bundle_id                 = "micro_2_0" 
  
  publicly_accessible       = true
}


# 5. Serviço de Container Lightsail
resource "aws_lightsail_container_service" "meu_backend_service" {
  name  = "meu-backend"
  power = "nano" 
  scale = 1 
}

resource "aws_lightsail_container_service_deployment_version" "meu_backend_deployment" {
  service_name = aws_lightsail_container_service.meu_backend_service.name
  
  container {
    container_name = "meu-back" 
    image          = "leonardorennerdev/p2cloud" 
    ports = { 
      "8080" = "HTTP"
    }
    
    # Variáveis de ambiente do Spring Boot
    environment = {
      SPRING_APPLICATION_NAME         = "p2Cloud"
      SPRING_DATASOURCE_URL           = "jdbc:postgresql://${aws_lightsail_database.barbearia_db.master_endpoint_address}:${aws_lightsail_database.barbearia_db.master_endpoint_port}/${aws_lightsail_database.barbearia_db.master_database_name}"
      SPRING_DATASOURCE_USERNAME      = aws_lightsail_database.barbearia_db.master_username
      SPRING_DATASOURCE_PASSWORD      = var.DB_PASSWORD
      SPRING_DATASOURCE_DRIVER        = "org.postgresql.Driver"
    }
  }

  public_endpoint {
    container_name = "meu-back"
    container_port = 8080
    health_check {
      path = "/"
    }
  }
}

# 6. Bucket Lightsail
resource "aws_lightsail_bucket" "meu_bucket_lightsail" {
  name      = "meu-bucket-barbearia-app"
  bundle_id = "small_1_0"
  region    = var.REGION
}


# --- Configuração de IAM, Lambda e API Gateway ---
# Estes recursos não precisam de alteração direta de variáveis, 
# mas dependem do provedor AWS configurado acima.

# 7. IAM Role para a Função Lambda
resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda_hello_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# 8. Policy para Logs (Permite escrever logs no CloudWatch)
resource "aws_iam_role_policy_attachment" "lambda_logs_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 8.1. Policy para acesso ao S3 (Bucket Lightsail)
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "lambda_s3_access_policy"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_lightsail_bucket.meu_bucket_lightsail.arn,
        "${aws_lightsail_bucket.meu_bucket_lightsail.arn}/*"
      ]
    }]
  })
}

# 9. Função Lambda
resource "aws_lambda_function" "hello_lambda" {
  filename         = "lambda-function.zip" 
  function_name    = "terraform-hello-world"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler" 
  runtime          = "nodejs20.x"
  memory_size      = 256
  timeout          = 30
  
  # Variáveis de ambiente para acesso ao S3 (Bucket Lightsail)
  environment {
    variables = {
      ACESS_KEY_S3      = var.BUCKET_ACCESS_KEY_ID
      ACESS_SECRET_KEY  = var.BUCKET_SECRET_ACCESS_KEY
      S3_REGION         = var.REGION
      S3_BUCKET_NAME    = aws_lightsail_bucket.meu_bucket_lightsail.name
      S3_BUCKET_ENDPOINT = "${aws_lightsail_bucket.meu_bucket_lightsail.name}.s3.${var.REGION}.amazonaws.com"
    }
  }
}


# 10. API Gateway (HTTP API)
resource "aws_apigatewayv2_api" "api_gw" {
  name          = "hello-world-api"
  protocol_type = "HTTP"
}

# 11. Integração: Liga a API Gateway à Função Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.api_gw.id
  integration_type = "AWS_PROXY"
  integration_method = "POST"
  integration_uri  = aws_lambda_function.hello_lambda.invoke_arn
  payload_format_version = "2.0"
}

# 12. Rota: Define o caminho de acesso
resource "aws_apigatewayv2_route" "api_route" {
  api_id    = aws_apigatewayv2_api.api_gw.id
  route_key = "GET /hello" 
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# 13. Permissão: Autoriza a API Gateway a invocar o Lambda
resource "aws_lambda_permission" "apigw_lambda_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gw.execution_arn}/*/*"
}

# 14. Deployment
resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.api_gw.id
  name        = "$default" 
  auto_deploy = true
}

# 15. Outputs
output "api_gateway_url" {
  description = "URL do API Gateway"
  value       = "${aws_apigatewayv2_api.api_gw.api_endpoint}/hello"
}

output "database_endpoint" {
  description = "Endpoint do banco de dados Lightsail"
  value       = "${aws_lightsail_database.barbearia_db.master_endpoint_address}:${aws_lightsail_database.barbearia_db.master_endpoint_port}"
}

output "database_connection_string" {
  description = "String de conexão JDBC para o banco de dados"
  value       = "jdbc:postgresql://${aws_lightsail_database.barbearia_db.master_endpoint_address}:${aws_lightsail_database.barbearia_db.master_endpoint_port}/${aws_lightsail_database.barbearia_db.master_database_name}"
  sensitive   = false
}

output "container_service_url" {
  description = "URL do serviço de container Lightsail"
  value       = aws_lightsail_container_service.meu_backend_service.url
}

output "bucket_name" {
  description = "Nome do bucket Lightsail"
  value       = aws_lightsail_bucket.meu_bucket_lightsail.name
}

output "bucket_arn" {
  description = "ARN do bucket Lightsail"
  value       = aws_lightsail_bucket.meu_bucket_lightsail.arn
}

output "bucket_url" {
  description = "URL do bucket Lightsail"
  value       = aws_lightsail_bucket.meu_bucket_lightsail.url
}

output "bucket_info" {
  description = "Informações do bucket Lightsail"
  value = {
    bucket_name = aws_lightsail_bucket.meu_bucket_lightsail.name
    bucket_arn  = aws_lightsail_bucket.meu_bucket_lightsail.arn
    region      = var.REGION
    command     = "aws lightsail create-bucket-access-key --bucket-name ${aws_lightsail_bucket.meu_bucket_lightsail.name} --region ${var.REGION}"
    note        = "Execute o comando acima para criar as chaves de acesso, depois configure as variáveis BUCKET_ACCESS_KEY_ID e BUCKET_SECRET_ACCESS_KEY"
  }
}