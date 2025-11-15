variable "REGION" {
  description = "A região da AWS (ex: us-east-1). Correspondente a TF_VAR_REGION."
  type        = string
}

variable "ACCESS_KEY" {
  description = "Chave de acesso da AWS. Correspondente a TF_VAR_ACCESS_KEY."
  type        = string
}

variable "SECRET_KEY" {
  description = "Chave secreta da AWS. Correspondente a TF_VAR_SECRET_KEY."
  type        = string
  sensitive   = true # Marca como sensível para não aparecer em logs
}

variable "PUBLIC_KEY_CONTENT" {
  description = "Conteúdo da chave pública SSH para a instância Lightsail. Correspondente a TF_VAR_PUBLIC_KEY_CONTENT."
  type        = string
}

variable "DB_PASSWORD" {
  description = "Senha mestra para o banco de dados Lightsail."
  type        = string
  default     = "senha123"
  sensitive   = true
}

variable "BUCKET_ACCESS_KEY_ID" {
  description = "ID da chave de acesso do bucket Lightsail. Crie via AWS CLI: aws lightsail create-bucket-access-key --bucket-name meu-bucket-barbearia-app"
  type        = string
  default     = ""
  sensitive   = false
}

variable "BUCKET_SECRET_ACCESS_KEY" {
  description = "Chave secreta de acesso do bucket Lightsail. Obtida ao criar a access key."
  type        = string
  default     = ""
  sensitive   = true
}