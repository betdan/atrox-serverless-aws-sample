import { getPool } from "./postgresql-client.js";

export class PostgreSqlEntityRepository {
  constructor({ database }) {
    this.pool = getPool(database);
  }

  async updateEntity(entity) {
    const result = await this.pool.query(
      "SELECT * FROM update_entity($1, $2, $3)",
      [entity.id, entity.name, entity.status]
    );

    return result.rows[0];
  }
}
