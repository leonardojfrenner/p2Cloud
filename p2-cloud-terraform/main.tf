# 1. Configuração do Provedor AWS
# Usa as variáveis carregadas do seu .env
provider "aws" {
  region     = var.REGION
  access_key = var.ACCESS_KEY
  secret_key = var.SECRET_KEY
}

# Migração completa do Lightsail para AWS padrão (com suporte CloudWatch)
# - EC2 para Frontend (já implementado)
# - RDS para Database (substitui Lightsail Database)
# - ECS Fargate para Container Service (substitui Lightsail Container Service)
# - S3 padrão para Bucket (substitui Lightsail Bucket)

# --- VPC e Networking ---
# Data source para VPC padrão
data "aws_vpc" "default" {
  default = true
}

# Data source para subnets padrão
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group para a instância EC2
resource "aws_security_group" "frontend_sg" {
  name        = "barbearia-frontend-sg"
  description = "Security group for frontend instance"
  vpc_id      = data.aws_vpc.default.id

  lifecycle {
    # Ignora mudanças no nome se o recurso já existir
    ignore_changes = [name]
  }

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
      -e API_HOST=${aws_lb.backend_alb.dns_name} \
      -e API_PORT=80 \
      -e API_PROTOCOL=http \
      -e API_BASE_URL=http://${aws_lb.backend_alb.dns_name}/api \
      -e PORT=3000 \
      -e STORAGE_TYPE=s3 \
      -e STORAGE_PATH=./uploads/agendamentos \
      -e SAVE_TO_SERVER=true \
      -e ACESS_KEY_S3=${aws_iam_access_key.s3_user_access_key.id} \
      -e ACESS_SECRET_KEY=${aws_iam_access_key.s3_user_access_key.secret} \
      -e S3_BUCKET_NAME=${aws_s3_bucket.meu_bucket_s3.id} \
      -e S3_BUCKET_ENDPOINT=${aws_s3_bucket.meu_bucket_s3.bucket_regional_domain_name} \
      -e S3_REGION=${var.REGION} \
      -e API_GATEWAY=${aws_apigatewayv2_api.api_gw.api_endpoint}/hello \
      leonardorennerdev/barbearia-frontend
    
    echo "Container do frontend iniciado com sucesso!"
  EOF

  # Depende da criação do bucket, ECS service e API Gateway
  depends_on = [
    aws_s3_bucket.meu_bucket_s3,
    aws_ecs_service.backend_service,
    aws_apigatewayv2_api.api_gw,
    aws_iam_access_key.s3_user_access_key
  ]

  tags = {
    Name = "barbearia-frontend-ec2"
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

# --- Security Groups ---
# Security Group para RDS
resource "aws_security_group" "rds_sg" {
  name        = "rds-sg"
  description = "Security group for RDS database"
  vpc_id      = data.aws_vpc.default.id

  # PostgreSQL
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id, aws_security_group.frontend_sg.id]
    description     = "PostgreSQL from ECS and EC2"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "rds-security-group"
  }
}

# Security Group para ECS
resource "aws_security_group" "ecs_sg" {
  name        = "ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  # HTTP
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "ecs-security-group"
  }
}

# --- RDS Database (substitui Lightsail Database) ---
resource "aws_db_instance" "barbearia_db" {
  identifier     = "barbearia-db"
  engine         = "postgres"
  engine_version = "16.4"  # Versão estável do PostgreSQL disponível no RDS
  instance_class = "db.t3.micro" # Free tier elegível
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "barbearia"
  username = "barbearia_user"
  password = var.DB_PASSWORD

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  publicly_accessible = true
  skip_final_snapshot = true

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "barbearia-database"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "barbearia-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "barbearia-db-subnet-group"
  }
}

# --- ECS Fargate (substitui Lightsail Container Service) ---
# ECS Cluster
resource "aws_ecs_cluster" "backend_cluster" {
  name = "backend-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "backend-cluster"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend_task" {
  family                   = "backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"  # 0.25 vCPU
  memory                   = "512"  # 512 MB
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name  = "meu-back"
    image = "leonardorennerdev/p2cloud"

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "SPRING_APPLICATION_NAME"
        value = "p2Cloud"
      },
      {
        name  = "SPRING_DATASOURCE_URL"
        value = "jdbc:postgresql://${aws_db_instance.barbearia_db.endpoint}/${aws_db_instance.barbearia_db.db_name}"
      },
      {
        name  = "SPRING_DATASOURCE_USERNAME"
        value = aws_db_instance.barbearia_db.username
      },
      {
        name  = "SPRING_DATASOURCE_PASSWORD"
        value = var.DB_PASSWORD
      },
      {
        name  = "SPRING_DATASOURCE_DRIVER"
        value = "org.postgresql.Driver"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
        "awslogs-region"        = var.REGION
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "backend-task"
  }
}

# CloudWatch Log Group para ECS
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/backend-task"
  retention_in_days = 7

  tags = {
    Name = "ecs-backend-logs"
  }
}

