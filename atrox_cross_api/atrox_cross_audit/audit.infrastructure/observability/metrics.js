export class LocalMetrics {
  constructor({ serviceName, logger }) {
    this.serviceName = serviceName;
    this.logger = logger;
    this.counters = {};
    this.timings = [];
  }

  increment(metricName, value = 1) {
    this.counters[metricName] = (this.counters[metricName] ?? 0) + value;
  }

  startTimer(metricName) {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;
      this.timings.push({ metricName, duration });
      return duration;
    };
  }

  flush() {
    this.logger.info("Local metrics", {
      serviceName: this.serviceName,
      counters: this.counters,
      timings: this.timings
    });
  }
}
