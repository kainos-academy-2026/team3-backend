output "server_fqdn" {
  description = "The fully qualified domain name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.postgres.fqdn
}

output "server_name" {
  description = "The name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.postgres.name
}

output "db_name" {
  description = "The name of the created database"
  value       = azurerm_postgresql_flexible_server_database.db.name
}
