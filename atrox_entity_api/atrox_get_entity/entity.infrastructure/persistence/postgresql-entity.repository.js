import { getPool } from "./postgresql-client.js";

export class PostgreSqlEntityRepository {
  constructor({ database }) {
    this.pool = getPool(database);
  }

  async getById(entityId) {
    const result = await this.pool.query(
      `SELECT id, name, status, created_at
       FROM entity
       WHERE id = $1`,
      [entityId]
    );

    return result.rows[0] ?? null;
  }
}
