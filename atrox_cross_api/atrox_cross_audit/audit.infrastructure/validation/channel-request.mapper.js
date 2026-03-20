export function mapApiRequest(event) {
  return parseMessage(event.body);
}

export function mapSqsRequests(event) {
  return (event.Records ?? []).map((record) => ({
    itemIdentifier: record.messageId,
    payload: parseMessage(record.body)
  }));
}

export function mapSnsRequest(event) {
  const record = event.Records?.[0];

  if (!record?.Sns?.Message) {
    throw badRequest("SNS message is required");
  }

  return parseMessage(record.Sns.Message);
}

function parseMessage(message) {
  const body = !message
    ? {}
    : typeof message === "object"
      ? message
      : JSON.parse(message);

  if (!body.action) {
    throw badRequest("action is required");
  }

  if (!body.status) {
    throw badRequest("status is required");
  }

  return {
    auditId: body.auditId,
    timestamp: body.timestamp,
    action: body.action,
    payload: body.payload,
    response: body.response,
    status: body.status
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
