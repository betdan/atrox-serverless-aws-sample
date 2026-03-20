import { randomUUID } from "node:crypto";

export class AuditRecordFactory {
  create(input) {
    return {
      auditId: input.auditId ?? randomUUID(),
      timestamp: input.timestamp ?? new Date().toISOString(),
      action: input.action,
      payload: input.payload ?? {},
      response: input.response ?? {},
      status: input.status
    };
  }
}
