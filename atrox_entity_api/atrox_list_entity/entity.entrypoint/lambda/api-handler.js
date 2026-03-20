import { bootstrap } from "./bootstrap.js";
import { mapApiRequest } from "../../entity.infrastructure/validation/channel-request.mapper.js";
import { createJsonResponse } from "../../entity.shared/http/http-response.js";

const { logger, metrics, auditDispatcher, singleUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("entity.list.api.duration");
  let input;

  try {
    logger.debugRequestResponse("Incoming API event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    input = mapApiRequest(event);
    const result = await singleUseCase.execute(input);

    await auditDispatcher.dispatchSafe({
      action: "LIST_ENTITY_API",
      payload: input,
      response: result.body,
      status: "SUCCESS"
    });

    return createJsonResponse(result.statusCode, result.body);
  } catch (error) {
    logger.error("Unhandled list entity API error", {
      message: error.message,
      stack: error.stack
    });

    await auditDispatcher.dispatchSafe({
      action: "LIST_ENTITY_API",
      payload: input ?? event,
      response: {
        code: error.statusCode ?? 500,
        message: error.message ?? "Internal server error"
      },
      status: "ERROR"
    });

    return createJsonResponse(error.statusCode ?? 500, {
      code: error.statusCode ?? 500,
      message: error.message ?? "Internal server error"
    });
  } finally {
    logger.info("List entity API handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
