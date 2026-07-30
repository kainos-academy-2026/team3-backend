terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

module "resource_group" {
  source = "./modules/resource-group"

  resource_group_name = var.resource_group_name
  location            = var.location
  environment         = var.environment

  tags = {
    Project = "team3-backend"
  }
}

resource "azurerm_key_vault" "main" {
  name                       = var.key_vault_name
  location                   = module.resource_group.location
  resource_group_name        = module.resource_group.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = false
  rbac_authorization_enabled = true
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "team3-logs"
  location            = module.resource_group.location
  resource_group_name = module.resource_group.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "main" {
  name                       = "team3-container-env"
  location                   = module.resource_group.location
  resource_group_name        = module.resource_group.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

resource "azurerm_user_assigned_identity" "main" {
  name                = var.identity_name
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.location
}

data "azurerm_container_registry" "acr" {
  name                = "acraiacademy26"
  resource_group_name = "rg-ai-academy-26"
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = data.azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

resource "azurerm_role_assignment" "kv_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

resource "azurerm_container_app" "backend" {
  name                         = "team3-backend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = module.resource_group.resource_group_name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.main.id]
  }

  registry {
    server   = data.azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.main.id
  }

  ingress {
    external_enabled = false
    target_port      = 4000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    container {
      name   = "backend"
      image  = "${data.azurerm_container_registry.acr.login_server}/team3-backend:dev-latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name        = "AWS_ACCESS_KEY_ID"
        secret_name = "aws-access-key-id"
      }
      env {
        name        = "AWS_SECRET_ACCESS_KEY"
        secret_name = "aws-secret-access-key"
      }
      env {
        name        = "AWS_REGION"
        secret_name = "aws-region"
      }
      env {
        name        = "S3_BUCKET_NAME"
        secret_name = "s3-bucket-name"
      }
    }
  }

  secret {
    name                = "database-url"
    key_vault_secret_id = "https://team3-kv-dev.vault.azure.net/secrets/DATABASE-URL/5883d359d85c48e5b476e3a432d45100"
    identity            = azurerm_user_assigned_identity.main.id
  }

  secret {
    name                = "jwt-secret"
    key_vault_secret_id = "https://team3-kv-dev.vault.azure.net/secrets/JWT-SECRET/9c8fbb25a6e9445cac774f7a8b36cd86"
    identity            = azurerm_user_assigned_identity.main.id
  }

  secret {
    name                = "aws-access-key-id"
    key_vault_secret_id = "https://team3-kv-dev.vault.azure.net/secrets/AWS-ACCESS-KEY-ID/b90ddfaba8ff482f8873a8c934a9bbb1"
    identity            = azurerm_user_assigned_identity.main.id
  }

  secret {
    name                = "aws-secret-access-key"
    key_vault_secret_id = "https://team3-kv-dev.vault.azure.net/secrets/AWS-SECRET-ACCESS-KEY/eccd551176634b2082190a31149a7b2f"
    identity            = azurerm_user_assigned_identity.main.id
  }

  secret {
    name                = "aws-region"
    key_vault_secret_id = "https://team3-kv-dev.vault.azure.net/secrets/AWS-REGION/e080012fb989468e92fc926cfa255e7a"
    identity            = azurerm_user_assigned_identity.main.id
  }

  secret {
    name                = "s3-bucket-name"
    key_vault_secret_id = "https://team3-kv-dev.vault.azure.net/secrets/S3-BUCKET-NAME/3163b68946c647518c7b6e15ca67c0c9"
    identity            = azurerm_user_assigned_identity.main.id
  }

  depends_on = [
    azurerm_role_assignment.acr_pull,
    azurerm_role_assignment.kv_secrets_user
  ]
}

module "postgres" {
  source = "./modules/postgres"

  resource_group_name  = module.resource_group.resource_group_name
  location             = var.location
  environment          = var.environment
  server_name          = var.db_server_name
  admin_login          = var.db_admin_login
  admin_password       = var.db_admin_password
  db_name              = var.db_name
  allowed_ip_addresses = var.allowed_ip_addresses

  tags = {
    Project = "team3-backend"
  }
}
