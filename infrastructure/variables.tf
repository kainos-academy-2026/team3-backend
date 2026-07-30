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

variable "backend_image_tag" {
  description = "Tag of the team3-backend image in ACR to deploy (matches the ci.yml tagging scheme, e.g. dev-<sha> or dev-latest)"
  type        = string
  default     = "dev-latest"
}

variable "feature_new_dashboard_enabled" {
  description = "Example feature flag, exposed to the backend app as a plain (non-secret) environment variable. Toggle and redeploy to turn features on/off without a code change."
  type        = bool
  default     = false
}
