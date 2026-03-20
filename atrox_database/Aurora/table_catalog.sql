CREATE TABLE IF NOT EXISTS catalog (
    id SERIAL PRIMARY KEY,
    entity_id INT NOT NULL,
    value VARCHAR NOT NULL,
    status INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_catalog_entity'
          AND conrelid = 'catalog'::regclass
    ) THEN
        ALTER TABLE catalog
            ADD CONSTRAINT fk_catalog_entity FOREIGN KEY (entity_id) REFERENCES entity(id);
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_catalog_entity_value'
          AND conrelid = 'catalog'::regclass
    ) THEN
        ALTER TABLE catalog
            ADD CONSTRAINT uq_catalog_entity_value UNIQUE (entity_id, value);
    END IF;
END;
$$;
