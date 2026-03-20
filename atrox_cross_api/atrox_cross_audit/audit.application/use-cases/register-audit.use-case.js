export class RegisterAuditUseCase {
  constructor({ repository, recordFactory, logger, metrics }) {
    this.repository = repository;
    this.recordFactory = recordFactory;
    this.logger = logger;
    this.metrics = metrics;
  }

  async execute(input) {
    const auditRecord = this.recordFactory.create(input);

    await this.repository.save(auditRecord);

    this.metrics.increment("audit.created");

    this.logger.info("Audit record registered", {
      auditId: auditRecord.auditId,
      action: auditRecord.action,
      status: auditRecord.status
    });

    return {
      statusCode: 201,
      body: {
        code: 0,
        message: "Successful",
        auditId: auditRecord.auditId,
        timestamp: auditRecord.timestamp
      }
    };
  }
}
