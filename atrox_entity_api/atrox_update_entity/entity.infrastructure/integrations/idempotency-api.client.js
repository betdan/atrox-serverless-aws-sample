export class IdempotencyApiClient {
  constructor({ apiUrl, requestIdHeader, logger }) {
    this.apiUrl = apiUrl;
    this.requestIdHeader = requestIdHeader;
    this.logger = logger;
  }

  async resolve({ requestId, requestHash }) {
    if (!this.apiUrl) {
      this.logger.warning("Idempotency API URL is not configured");
      return {
        resolution: "MISS"
      };
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [this.requestIdHeader]: requestId
      },
      body: JSON.stringify({
        requestId,
        requestHash
      })
    });

    const body = await response.json();

    return {
      httpStatus: response.status,
      ...body
    };
  }
}
