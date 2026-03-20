import { bootstrap } from "./bootstrap.js";
import { mapSqsRequests } from "../../entity.infrastructure/validation/channel-request.mapper.js";

const { logger, metrics, auditDispatcher, batchUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("entity.create.sqs.duration");

  try {
    logger.debugRequestResponse("Incoming SQS event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    const items = mapSqsRequests(event);
    const results = await batchUseCase.execute(items);

    await auditDispatcher.dispatchSafe({
      action: "CREATE_ENTITY_SQS",
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
    logger.info("Create entity SQS handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
