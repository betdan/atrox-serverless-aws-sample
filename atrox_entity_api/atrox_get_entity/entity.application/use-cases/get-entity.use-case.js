export class GetEntityUseCase {
  constructor({ repository, logger, metrics }) {
    this.repository = repository;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(input) {
    const entity = await this.repository.getById(input.id);

    if (!entity) {
      return {
        statusCode: 404,
        body: {
          code: 404,
          message: "Entity not found"
        }
      };
    }

    this.metrics.increment("entity.get.success");
    this.logger.info("Entity retrieved", {
      entityId: input.id
    });

    return {
      statusCode: 200,
      body: {
        code: 0,
        message: "Successful",
        data: entity
      }
    };
  }
}
