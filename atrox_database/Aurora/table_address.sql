CREATE TABLE IF NOT EXISTS address (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    type_id INT NOT NULL,
    value VARCHAR NOT NULL,
    status INT NOT NULL DEFAULT 1,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'address'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE address
            ADD COLUMN status INT NOT NULL DEFAULT 1;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_address_client'
          AND conrelid = 'address'::regclass
    ) THEN
        ALTER TABLE address
            ADD CONSTRAINT fk_address_client FOREIGN KEY (client_id) REFERENCES client(id);
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_address_catalog'
          AND conrelid = 'address'::regclass
    ) THEN
        ALTER TABLE address
            ADD CONSTRAINT fk_address_catalog FOREIGN KEY (type_id) REFERENCES catalog(id);
    END IF;
END;
$$;