# IAM Role para ECS Execution (permite pull de imagens, logs, etc)
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role para ECS Task (permite acesso a outros serviços AWS)
resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Application Load Balancer para ECS
resource "aws_lb" "backend_alb" {
  name               = "backend-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = data.aws_subnets.default.ids

  enable_deletion_protection = false

  tags = {
    Name = "backend-alb"
  }
}

# Security Group para ALB
resource "aws_security_group" "alb_sg" {
  name        = "alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "alb-security-group"
  }
}

# Target Group para ECS
resource "aws_lb_target_group" "backend_tg" {
  name        = "backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = {
    Name = "backend-target-group"
  }
}

# Listener do ALB
resource "aws_lb_listener" "backend_listener" {
  load_balancer_arn = aws_lb.backend_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }
}

# Nota: ALB não suporta adicionar headers CORS diretamente nas respostas
# A solução correta é configurar CORS no Spring Boot (veja arquivo cors-spring-boot-config.java)

# ECS Service
resource "aws_ecs_service" "backend_service" {
  name            = "backend-service"
  cluster         = aws_ecs_cluster.backend_cluster.id
  task_definition = aws_ecs_task_definition.backend_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend_tg.arn
    container_name   = "meu-back"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.backend_listener,
    aws_iam_role_policy_attachment.ecs_execution_role_policy
  ]

  tags = {
    Name = "backend-service"
  }
}

# --- S3 Bucket (substitui Lightsail Bucket) ---
resource "aws_s3_bucket" "meu_bucket_s3" {
  bucket = "meu-bucket-barbearia-app-${var.REGION}"

  tags = {
    Name = "meu-bucket-barbearia-app"
  }
}

# Versionamento do S3
resource "aws_s3_bucket_versioning" "meu_bucket_s3_versioning" {
  bucket = aws_s3_bucket.meu_bucket_s3.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CORS Configuration
resource "aws_s3_bucket_cors_configuration" "meu_bucket_s3_cors" {
  bucket = aws_s3_bucket.meu_bucket_s3.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Bucket Policy para permitir acesso do IAM User e leitura pública
resource "aws_s3_bucket_policy" "meu_bucket_s3_policy" {
  bucket = aws_s3_bucket.meu_bucket_s3.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowIAMUserAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_user.s3_user.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.meu_bucket_s3.arn,
          "${aws_s3_bucket.meu_bucket_s3.arn}/*"
        ]
      },
      {
        Sid    = "AllowPublicReadAccess"
        Effect = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "${aws_s3_bucket.meu_bucket_s3.arn}/*"
        ]
      }
    ]
  })
}

# Public Access Block (desabilitado para permitir uploads via frontend)
# Nota: Uploads autenticados funcionam mesmo com Public Access Block ativado
# Mas vamos desabilitar para compatibilidade com o comportamento do Lightsail
resource "aws_s3_bucket_public_access_block" "meu_bucket_s3_pab" {
  bucket = aws_s3_bucket.meu_bucket_s3.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# --- IAM User e Access Keys para S3 ---
resource "aws_iam_user" "s3_user" {
  name = "s3-bucket-user"

  tags = {
    Name = "s3-bucket-user"
  }
}

# Policy para acesso ao S3 (com permissões completas)
resource "aws_iam_user_policy" "s3_user_policy" {
  name = "s3-bucket-access-policy"
  user = aws_iam_user.s3_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutObjectAcl",
        "s3:GetObjectAcl",
        "s3:ListBucketMultipartUploads",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ]
      Resource = [
        aws_s3_bucket.meu_bucket_s3.arn,
        "${aws_s3_bucket.meu_bucket_s3.arn}/*"
      ]
    }]
  })
}

