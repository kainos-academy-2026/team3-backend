variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "team3-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "UK South"
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be dev, test, or prod."
  }
}

variable "key_vault_name" {
  description = "Name of the Azure Key Vault (must be globally unique, max 24 chars)"
  type        = string
  default     = "team3-kv-dev"
}

variable "identity_name" {
  description = "Name of the user-assigned managed identity"
  type        = string
  default     = "team3-app-identity"
}

variable "db_server_name" {
  description = "Globally unique name for the PostgreSQL Flexible Server"
  type        = string
  default     = "team3-postgres-dev"
}

variable "db_admin_login" {
  description = "Administrator username for the PostgreSQL server"
  type        = string
  default     = "team3admin"
}

variable "db_admin_password" {
  description = "Administrator password for the PostgreSQL server"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "team3"
}

variable "allowed_ip_addresses" {
  description = "Map of label => IP address to whitelist on the server firewall"
  type        = map(string)
  default     = {}
}
