INSERT INTO entity (
    name,
    status
)
SELECT
    'CLIENT_STATUS',
    1
WHERE NOT EXISTS (
    SELECT 1
    FROM entity
    WHERE UPPER(name) = 'CLIENT_STATUS'
);

INSERT INTO entity (
    name,
    status
)
SELECT
    'ADDRESS_TYPE',
    1
WHERE NOT EXISTS (
    SELECT 1
    FROM entity
    WHERE UPPER(name) = 'ADDRESS_TYPE'
);

INSERT INTO catalog (
    entity_id,
    value,
    status
)
SELECT
    e.id,
    v.value,
    1
FROM entity e
CROSS JOIN (
    VALUES
        ('ACTIVE'),
        ('BLOCKED'),
        ('INACTIVE'),
        ('DELETED')
) AS v(value)
WHERE UPPER(e.name) = 'CLIENT_STATUS'
  AND NOT EXISTS (
        SELECT 1
        FROM catalog c
        WHERE c.entity_id = e.id
          AND UPPER(c.value) = UPPER(v.value)
    );

INSERT INTO catalog (
    entity_id,
    value,
    status
)
SELECT
    e.id,
    v.value,
    1
FROM entity e
CROSS JOIN (
    VALUES
        ('PHYSICAL_ADDRESS'),
        ('EMAIL'),
        ('PHONE')
) AS v(value)
WHERE UPPER(e.name) = 'ADDRESS_TYPE'
  AND NOT EXISTS (
        SELECT 1
        FROM catalog c
        WHERE c.entity_id = e.id
          AND UPPER(c.value) = UPPER(v.value)
    );
