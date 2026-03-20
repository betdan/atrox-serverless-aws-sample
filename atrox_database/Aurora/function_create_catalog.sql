CREATE OR REPLACE FUNCTION create_catalog(
    p_entity_id INT,
    p_value VARCHAR,
    p_status INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_entity_id IS NULL THEN
        RETURN QUERY SELECT 2001, 'Entity id is required';
        RETURN;
    END IF;

    IF p_value IS NULL OR BTRIM(p_value) = '' THEN
        RETURN QUERY SELECT 2002, 'Catalog value is required';
        RETURN;
    END IF;

    IF p_status IS NULL THEN
        RETURN QUERY SELECT 2003, 'Catalog status is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM entity
        WHERE id = p_entity_id
    ) THEN
        RETURN QUERY SELECT 2004, 'Entity does not exist';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM catalog
        WHERE entity_id = p_entity_id
          AND UPPER(value) = UPPER(BTRIM(p_value))
    ) THEN
        RETURN QUERY SELECT 2005, 'Catalog already exists for the entity';
        RETURN;
    END IF;

    INSERT INTO catalog (
        entity_id,
        value,
        status
    )
    VALUES (
        p_entity_id,
        BTRIM(p_value),
        p_status
    );

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
