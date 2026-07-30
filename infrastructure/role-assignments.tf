# Role Assignments — explicitly unlocking only the doors each identity needs.
#
# Nothing is accessible by default. Each identity gets exactly the roles it
# requires, scoped to a single resource (not the whole subscription).

data "azurerm_container_registry" "main" {
  name                = "acraiacademy26"
  resource_group_name = "rg-ai-academy-26"
}

# --- ACR pull access: both apps need to pull their own image ---

resource "azurerm_role_assignment" "backend_acr_pull" {
  scope                = data.azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id

  depends_on = [azurerm_user_assigned_identity.backend]
}

resource "azurerm_role_assignment" "frontend_acr_pull" {
  scope                = data.azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.frontend.principal_id

  depends_on = [azurerm_user_assigned_identity.frontend]
}

# --- Key Vault secrets access: backend only, frontend has no need ---

resource "azurerm_role_assignment" "backend_key_vault_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id

  depends_on = [
    azurerm_user_assigned_identity.backend,
    azurerm_key_vault.main,
  ]
}
