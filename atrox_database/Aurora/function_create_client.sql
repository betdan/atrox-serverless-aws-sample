CREATE OR REPLACE FUNCTION create_client(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_document_number VARCHAR,
    p_status INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_first_name IS NULL OR BTRIM(p_first_name) = '' THEN
        RETURN QUERY SELECT 3001, 'Client first name is required';
        RETURN;
    END IF;

    IF p_last_name IS NULL OR BTRIM(p_last_name) = '' THEN
        RETURN QUERY SELECT 3002, 'Client last name is required';
        RETURN;
    END IF;

    IF p_document_number IS NULL OR BTRIM(p_document_number) = '' THEN
        RETURN QUERY SELECT 3003, 'Client document number is required';
        RETURN;
    END IF;

    IF p_status IS NULL THEN
        RETURN QUERY SELECT 3004, 'Client status is required';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM client
        WHERE UPPER(document_number) = UPPER(BTRIM(p_document_number))
    ) THEN
        RETURN QUERY SELECT 3005, 'Client already exists';
        RETURN;
    END IF;

    INSERT INTO client (
        first_name,
        last_name,
        document_number,
        status
    )
    VALUES (
        BTRIM(p_first_name),
        BTRIM(p_last_name),
        BTRIM(p_document_number),
        p_status
    );

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
