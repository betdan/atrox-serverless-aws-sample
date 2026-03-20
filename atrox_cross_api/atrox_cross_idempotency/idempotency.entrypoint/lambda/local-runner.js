process.env.AWS_REGION ??= "us-east-2";
process.env.LOG_LEVEL ??= "debug";
process.env.LOG_SERVICE_NAME ??= "atrox-cross-idempotency-api";
process.env.IDEMPOTENCY_TABLE_NAME ??= "atrox-idempotency";
process.env.IDEMPOTENCY_REQUEST_ID_HEADER ??= "x-idempotency-key";
process.env.ENABLE_DEBUG_REQUEST_RESPONSE ??= "true";

const channel = process.env.IDEMPOTENCY_LOCAL_CHANNEL ?? "api";

const handlers = {
  api: () => import("./api-handler.js"),
  sqs: () => import("./sqs-handler.js"),
  sns: () => import("./sns-handler.js")
};

const { handler } = await handlers[channel]();

const sampleEvents = {
  api: {
    headers: {
      "x-idempotency-key": "request-001"
    },
    body: JSON.stringify({
      requestHash: "sample-hash"
    })
  },
  sqs: {
    Records: [
      {
        messageId: "message-001",
        body: JSON.stringify({
          requestId: "request-001",
          requestHash: "sample-hash"
        })
      }
    ]
  },
  sns: {
    Records: [
      {
        Sns: {
          Message: JSON.stringify({
            requestId: "request-001",
            requestHash: "sample-hash"
          })
        }
      }
    ]
  }
};

const response = await handler(sampleEvents[channel], {
  awsRequestId: "local-runner"
});

console.log(response);
