CREATE OR REPLACE FUNCTION delete_catalog(
    p_id INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL THEN
        RETURN QUERY SELECT 5301, 'Catalog id is required';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM catalog
        WHERE id = p_id
    ) THEN
        RETURN QUERY SELECT 5302, 'Catalog does not exist';
        RETURN;
    END IF;

    UPDATE catalog
    SET status = 0
    WHERE id = p_id;

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
