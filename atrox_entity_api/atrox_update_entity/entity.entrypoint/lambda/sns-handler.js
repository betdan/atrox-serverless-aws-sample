import { bootstrap } from "./bootstrap.js";
import { mapSnsRequest } from "../../entity.infrastructure/validation/channel-request.mapper.js";

const { logger, metrics, auditDispatcher, idempotencyClient, singleUseCase } = bootstrap();

export async function handler(event, context) {
  const stopTimer = metrics.startTimer("entity.update.sns.duration");
  let input;

  try {
    logger.debugRequestResponse("Incoming SNS event", {
      request: event,
      context: {
        awsRequestId: context?.awsRequestId
      }
    });

    input = mapSnsRequest(event);
    const idempotencyResult = await idempotencyClient.resolve(input);

    if (idempotencyResult.resolution === "HIT") {
      await auditDispatcher.dispatchSafe({
        action: "UPDATE_ENTITY_SNS",
        payload: input,
        response: idempotencyResult.response ?? idempotencyResult,
        status: "IDEMPOTENT_HIT"
      });
      return idempotencyResult.response ?? idempotencyResult;
    }

    if (idempotencyResult.resolution === "CONFLICT") {
      await auditDispatcher.dispatchSafe({
        action: "UPDATE_ENTITY_SNS",
        payload: input,
        response: idempotencyResult,
        status: "ERROR"
      });
      return idempotencyResult;
    }

    const result = await singleUseCase.execute(input);

    await auditDispatcher.dispatchSafe({
      action: "UPDATE_ENTITY_SNS",
      payload: input,
      response: result.body,
      status: result.statusCode < 400 ? "SUCCESS" : "ERROR"
    });

    return result.body;
  } catch (error) {
    await auditDispatcher.dispatchSafe({
      action: "UPDATE_ENTITY_SNS",
      payload: input ?? event,
      response: {
        code: error.statusCode ?? 500,
        message: error.message ?? "Internal server error"
      },
      status: "ERROR"
    });
    throw error;
  } finally {
    logger.info("Update entity SNS handler completed", {
      duration: stopTimer()
    });
    metrics.flush();
  }
}
