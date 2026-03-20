process.env.AWS_REGION ??= "us-east-2";
process.env.LOG_LEVEL ??= "debug";
process.env.LOG_SERVICE_NAME ??= "atrox-cross-audit-api";
process.env.AUDIT_TABLE_NAME ??= "atrox-audit";
process.env.ENABLE_DEBUG_REQUEST_RESPONSE ??= "true";

const channel = process.env.AUDIT_LOCAL_CHANNEL ?? "api";

const handlers = {
  api: () => import("./api-handler.js"),
  sqs: () => import("./sqs-handler.js"),
  sns: () => import("./sns-handler.js")
};

const { handler } = await handlers[channel]();

const payload = {
  action: "CLIENT_CREATED",
  payload: {
    clientId: 1
  },
  response: {
    code: 0,
    message: "Successful"
  },
  status: "SUCCESS"
};

const sampleEvents = {
  api: {
    body: JSON.stringify(payload)
  },
  sqs: {
    Records: [
      {
        messageId: "message-001",
        body: JSON.stringify(payload)
      }
    ]
  },
  sns: {
    Records: [
      {
        Sns: {
          Message: JSON.stringify(payload)
        }
      }
    ]
  }
};

const response = await handler(sampleEvents[channel], {
  awsRequestId: "local-runner"
});

console.log(response);
