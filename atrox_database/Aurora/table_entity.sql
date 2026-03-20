CREATE TABLE IF NOT EXISTS entity (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    status INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_entity_name'
          AND conrelid = 'entity'::regclass
    ) THEN
        ALTER TABLE entity
            ADD CONSTRAINT uq_entity_name UNIQUE (name);
    END IF;
END;
$$;
