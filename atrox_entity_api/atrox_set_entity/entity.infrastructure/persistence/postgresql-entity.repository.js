import { getPool } from "./postgresql-client.js";

export class PostgreSqlEntityRepository {
  constructor({ database }) {
    this.pool = getPool(database);
  }

  async createEntity(entity) {
    const result = await this.pool.query(
      "SELECT * FROM create_entity($1, $2)",
      [entity.name, entity.status]
    );

    return result.rows[0];
  }
}
