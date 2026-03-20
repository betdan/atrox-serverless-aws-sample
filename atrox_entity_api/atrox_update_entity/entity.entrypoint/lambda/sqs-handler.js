import { bootstrap } from "./bootstrap.js";
import { mapSqsRequests } from "../../entity.infrastructure/validation/channel-request.mapper.js";

const { logger, metrics, auditDispatcher, idempotencyClient, batchUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("entity.update.sqs.duration");

  try {
    logger.debugRequestResponse("Incoming SQS event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    const items = mapSqsRequests(event);
    const executableItems = [];
    const failures = [];

    for (const item of items) {
      const idempotencyResult = await idempotencyClient.resolve(item.payload);

      if (idempotencyResult.resolution === "HIT") {
        continue;
      }

      if (idempotencyResult.resolution === "CONFLICT") {
        failures.push({
          itemIdentifier: item.itemIdentifier,
          success: false
        });
        continue;
      }

      executableItems.push(item);
    }

    const executionResults = await batchUseCase.execute(executableItems);
    const results = [...executionResults, ...failures];

    await auditDispatcher.dispatchSafe({
      action: "UPDATE_ENTITY_SQS",
      payload: items.map((item) => item.payload),
      response: results,
      status: results.every((item) => item.success) ? "SUCCESS" : "PARTIAL_SUCCESS"
    });

    return {
      batchItemFailures: results
        .filter((item) => !item.success)
        .map((item) => ({
          itemIdentifier: item.itemIdentifier
        }))
    };
  } finally {
    logger.info("Update entity SQS handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
