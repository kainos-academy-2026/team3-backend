terraform {
  # Partial backend configuration: no environment-specific values are
  # hardcoded here (Terraform backend blocks can't reference variables,
  # so this is the standard way to keep this file environment-agnostic).
  # Actual values (resource group, storage account, container, and state
  # file key) are supplied at `terraform init` time via -backend-config,
  # sourced from a per-environment .hcl file (see backend-dev.hcl) or
  # equivalent CI variables. This lets "dev" and a future "prod" reuse
  # this exact file with completely separate state, just by pointing
  # init at a different backend config.
  backend "azurerm" {}
}
