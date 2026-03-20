import { bootstrap } from "./bootstrap.js";
import { mapSqsRequests } from "../../audit.infrastructure/validation/channel-request.mapper.js";

const { logger, metrics, batchUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("audit.sqs.duration");

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
    logger.error("Unhandled audit SQS error", {
      message: error.message,
      stack: error.stack
    });

    throw error;
  } finally {
    logger.info("Audit SQS handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
