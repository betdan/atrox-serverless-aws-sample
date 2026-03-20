export function mapApiRequest(event) {
  return parsePayload(event.body);
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

function parsePayload(payload) {
  const body = !payload
    ? {}
    : typeof payload === "object"
      ? payload
      : JSON.parse(payload);

  if (!body.id) {
    throw badRequest("id is required");
  }

  return {
    id: Number(body.id)
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
