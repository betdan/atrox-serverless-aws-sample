CREATE TABLE IF NOT EXISTS client (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    document_number VARCHAR NOT NULL,
    status INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_client_document_number'
          AND conrelid = 'client'::regclass
    ) THEN
        ALTER TABLE client
            ADD CONSTRAINT uq_client_document_number UNIQUE (document_number);
    END IF;
END;
$$;
