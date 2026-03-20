export class EntityRepository {
  async listEntities(filters) {
    throw new Error(`listEntities must be implemented for filters ${JSON.stringify(filters)}`);
  }
}
