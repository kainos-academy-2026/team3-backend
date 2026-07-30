output "resource_group_name" {
  description = "The name of the resource group"
  value       = module.resource_group.resource_group_name
}

output "resource_group_id" {
  description = "The ID of the resource group"
  value       = module.resource_group.resource_group_id
}

output "location" {
  description = "The location of the resource group"
  value       = module.resource_group.location
}

output "key_vault_name" {
  description = "The name of the Key Vault (add secret values manually in the Azure Portal)"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "The URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "backend_identity_id" {
  description = "Resource ID of the backend's User Assigned Managed Identity"
  value       = azurerm_user_assigned_identity.backend.id
}

output "backend_identity_principal_id" {
  description = "Principal (object) ID of the backend identity, used for role assignments"
  value       = azurerm_user_assigned_identity.backend.principal_id
}

output "frontend_identity_id" {
  description = "Resource ID of the frontend's User Assigned Managed Identity"
  value       = azurerm_user_assigned_identity.frontend.id
}

output "frontend_identity_principal_id" {
  description = "Principal (object) ID of the frontend identity, used for role assignments"
  value       = azurerm_user_assigned_identity.frontend.principal_id
}

output "container_app_environment_id" {
  description = "Resource ID of the Container App Environment, referenced by both frontend and backend Container Apps"
  value       = azurerm_container_app_environment.main.id
}

output "container_app_environment_default_domain" {
  description = "Default domain of the Container App Environment"
  value       = azurerm_container_app_environment.main.default_domain
}

# --- Outputs for the frontend repo (team3-frontend) to consume via a
#     terraform_remote_state data source ---

output "acr_login_server" {
  description = "Login server of the shared ACR, for the frontend's image reference"
  value       = data.azurerm_container_registry.main.login_server
}

output "backend_internal_fqdn" {
  description = "Internal-only FQDN of the backend Container App. Set as BACKEND_API on the frontend Container App."
  value       = azurerm_container_app.backend.ingress[0].fqdn
}
