import { bootstrap } from "./bootstrap.js";
import { mapSnsRequest } from "../../idempotency.infrastructure/validation/channel-request.mapper.js";

const { logger, metrics, singleUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("idempotency.sns.duration");

  try {
    logger.debugRequestResponse("Incoming SNS event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    const input = mapSnsRequest(event);
    const result = await singleUseCase.execute(input);

    logger.info("Idempotency SNS message processed", {
      statusCode: result.statusCode,
      resolution: result.body.resolution
    });

    return result.body;
  } catch (error) {
    logger.error("Unhandled idempotency SNS error", {
      message: error.message,
      stack: error.stack
    });

    throw error;
  } finally {
    logger.info("Idempotency SNS handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
