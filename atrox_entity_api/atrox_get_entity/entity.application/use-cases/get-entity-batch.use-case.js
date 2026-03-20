export class GetEntityBatchUseCase {
  constructor({ singleUseCase, logger, metrics }) {
    this.singleUseCase = singleUseCase;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(items) {
    const results = [];

    for (const item of items) {
      try {
        const result = await this.singleUseCase.execute(item.payload);
        results.push({
          itemIdentifier: item.itemIdentifier,
          success: true,
          result
        });
      } catch (error) {
        this.metrics.increment("entity.get.batch_failure");
        this.logger.error("Batch get entity item failed", {
          itemIdentifier: item.itemIdentifier,
          message: error.message
        });
        results.push({
          itemIdentifier: item.itemIdentifier,
          success: false
        });
      }
    }

    return results;
  }
}
