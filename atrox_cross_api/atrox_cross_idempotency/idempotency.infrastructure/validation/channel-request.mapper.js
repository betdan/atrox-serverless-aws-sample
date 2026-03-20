export function mapApiRequest(event, requestIdHeader) {
  const headers = normalizeHeaders(event.headers);
  const body = parseBody(event.body);
  const requestId = headers[requestIdHeader] ?? body.requestId;
  const requestHash = body.requestHash;

  if (!requestId) {
    throw badRequest("requestId is required through header or body");
  }

  if (!requestHash) {
    throw badRequest("requestHash is required");
  }

  return {
    requestId,
    requestHash
  };
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

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
}

function parseBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "object") {
    return body;
  }

  return JSON.parse(body);
}

function parseMessage(message) {
  const payload = typeof message === "string" ? JSON.parse(message) : message;

  if (!payload.requestId) {
    throw badRequest("requestId is required");
  }

  if (!payload.requestHash) {
    throw badRequest("requestHash is required");
  }

  return {
    requestId: payload.requestId,
    requestHash: payload.requestHash
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
