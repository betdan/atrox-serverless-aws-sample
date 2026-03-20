export class ResolveIdempotencyUseCase {
  constructor({ repository, decisionService, logger, metrics }) {
    this.repository = repository;
    this.decisionService = decisionService;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(input) {
    const record = await this.repository.findByRequestId(input.requestId);
    const decision = this.decisionService.resolve(record, input.requestHash);

    this.metrics.increment(`idempotency.${decision.status.toLowerCase()}`);

    this.logger.info("Idempotency request resolved", {
      requestId: input.requestId,
      resolution: decision.status
    });

    return {
      statusCode: decision.code,
      body: {
        code: decision.code,
        message: decision.message,
        resolution: decision.status,
        requestId: input.requestId,
        response: decision.response
      }
    };
  }
}