# Access Key para o usuário S3
resource "aws_iam_access_key" "s3_user_access_key" {
  user = aws_iam_user.s3_user.name
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

# 8.1. Policy para acesso ao S3 (Bucket S3 padrão)
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
        aws_s3_bucket.meu_bucket_s3.arn,
        "${aws_s3_bucket.meu_bucket_s3.arn}/*"
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
  
  # Variáveis de ambiente para acesso ao S3 (Bucket S3 padrão)
  environment {
    variables = {
      ACESS_KEY_S3       = aws_iam_access_key.s3_user_access_key.id
      ACESS_SECRET_KEY   = aws_iam_access_key.s3_user_access_key.secret
      S3_REGION          = var.REGION
      S3_BUCKET_NAME     = aws_s3_bucket.meu_bucket_s3.id
      S3_BUCKET_ENDPOINT = aws_s3_bucket.meu_bucket_s3.bucket_regional_domain_name
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

# --- Outputs ---
# API Gateway
output "api_gateway_url" {
  description = "URL do API Gateway"
  value       = "${aws_apigatewayv2_api.api_gw.api_endpoint}/hello"
}

# RDS Database
output "database_endpoint" {
  description = "Endpoint do banco de dados RDS"
  value       = "${aws_db_instance.barbearia_db.address}:${aws_db_instance.barbearia_db.port}"
}

output "database_connection_string" {
  description = "String de conexão JDBC para o banco de dados"
  value       = "jdbc:postgresql://${aws_db_instance.barbearia_db.address}:${aws_db_instance.barbearia_db.port}/${aws_db_instance.barbearia_db.db_name}"
  sensitive   = false
}

output "database_info" {
  description = "Informações do banco de dados RDS"
  value = {
    identifier     = aws_db_instance.barbearia_db.identifier
    endpoint       = aws_db_instance.barbearia_db.endpoint
    address        = aws_db_instance.barbearia_db.address
    port           = aws_db_instance.barbearia_db.port
    db_name        = aws_db_instance.barbearia_db.db_name
    username       = aws_db_instance.barbearia_db.username
    engine         = aws_db_instance.barbearia_db.engine
    engine_version = aws_db_instance.barbearia_db.engine_version
    instance_class = aws_db_instance.barbearia_db.instance_class
  }
}

# ECS Fargate
output "ecs_cluster_name" {
  description = "Nome do cluster ECS"
  value       = aws_ecs_cluster.backend_cluster.name
}

output "ecs_service_name" {
  description = "Nome do serviço ECS"
  value       = aws_ecs_service.backend_service.name
}

output "backend_alb_url" {
  description = "URL do Application Load Balancer (Backend)"
  value       = "http://${aws_lb.backend_alb.dns_name}"
}

output "backend_alb_dns" {
  description = "DNS do Application Load Balancer (Backend)"
  value       = aws_lb.backend_alb.dns_name
}

output "container_service_info" {
  description = "Informações do serviço de container ECS"
  value = {
    cluster_name = aws_ecs_cluster.backend_cluster.name
    service_name = aws_ecs_service.backend_service.name
    task_family  = aws_ecs_task_definition.backend_task.family
    alb_url      = "http://${aws_lb.backend_alb.dns_name}"
    alb_dns      = aws_lb.backend_alb.dns_name
    log_group    = aws_cloudwatch_log_group.ecs_logs.name
  }
}

# S3 Bucket
output "bucket_name" {
  description = "Nome do bucket S3"
  value       = aws_s3_bucket.meu_bucket_s3.id
}

output "bucket_arn" {
  description = "ARN do bucket S3"
  value       = aws_s3_bucket.meu_bucket_s3.arn
}

output "bucket_domain_name" {
  description = "Nome de domínio do bucket S3"
  value       = aws_s3_bucket.meu_bucket_s3.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Nome de domínio regional do bucket S3"
  value       = aws_s3_bucket.meu_bucket_s3.bucket_regional_domain_name
}

output "s3_access_key_id" {
  description = "ID da chave de acesso do S3 (para uso no EC2)"
  value       = aws_iam_access_key.s3_user_access_key.id
  sensitive   = false
}

output "s3_secret_access_key" {
  description = "Chave secreta de acesso do S3 (para uso no EC2)"
  value       = aws_iam_access_key.s3_user_access_key.secret
  sensitive   = true
}

output "bucket_info" {
  description = "Informações completas do bucket S3"
  value = {
    bucket_name              = aws_s3_bucket.meu_bucket_s3.id
    bucket_arn               = aws_s3_bucket.meu_bucket_s3.arn
    bucket_domain_name       = aws_s3_bucket.meu_bucket_s3.bucket_domain_name
    bucket_regional_domain   = aws_s3_bucket.meu_bucket_s3.bucket_regional_domain_name
    region                   = var.REGION
    access_key_id            = aws_iam_access_key.s3_user_access_key.id
    iam_user_name            = aws_iam_user.s3_user.name
    note                     = "As chaves de acesso são criadas automaticamente. Use os outputs s3_access_key_id e s3_secret_access_key."
  }
}

# Resumo Geral
output "infrastructure_summary" {
  description = "Resumo completo da infraestrutura"
  value = {
    region = var.REGION
    
    ec2 = {
      instance_id = aws_instance.frontend_ec2.id
      public_ip   = aws_instance.frontend_ec2.public_ip
      public_dns  = aws_instance.frontend_ec2.public_dns
      ssh_command = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.frontend_ec2.public_ip}"
    }
    
    database = {
      endpoint           = "${aws_db_instance.barbearia_db.address}:${aws_db_instance.barbearia_db.port}"
      connection_string  = "jdbc:postgresql://${aws_db_instance.barbearia_db.address}:${aws_db_instance.barbearia_db.port}/${aws_db_instance.barbearia_db.db_name}"
      identifier         = aws_db_instance.barbearia_db.identifier
    }
    
    backend = {
      cluster_name = aws_ecs_cluster.backend_cluster.name
      service_name = aws_ecs_service.backend_service.name
      alb_url      = "http://${aws_lb.backend_alb.dns_name}"
      alb_dns      = aws_lb.backend_alb.dns_name
    }
    
    s3 = {
      bucket_name            = aws_s3_bucket.meu_bucket_s3.id
      bucket_regional_domain = aws_s3_bucket.meu_bucket_s3.bucket_regional_domain_name
      access_key_id          = aws_iam_access_key.s3_user_access_key.id
    }
    
    api_gateway = {
      url = "${aws_apigatewayv2_api.api_gw.api_endpoint}/hello"
    }
  }
}