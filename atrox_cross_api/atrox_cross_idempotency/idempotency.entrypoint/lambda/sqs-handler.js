import { bootstrap } from "./bootstrap.js";
import { mapSqsRequests } from "../../idempotency.infrastructure/validation/channel-request.mapper.js";

const { logger, metrics, batchUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("idempotency.sqs.duration");

  try {
    logger.debugRequestResponse("Incoming SQS event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    const items = mapSqsRequests(event);
    const results = await batchUseCase.execute(items);

    return {
      batchItemFailures: results
        .filter((item) => !item.success)
        .map((item) => ({
          itemIdentifier: item.itemIdentifier
        }))
    };
  } catch (error) {
    logger.error("Unhandled idempotency SQS error", {
      message: error.message,
      stack: error.stack
    });

    throw error;
  } finally {
    logger.info("Idempotency SQS handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
