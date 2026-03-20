import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

export class DynamoDbAuditRepository {
  constructor({ region, tableName }) {
    const client = new DynamoDBClient({ region });
    this.documentClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async save(auditRecord) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: auditRecord
    });

    await this.documentClient.send(command);
  }
}
