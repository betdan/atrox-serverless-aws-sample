import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool(database) {
  if (!pool) {
    pool = new Pool({
      host: database.host,
      port: database.port,
      database: database.database,
      user: database.user,
      password: database.password,
      ssl: database.sslMode === "disable" ? false : { rejectUnauthorized: false }
    });
  }

  return pool;
}
