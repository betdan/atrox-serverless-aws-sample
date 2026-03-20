CREATE OR REPLACE FUNCTION delete_address(
    p_id INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5701, 'Address id is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM address
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5702, 'Address does not exist';
        RETURN;
    END IF;

    UPDATE address
    SET status = 0,
        is_primary = FALSE
    WHERE id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
