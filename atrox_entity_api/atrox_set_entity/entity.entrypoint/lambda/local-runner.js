process.env.AWS_REGION ??= "us-east-2";
process.env.LOG_LEVEL ??= "debug";
process.env.LOG_SERVICE_NAME ??= "atrox-set-entity-api";
process.env.ENABLE_DEBUG_REQUEST_RESPONSE ??= "true";
process.env.AUDIT_QUEUE_URL ??= "";
process.env.PGHOST ??= "atroxdb.c7qak488y94j.us-east-2.rds.amazonaws.com";
process.env.PGPORT ??= "5432";
process.env.PGDATABASE ??= "postgres";
process.env.PGUSER ??= "postgres";
process.env.PGPASSWORD ??= "change-me";
process.env.PGSSLMODE ??= "require";

const channel = process.env.ENTITY_LOCAL_CHANNEL ?? "api";
const handlers = {
  api: () => import("./api-handler.js"),
  sqs: () => import("./sqs-handler.js"),
  sns: () => import("./sns-handler.js")
};

const { handler } = await handlers[channel]();

const payload = { name: "SAMPLE_ENTITY", status: 1 };

const events = {
  api: { body: JSON.stringify(payload) },
  sqs: { Records: [{ messageId: "message-001", body: JSON.stringify(payload) }] },
  sns: { Records: [{ Sns: { Message: JSON.stringify(payload) } }] }
};

const response = await handler(events[channel], { awsRequestId: "local-runner" });
console.log(response);
