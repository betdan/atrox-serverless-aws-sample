CREATE OR REPLACE FUNCTION add_address(
    p_client_id INT,
    p_type_id INT,
    p_value VARCHAR,
    p_is_primary BOOLEAN
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_client_id IS NULL THEN
        RETURN QUERY SELECT 4001, 'Client id is required';
        RETURN;
    END IF;

    IF p_type_id IS NULL THEN
        RETURN QUERY SELECT 4002, 'Address type id is required';
        RETURN;
    END IF;

    IF p_value IS NULL OR BTRIM(p_value) = '' THEN
        RETURN QUERY SELECT 4003, 'Address value is required';
        RETURN;
    END IF;

    IF p_is_primary IS NULL THEN
        RETURN QUERY SELECT 4004, 'Address primary flag is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM client
        WHERE id = p_client_id
    ) THEN
        RETURN QUERY SELECT 4005, 'Client does not exist';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM catalog c
        INNER JOIN entity e ON e.id = c.entity_id
        WHERE c.id = p_type_id
          AND UPPER(e.name) = 'ADDRESS_TYPE'
    ) THEN
        RETURN QUERY SELECT 4006, 'Address type is invalid';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM address
        WHERE client_id = p_client_id
          AND type_id = p_type_id
          AND UPPER(value) = UPPER(BTRIM(p_value))
          AND status <> 0
    ) THEN
        RETURN QUERY SELECT 4007, 'Address already exists for the client';
        RETURN;
    END IF;

    IF p_is_primary = TRUE
       AND EXISTS (
            SELECT 1
            FROM address
            WHERE client_id = p_client_id
              AND is_primary = TRUE
              AND status <> 0
        ) THEN
        RETURN QUERY SELECT 4008, 'Client already has a primary address';
        RETURN;
    END IF;

    INSERT INTO address (
        client_id,
        type_id,
        value,
        status,
        is_primary
    )
    VALUES (
        p_client_id,
        p_type_id,
        BTRIM(p_value),
        1,
        p_is_primary
    );

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
