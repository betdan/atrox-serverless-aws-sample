import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export class AuditDispatcher {
  constructor({ region, queueUrl, logger }) {
    this.queueUrl = queueUrl;
    this.logger = logger;
    this.client = new SQSClient({ region });
  }

  async dispatch(payload) {
    if (!this.queueUrl) {
      this.logger.warning("Audit queue URL is not configured", {
        action: payload.action
      });
      return;
    }

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(payload)
    });

    await this.client.send(command);
  }

  async dispatchSafe(payload) {
    try {
      await this.dispatch(payload);
    } catch (error) {
      this.logger.warning("Audit dispatch failed", {
        action: payload.action,
        message: error.message
      });
    }
  }
}
