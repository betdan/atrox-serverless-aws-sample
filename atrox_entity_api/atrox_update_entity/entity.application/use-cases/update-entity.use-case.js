export class UpdateEntityUseCase {
  constructor({ repository, logger, metrics }) {
    this.repository = repository;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(input) {
    const result = await this.repository.updateEntity(input);

    this.metrics.increment("entity.update.success");
    this.logger.info("Entity update processed", {
      entityId: input.id,
      status: result.codeError
    });

    return {
      statusCode: result.codeError === 0 ? 200 : 400,
      body: {
        code: result.codeError,
        message: result.messageError
      }
    };
  }
}
