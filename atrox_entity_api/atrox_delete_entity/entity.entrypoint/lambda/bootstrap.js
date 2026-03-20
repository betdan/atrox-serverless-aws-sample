import { DeleteEntityUseCase } from "../../entity.application/use-cases/delete-entity.use-case.js";
import { DeleteEntityBatchUseCase } from "../../entity.application/use-cases/delete-entity-batch.use-case.js";
import { loadEnvironment } from "../../entity.infrastructure/config/environment.config.js";
import { AuditDispatcher } from "../../entity.infrastructure/integrations/audit-dispatcher.js";
import { IdempotencyApiClient } from "../../entity.infrastructure/integrations/idempotency-api.client.js";
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
const idempotencyClient = new IdempotencyApiClient({
  apiUrl: environment.idempotencyApiUrl,
  requestIdHeader: environment.idempotencyRequestIdHeader,
  logger
});
const singleUseCase = new DeleteEntityUseCase({
  repository,
  logger,
  metrics
});
const batchUseCase = new DeleteEntityBatchUseCase({
  singleUseCase,
  logger,
  metrics
});

export function bootstrap() {
  return {
    logger,
    metrics,
    auditDispatcher,
    idempotencyClient,
    singleUseCase,
    batchUseCase
  };
}
