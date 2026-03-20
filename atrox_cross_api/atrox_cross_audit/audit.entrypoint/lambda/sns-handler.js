import { bootstrap } from "./bootstrap.js";
import { mapSnsRequest } from "../../audit.infrastructure/validation/channel-request.mapper.js";

const { logger, metrics, singleUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("audit.sns.duration");

  try {
    logger.debugRequestResponse("Incoming SNS event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    const input = mapSnsRequest(event);
    const result = await singleUseCase.execute(input);

    logger.info("Audit SNS message processed", {
      statusCode: result.statusCode
    });

    return result.body;
  } catch (error) {
    logger.error("Unhandled audit SNS error", {
      message: error.message,
      stack: error.stack
    });

    throw error;
  } finally {
    logger.info("Audit SNS handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
