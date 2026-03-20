CREATE OR REPLACE FUNCTION create_entity(
    p_name VARCHAR,
    p_status INT
)
RETURNS TABLE("codeError" INT, "messageError" TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_name IS NULL OR BTRIM(p_name) = '' THEN
        RETURN QUERY SELECT 1001, 'Entity name is required';
        RETURN;
    END IF;

    IF p_status IS NULL THEN
        RETURN QUERY SELECT 1002, 'Entity status is required';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM entity
        WHERE UPPER(name) = UPPER(BTRIM(p_name))
    ) THEN
        RETURN QUERY SELECT 1003, 'Entity already exists';
        RETURN;
    END IF;

    INSERT INTO entity (
        name,
        status
    )
    VALUES (
        BTRIM(p_name),
        p_status
    );

    RETURN QUERY SELECT 0, 'Successful';
END;
$$;
