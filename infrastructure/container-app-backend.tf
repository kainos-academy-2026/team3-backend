# Backend Container App — internal-only ingress, no public URL.
#
# Only the frontend (inside the same Container App Environment) can reach
# this over Azure's private network. Secrets are pulled from Key Vault at
# runtime via the backend Managed Identity; nothing sensitive is hardcoded
# here or stored in Terraform state.
#
# NOTE: the Key Vault secret *names* below (database-url, jwt-secret, etc.)
# must be created manually in the Azure Portal after `apply` (Part A) —
# Key Vault secret names use kebab-case, not the UPPER_SNAKE_CASE used by
# the app's environment variables.

resource "azurerm_container_app" "backend" {
  name                         = "team3-backend"
  resource_group_name          = module.resource_group.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.backend.id]
  }

  registry {
    server   = data.azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.backend.id
  }

  ingress {
    external_enabled = false # internal-only: no public IP, reachable only within the Container App Environment
    target_port      = 4000  # matches PORT default in src/index.ts
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    container {
      name   = "team3-backend"
      image  = "${data.azurerm_container_registry.main.login_server}/team3-backend:${var.backend_image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      # Plain (non-secret) environment variables
      env {
        name  = "PORT"
        value = "4000"
      }
      env {
        name  = "AWS_REGION"
        value = "us-east-1"
      }
      env {
        name  = "S3_BUCKET_NAME"
        value = "academy-test-team3-067502745215"
      }
      env {
        name  = "FEATURE_NEW_DASHBOARD_ENABLED"
        value = tostring(var.feature_new_dashboard_enabled)
      }

      # Secret-backed environment variables (values live only in Key Vault)
      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
      env {
        name        = "AWS_ACCESS_KEY_ID"
        secret_name = "aws-access-key-id"
      }
      env {
        name        = "AWS_SECRET_ACCESS_KEY"
        secret_name = "aws-secret-access-key"
      }
    }
  }

  secret {
    name                = "database-url"
    key_vault_secret_id = "${azurerm_key_vault.main.vault_uri}secrets/database-url"
    identity            = azurerm_user_assigned_identity.backend.id
  }

  secret {
    name                = "jwt-secret"
    key_vault_secret_id = "${azurerm_key_vault.main.vault_uri}secrets/jwt-secret"
    identity            = azurerm_user_assigned_identity.backend.id
  }

  secret {
    name                = "aws-access-key-id"
    key_vault_secret_id = "${azurerm_key_vault.main.vault_uri}secrets/aws-access-key-id"
    identity            = azurerm_user_assigned_identity.backend.id
  }

  secret {
    name                = "aws-secret-access-key"
    key_vault_secret_id = "${azurerm_key_vault.main.vault_uri}secrets/aws-secret-access-key"
    identity            = azurerm_user_assigned_identity.backend.id
  }

  tags = {
    Project     = "team3-backend"
    Environment = var.environment
    App         = "backend"
  }

  depends_on = [
    azurerm_role_assignment.backend_acr_pull,
    azurerm_role_assignment.backend_key_vault_secrets_user,
  ]
}
