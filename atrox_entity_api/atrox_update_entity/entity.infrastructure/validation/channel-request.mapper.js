export function mapApiRequest(event) {
  return parsePayload(event.body, event.headers);
}

export function mapSqsRequests(event) {
  return (event.Records ?? []).map((record) => ({
    itemIdentifier: record.messageId,
    payload: parsePayload(record.body)
  }));
}

export function mapSnsRequest(event) {
  const record = event.Records?.[0];

  if (!record?.Sns?.Message) {
    throw badRequest("SNS message is required");
  }

  return parsePayload(record.Sns.Message);
}

function parsePayload(payload, headers = {}) {
  const body = !payload
    ? {}
    : typeof payload === "object"
      ? payload
      : JSON.parse(payload);
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  if (!body.id) {
    throw badRequest("id is required");
  }

  if (!body.name) {
    throw badRequest("name is required");
  }

  if (body.status === undefined || body.status === null) {
    throw badRequest("status is required");
  }

  const requestId = body.requestId ?? normalizedHeaders["x-idempotency-key"];

  if (!requestId) {
    throw badRequest("requestId is required");
  }

  if (!body.requestHash) {
    throw badRequest("requestHash is required");
  }

  return {
    id: Number(body.id),
    name: body.name,
    status: Number(body.status),
    requestId,
    requestHash: body.requestHash
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
