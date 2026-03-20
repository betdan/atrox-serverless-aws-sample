CREATE OR REPLACE FUNCTION update_catalog(
    p_id INT,
    p_entity_id INT,
    p_value VARCHAR,
    p_status INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5201, 'Catalog id is required';
        RETURN;
    END IF;

    IF p_entity_id IS NULL THEN
        RETURN QUERY SELECT 5202, 'Entity id is required';
        RETURN;
    END IF;

    IF p_value IS NULL OR BTRIM(p_value) = '' THEN
        RETURN QUERY SELECT 5203, 'Catalog value is required';
        RETURN;
    END IF;

    IF p_status IS NULL THEN
        RETURN QUERY SELECT 5204, 'Catalog status is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM catalog
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5205, 'Catalog does not exist';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM entity
        WHERE id = p_entity_id
    ) THEN
        RETURN QUERY SELECT 5206, 'Entity does not exist';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM catalog
        WHERE id <> p_id
          AND entity_id = p_entity_id
          AND UPPER(value) = UPPER(BTRIM(p_value))
    ) THEN
        RETURN QUERY SELECT 5207, 'Catalog already exists for the entity';
        RETURN;
    END IF;

    UPDATE catalog
    SET entity_id = p_entity_id,
        value = BTRIM(p_value),
        status = p_status
    WHERE id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
