const required = [
  "AWS_REGION",
  "LOG_LEVEL",
  "LOG_SERVICE_NAME",
  "ENABLE_DEBUG_REQUEST_RESPONSE",
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD"
];

export function loadEnvironment() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  return {
    awsRegion: process.env.AWS_REGION,
    logLevel: process.env.LOG_LEVEL,
    serviceName: process.env.LOG_SERVICE_NAME,
    enableDebugRequestResponse: process.env.ENABLE_DEBUG_REQUEST_RESPONSE === "true",
    auditQueueUrl: process.env.AUDIT_QUEUE_URL ?? "",
    database: {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      sslMode: process.env.PGSSLMODE ?? "require"
    }
  };
}
