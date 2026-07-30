# Azure Key Vault — an empty, access-controlled secrets store.
#
# Per the task brief, we do NOT define secret *values* here. This file only
# creates the vault itself (Part A). Real values (DATABASE_URL, JWT_SECRET)
# are added manually via the Azure Portal after `terraform apply`, so
# nothing sensitive ever ends up in this repo or in Terraform state.

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  # Fixed name (not random) so it matches the vault the team is already using
  # (team3-kv-dev) and stays stable across applies/team members sharing state.
  name                = "team3-kv-${var.environment}"
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # RBAC mode: access is granted via azurerm_role_assignment (Part D),
  # not legacy Key Vault access policies.
  rbac_authorization_enabled = true

  tags = {
    Project     = "team3-backend"
    Environment = var.environment
  }
}

