export class EntityRepository {
  async createEntity(entity) {
    throw new Error(`createEntity must be implemented for name ${entity.name}`);
  }
}
