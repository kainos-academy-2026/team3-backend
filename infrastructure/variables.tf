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
