# Production Logging Configuration Guide

This document describes how to configure JSON-formatted logging for production deployments of OpenClaw.

## Overview

OpenClaw supports multiple logging formats:
- **Human-readable** (default): Best for local development and debugging
- **JSON format**: Recommended for production environments with log aggregation systems

## Configuration

### Environment Variables

Set the following environment variables to enable JSON logging:

```bash
# Enable JSON log format
OPENCLAW_LOG_FORMAT=json

# Set log level (debug, info, warn, error)
OPENCLAW_LOG_LEVEL=info

# Include timestamps in ISO 8601 format (always enabled in JSON mode)
OPENCLAW_LOG_TIMESTAMPS=true

# Include source location (file:line) in log entries
OPENCLAW_LOG_SOURCE=true
```

### Configuration File (openclaw.json)

```json
{
  "logging": {
    "format": "json",
    "level": "info",
    "timestamps": true,
    "source": true
  }
}
```

## Log Entry Structure (JSON Mode)

Each log entry in JSON format includes:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Gateway started successfully",
  "service": "openclaw-gateway",
  "version": "2026.4.26",
  "context": {
    "port": 18789,
    "authMode": "token"
  },
  "source": {
    "file": "src/gateway/server.ts",
    "line": 142
  }
}
```

## Integration with Log Aggregators

### Datadog

1. Configure JSON logging as shown above
2. Install Datadog Agent on the host
3. Mount the log directory:
   ```yaml
   volumes:
     - ~/.openclaw/logs:/var/log/openclaw
   ```

### Grafana Loki

1. Enable JSON format
2. Configure Promtail to scrape logs:
   ```yaml
   scrape_configs:
     - job_name: openclaw
       static_configs:
         - targets:
             - localhost
           labels:
             job: openclaw
             __path__: /var/log/openclaw/*.log
   ```

### AWS CloudWatch

1. Use the CloudWatch agent or Fluent Bit
2. Parse JSON logs automatically with CloudWatch Logs Insights

## Best Practices

1. **Always use JSON format in production** for easier parsing and querying
2. **Set appropriate log levels**: `info` for normal operation, `warn` for high-traffic environments
3. **Rotate logs regularly** to prevent disk space issues
4. **Include correlation IDs** for tracing requests across services
5. **Avoid logging sensitive data** (tokens, passwords, PII)

## Troubleshooting

### Logs not appearing in JSON format

1. Verify `OPENCLAW_LOG_FORMAT=json` is set
2. Check that the configuration file is being loaded
3. Restart the gateway after configuration changes

### Performance concerns

If logging impacts performance:
1. Increase log level to `warn` or `error`
2. Disable source location tracking (`OPENCLAW_LOG_SOURCE=false`)
3. Use asynchronous logging if available

## See Also

- [Logging Documentation](https://docs.openclaw.ai/logging)
- [Configuration Guide](https://docs.openclaw.ai/gateway/configuration)
- [Security Best Practices](https://docs.openclaw.ai/gateway/security)
