const required = [
  "AWS_REGION",
  "LOG_LEVEL",
  "LOG_SERVICE_NAME",
  "IDEMPOTENCY_TABLE_NAME",
  "IDEMPOTENCY_REQUEST_ID_HEADER",
  "ENABLE_DEBUG_REQUEST_RESPONSE"
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
    tableName: process.env.IDEMPOTENCY_TABLE_NAME,
    requestIdHeader: process.env.IDEMPOTENCY_REQUEST_ID_HEADER.toLowerCase(),
    enableDebugRequestResponse: process.env.ENABLE_DEBUG_REQUEST_RESPONSE === "true"
  };
}
