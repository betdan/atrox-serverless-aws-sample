import { getPool } from "./postgresql-client.js";

export class PostgreSqlEntityRepository {
  constructor({ database }) {
    this.pool = getPool(database);
  }

  async listEntities(filters) {
    const values = [];
    let whereClause = "";

    if (filters.status !== null && filters.status !== undefined) {
      values.push(filters.status);
      whereClause = "WHERE status = $1";
    }

    const result = await this.pool.query(
      `SELECT id, name, status, created_at
       FROM entity
       ${whereClause}
       ORDER BY id ASC`,
      values
    );

    return result.rows;
  }
}
