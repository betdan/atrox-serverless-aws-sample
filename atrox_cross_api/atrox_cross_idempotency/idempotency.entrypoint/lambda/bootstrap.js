import { ResolveIdempotencyUseCase } from "../../idempotency.application/use-cases/resolve-idempotency.use-case.js";
import { ResolveIdempotencyBatchUseCase } from "../../idempotency.application/use-cases/resolve-idempotency-batch.use-case.js";
import { IdempotencyDecisionService } from "../../idempotency.domain/services/idempotency-decision.service.js";
import { loadEnvironment } from "../../idempotency.infrastructure/config/environment.config.js";
import { DynamoDbIdempotencyRepository } from "../../idempotency.infrastructure/persistence/dynamodb-idempotency.repository.js";
import { Logger } from "../../idempotency.infrastructure/observability/logger.js";
import { LocalMetrics } from "../../idempotency.infrastructure/observability/metrics.js";

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
const repository = new DynamoDbIdempotencyRepository({
  region: environment.awsRegion,
  tableName: environment.tableName
});
const decisionService = new IdempotencyDecisionService();
const singleUseCase = new ResolveIdempotencyUseCase({
  repository,
  decisionService,
  logger,
  metrics
});
const batchUseCase = new ResolveIdempotencyBatchUseCase({
  singleUseCase,
  logger,
  metrics
});

export function bootstrap() {
  return {
    environment,
    logger,
    metrics,
    singleUseCase,
    batchUseCase
  };
}
