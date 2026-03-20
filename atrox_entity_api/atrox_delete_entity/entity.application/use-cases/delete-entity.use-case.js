export class DeleteEntityUseCase {
  constructor({ repository, logger, metrics }) {
    this.repository = repository;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(input) {
    const result = await this.repository.deleteEntity(input);

    this.metrics.increment("entity.delete.success");
    this.logger.info("Entity delete processed", {
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
