export class IdempotencyRepository {
  async findByRequestId(requestId) {
    throw new Error(`findByRequestId must be implemented for requestId ${requestId}`);
  }
}
