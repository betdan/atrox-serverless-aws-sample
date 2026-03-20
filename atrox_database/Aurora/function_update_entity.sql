CREATE OR REPLACE FUNCTION update_entity(
    p_id INT,
    p_name VARCHAR,
    p_status INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5001, 'Entity id is required';
        RETURN;
    END IF;

    IF p_name IS NULL OR BTRIM(p_name) = '' THEN
        RETURN QUERY SELECT 5002, 'Entity name is required';
        RETURN;
    END IF;

    IF p_status IS NULL THEN
        RETURN QUERY SELECT 5003, 'Entity status is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM entity
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5004, 'Entity does not exist';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM entity
        WHERE id <> p_id
          AND UPPER(name) = UPPER(BTRIM(p_name))
    ) THEN
        RETURN QUERY SELECT 5005, 'Entity name already exists';
        RETURN;
    END IF;

    UPDATE entity
    SET name = BTRIM(p_name),
        status = p_status
    WHERE id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
