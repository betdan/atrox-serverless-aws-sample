export class EntityRepository {
  async deleteEntity(entity) {
    throw new Error(`deleteEntity must be implemented for entityId ${entity.id}`);
  }
}
