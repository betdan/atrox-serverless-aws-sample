export class IdempotencyDecisionService {
  resolve(record, requestHash) {
    if (!record) {
      return {
        status: "MISS",
        code: 404,
        message: "Idempotency record not found",
        response: null
      };
    }

    if (record.requestHash !== requestHash) {
      return {
        status: "CONFLICT",
        code: 409,
        message: "Request hash does not match the latest idempotent execution",
        response: null
      };
    }

    return {
      status: "HIT",
      code: 200,
      message: "Successful",
      response: record.response ?? null
    };
  }
}
