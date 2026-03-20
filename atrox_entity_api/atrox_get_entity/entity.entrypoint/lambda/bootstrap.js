import { GetEntityUseCase } from "../../entity.application/use-cases/get-entity.use-case.js";
import { GetEntityBatchUseCase } from "../../entity.application/use-cases/get-entity-batch.use-case.js";
import { loadEnvironment } from "../../entity.infrastructure/config/environment.config.js";
import { AuditDispatcher } from "../../entity.infrastructure/integrations/audit-dispatcher.js";
import { Logger } from "../../entity.infrastructure/observability/logger.js";
import { LocalMetrics } from "../../entity.infrastructure/observability/metrics.js";
import { PostgreSqlEntityRepository } from "../../entity.infrastructure/persistence/postgresql-entity.repository.js";

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
const repository = new PostgreSqlEntityRepository({
  database: environment.database
});
const auditDispatcher = new AuditDispatcher({
  region: environment.awsRegion,
  queueUrl: environment.auditQueueUrl,
  logger
});
const singleUseCase = new GetEntityUseCase({
  repository,
  logger,
  metrics
});
const batchUseCase = new GetEntityBatchUseCase({
  singleUseCase,
  logger,
  metrics
});

export function bootstrap() {
  return {
    logger,
    metrics,
    auditDispatcher,
    singleUseCase,
    batchUseCase
  };
}
