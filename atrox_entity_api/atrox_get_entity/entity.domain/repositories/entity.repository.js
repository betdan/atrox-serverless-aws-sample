export class EntityRepository {
  async getById(entityId) {
    throw new Error(`getById must be implemented for entityId ${entityId}`);
  }
}
