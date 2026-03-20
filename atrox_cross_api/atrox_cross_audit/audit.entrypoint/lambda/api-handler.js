import { bootstrap } from "./bootstrap.js";
import { mapApiRequest } from "../../audit.infrastructure/validation/channel-request.mapper.js";
import { createJsonResponse } from "../../audit.shared/http/http-response.js";

const { logger, metrics, singleUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("audit.api.duration");

  try {
    logger.debugRequestResponse("Incoming API event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    const input = mapApiRequest(event);
    const result = await singleUseCase.execute(input);

    logger.debugRequestResponse("Outgoing API response", result);

    return createJsonResponse(result.statusCode, result.body);
  } catch (error) {
    logger.error("Unhandled audit API error", {
      message: error.message,
      stack: error.stack
    });

    return createJsonResponse(error.statusCode ?? 500, {
      code: error.statusCode ?? 500,
      message: error.message ?? "Internal server error"
    });
  } finally {
    logger.info("Audit API handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
