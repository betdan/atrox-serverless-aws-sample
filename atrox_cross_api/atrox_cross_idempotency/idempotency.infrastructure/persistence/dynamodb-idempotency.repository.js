import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

export class DynamoDbIdempotencyRepository {
  constructor({ region, tableName }) {
    const client = new DynamoDBClient({ region });
    this.documentClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async findByRequestId(requestId) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        requestId
      }
    });

    const result = await this.documentClient.send(command);
    return result.Item ?? null;
  }
}
