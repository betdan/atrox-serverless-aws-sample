export class AuditRepository {
  async save(auditRecord) {
    throw new Error(`save must be implemented for auditId ${auditRecord.auditId}`);
  }
}
