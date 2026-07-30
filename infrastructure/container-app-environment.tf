# Container App Environment — the shared "land" both apps run on.
#
# Apps inside the same environment can reach each other over Azure's
# private internal network, which is how the backend can stay non-public
# while the frontend still talks to it.

resource "azurerm_log_analytics_workspace" "main" {
  name                = "team3-logs"
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.location
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Project     = "team3-backend"
    Environment = var.environment
  }
}

resource "azurerm_container_app_environment" "main" {
  name                       = "team3-container-env"
  resource_group_name        = module.resource_group.resource_group_name
  location                   = module.resource_group.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Project     = "team3-backend"
    Environment = var.environment
  }
}
