CREATE UNIQUE INDEX IF NOT EXISTS ux_address_client_primary
ON address (client_id)
WHERE is_primary = TRUE;
