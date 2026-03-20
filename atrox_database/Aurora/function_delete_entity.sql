CREATE OR REPLACE FUNCTION delete_entity(
    p_id INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5101, 'Entity id is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM entity
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5102, 'Entity does not exist';
        RETURN;
    END IF;

    UPDATE entity
    SET status = 0
    WHERE id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
