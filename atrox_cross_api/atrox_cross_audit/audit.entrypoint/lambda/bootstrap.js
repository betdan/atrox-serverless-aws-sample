import { RegisterAuditUseCase } from "../../audit.application/use-cases/register-audit.use-case.js";
import { RegisterAuditBatchUseCase } from "../../audit.application/use-cases/register-audit-batch.use-case.js";
import { AuditRecordFactory } from "../../audit.domain/services/audit-record.factory.js";
import { loadEnvironment } from "../../audit.infrastructure/config/environment.config.js";
import { DynamoDbAuditRepository } from "../../audit.infrastructure/persistence/dynamodb-audit.repository.js";
import { Logger } from "../../audit.infrastructure/observability/logger.js";
import { LocalMetrics } from "../../audit.infrastructure/observability/metrics.js";

const environment = loadEnvironment();
const logger = new Logger({
  serviceName: environment.serviceName,
  level: environment.logLevel,
  enableDebugRequestResponse: environment.enableDebugRequestResponse
});
const metrics = new LocalMetrics({
  serviceName: environment.serviceName,
  logger
});
const repository = new DynamoDbAuditRepository({
  region: environment.awsRegion,
  tableName: environment.tableName
});
const recordFactory = new AuditRecordFactory();
const singleUseCase = new RegisterAuditUseCase({
  repository,
  recordFactory,
  logger,
  metrics
});
const batchUseCase = new RegisterAuditBatchUseCase({
  singleUseCase,
  logger,
  metrics
});

export function bootstrap() {
  return {
    logger,
    metrics,
    singleUseCase,
    batchUseCase
  };
}
