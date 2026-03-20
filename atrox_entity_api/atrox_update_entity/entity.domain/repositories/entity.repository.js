export class EntityRepository {
  async updateEntity(entity) {
    throw new Error(`updateEntity must be implemented for entityId ${entity.id}`);
  }
}
