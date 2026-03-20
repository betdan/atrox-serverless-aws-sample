import { bootstrap } from "./bootstrap.js";
import { mapApiRequest } from "../../entity.infrastructure/validation/channel-request.mapper.js";
import { createJsonResponse } from "../../entity.shared/http/http-response.js";

const { logger, metrics, auditDispatcher, idempotencyClient, singleUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("entity.delete.api.duration");
  let input;

  try {
    logger.debugRequestResponse("Incoming API event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    input = mapApiRequest(event);
    const idempotencyResult = await idempotencyClient.resolve(input);

    if (idempotencyResult.resolution === "HIT") {
      await auditDispatcher.dispatchSafe({
        action: "DELETE_ENTITY_API",
        payload: input,
        response: idempotencyResult.response ?? idempotencyResult,
        status: "IDEMPOTENT_HIT"
      });
      return createJsonResponse(200, idempotencyResult.response ?? idempotencyResult);
    }

    if (idempotencyResult.resolution === "CONFLICT") {
      await auditDispatcher.dispatchSafe({
        action: "DELETE_ENTITY_API",
        payload: input,
        response: idempotencyResult,
        status: "ERROR"
      });
      return createJsonResponse(409, idempotencyResult);
    }

    const result = await singleUseCase.execute(input);

    await auditDispatcher.dispatchSafe({
      action: "DELETE_ENTITY_API",
      payload: input,
      response: result.body,
      status: result.statusCode < 400 ? "SUCCESS" : "ERROR"
    });

    return createJsonResponse(result.statusCode, result.body);
  } catch (error) {
    logger.error("Unhandled delete entity API error", {
      message: error.message,
      stack: error.stack
    });
    await auditDispatcher.dispatchSafe({
      action: "DELETE_ENTITY_API",
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
    logger.info("Delete entity API handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
