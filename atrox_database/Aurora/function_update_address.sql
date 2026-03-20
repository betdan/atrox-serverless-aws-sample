CREATE OR REPLACE FUNCTION update_address(
    p_id INT,
    p_client_id INT,
    p_type_id INT,
    p_value VARCHAR,
    p_status INT,
    p_is_primary BOOLEAN
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5601, 'Address id is required';
        RETURN;
    END IF;

    IF p_client_id IS NULL THEN
        RETURN QUERY SELECT 5602, 'Client id is required';
        RETURN;
    END IF;

    IF p_type_id IS NULL THEN
        RETURN QUERY SELECT 5603, 'Address type id is required';
        RETURN;
    END IF;

    IF p_value IS NULL OR BTRIM(p_value) = '' THEN
        RETURN QUERY SELECT 5604, 'Address value is required';
        RETURN;
    END IF;

    IF p_status IS NULL THEN
        RETURN QUERY SELECT 5605, 'Address status is required';
        RETURN;
    END IF;

    IF p_is_primary IS NULL THEN
        RETURN QUERY SELECT 5606, 'Address primary flag is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM address
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5607, 'Address does not exist';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM client
        WHERE id = p_client_id
    ) THEN
        RETURN QUERY SELECT 5608, 'Client does not exist';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM catalog c
        INNER JOIN entity e ON e.id = c.entity_id
        WHERE c.id = p_type_id
          AND UPPER(e.name) = 'ADDRESS_TYPE'
          AND c.status <> 0
          AND e.status <> 0
    ) THEN
        RETURN QUERY SELECT 5609, 'Address type is invalid';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM address
        WHERE id <> p_id
          AND client_id = p_client_id
          AND type_id = p_type_id
          AND UPPER(value) = UPPER(BTRIM(p_value))
          AND status <> 0
    ) THEN
        RETURN QUERY SELECT 5610, 'Address already exists for the client';
        RETURN;
    END IF;

    IF p_is_primary = TRUE
       AND p_status <> 0
       AND EXISTS (
            SELECT 1
            FROM address
            WHERE id <> p_id
              AND client_id = p_client_id
              AND is_primary = TRUE
              AND status <> 0
        ) THEN
        RETURN QUERY SELECT 5611, 'Client already has a primary address';
        RETURN;
    END IF;

    UPDATE address
    SET client_id = p_client_id,
        type_id = p_type_id,
        value = BTRIM(p_value),
        status = p_status,
        is_primary = CASE WHEN p_status = 0 THEN FALSE ELSE p_is_primary END
    WHERE id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
