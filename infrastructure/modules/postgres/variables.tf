variable "resource_group_name" {
  description = "Name of the Azure resource group to deploy into"
  type        = string
}

variable "location" {
  description = "Azure region"
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

variable "server_name" {
  description = "Unique name for the PostgreSQL Flexible Server (must be globally unique in Azure)"
  type        = string
}

variable "admin_login" {
  description = "Administrator username for the PostgreSQL server"
  type        = string
}

variable "admin_password" {
  description = "Administrator password for the PostgreSQL server"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.admin_password) >= 8
    error_message = "Admin password must be at least 8 characters."
  }
}

variable "db_name" {
  description = "Name of the initial database to create on the server"
  type        = string
  default     = "team3"
}

variable "allowed_ip_addresses" {
  description = "Map of friendly name to IP address allowed through the server firewall"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
