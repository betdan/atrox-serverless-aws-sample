import { getPool } from "./postgresql-client.js";

export class PostgreSqlEntityRepository {
  constructor({ database }) {
    this.pool = getPool(database);
  }

  async deleteEntity(entity) {
    const result = await this.pool.query(
      "SELECT * FROM delete_entity($1)",
      [entity.id]
    );

    return result.rows[0];
  }
}
