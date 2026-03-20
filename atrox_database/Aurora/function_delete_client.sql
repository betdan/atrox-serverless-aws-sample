CREATE OR REPLACE FUNCTION delete_client(
    p_id INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5501, 'Client id is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM client
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5502, 'Client does not exist';
        RETURN;
    END IF;

    UPDATE client
    SET status = 0
    WHERE id = p_id;

    UPDATE address
    SET status = 0,
        is_primary = FALSE
    WHERE client_id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
