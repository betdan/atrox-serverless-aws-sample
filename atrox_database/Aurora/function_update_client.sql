CREATE OR REPLACE FUNCTION update_client(
    p_id INT,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_document_number VARCHAR,
    p_status INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5401, 'Client id is required';
        RETURN;
    END IF;

    IF p_first_name IS NULL OR BTRIM(p_first_name) = '' THEN
        RETURN QUERY SELECT 5402, 'Client first name is required';
        RETURN;
    END IF;

    IF p_last_name IS NULL OR BTRIM(p_last_name) = '' THEN
        RETURN QUERY SELECT 5403, 'Client last name is required';
        RETURN;
    END IF;

    IF p_document_number IS NULL OR BTRIM(p_document_number) = '' THEN
        RETURN QUERY SELECT 5404, 'Client document number is required';
        RETURN;
    END IF;

    IF p_status IS NULL THEN
        RETURN QUERY SELECT 5405, 'Client status is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM client
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5406, 'Client does not exist';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM client
        WHERE id <> p_id
          AND UPPER(document_number) = UPPER(BTRIM(p_document_number))
    ) THEN
        RETURN QUERY SELECT 5407, 'Client document number already exists';
        RETURN;
    END IF;

    UPDATE client
    SET first_name = BTRIM(p_first_name),
        last_name = BTRIM(p_last_name),
        document_number = BTRIM(p_document_number),
        status = p_status
    WHERE id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
