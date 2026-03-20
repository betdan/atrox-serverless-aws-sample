export class CreateEntityUseCase {
  constructor({ repository, logger, metrics }) {
    this.repository = repository;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(input) {
    const result = await this.repository.createEntity(input);

    this.metrics.increment("entity.create.success");
    this.logger.info("Entity creation processed", {
      name: input.name,
      status: result.codeError
    });

    return {
      statusCode: result.codeError === 0 ? 201 : 400,
      body: {
        code: result.codeError,
        message: result.messageError
      }
    };
  }
}
