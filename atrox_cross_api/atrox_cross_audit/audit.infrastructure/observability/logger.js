const levels = {
  debug: 10,
  info: 20,
  warning: 30,
  error: 40
};

export class Logger {
  constructor({ serviceName, level, enableDebugRequestResponse }) {
    this.serviceName = serviceName;
    this.level = level in levels ? level : "info";
    this.enableDebugRequestResponse = enableDebugRequestResponse;
  }

  debug(message, metadata = {}) {
    this.write("debug", message, metadata);
  }

  info(message, metadata = {}) {
    this.write("info", message, metadata);
  }

  warning(message, metadata = {}) {
    this.write("warning", message, metadata);
  }

  error(message, metadata = {}) {
    this.write("error", message, metadata);
  }

  debugRequestResponse(label, payload) {
    if (this.enableDebugRequestResponse) {
      this.debug(label, payload);
    }
  }

  write(level, message, metadata) {
    if (levels[level] < levels[this.level]) {
      return;
    }

    console.log(JSON.stringify({
      level,
      service: this.serviceName,
      message,
      metadata,
      timestamp: new Date().toISOString()
    }));
  }
}
