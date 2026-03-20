export class ListEntityUseCase {
  constructor({ repository, logger, metrics }) {
    this.repository = repository;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(input) {
    const items = await this.repository.listEntities(input);

    this.metrics.increment("entity.list.success");
    this.logger.info("Entity list retrieved", {
      total: items.length,
      status: input.status ?? null
    });

    return {
      statusCode: 200,
      body: {
        code: 0,
        message: "Successful",
        total: items.length,
        data: items
      }
    };
  }
}
