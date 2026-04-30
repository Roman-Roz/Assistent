# OpenClaw Architecture

This document describes the high-level architecture of OpenClaw, a personal AI assistant that runs on your own devices.

## Overview

OpenClaw is composed of several key subsystems that work together to provide a seamless AI assistant experience across multiple communication channels.

```
┌─────────────────────────────────────────────────────────────────┐
│                      OpenClaw Gateway                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Channel   │  │   Agent     │  │      Skills/Tools       │  │
│  │  Adapters   │  │   Engine    │  │  (Search, Code, etc.)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Message Router & Event Bus                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Memory    │  │   Config    │  │      Security &         │  │
│  │   (QMD)     │  │   Manager   │  │      Auth               │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   WhatsApp    │   │   Telegram      │   │   Slack         │
│   Discord     │   │   Signal        │   │   iMessage      │
│   ...         │   │   ...           │   │   ...           │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

## Core Components

### 1. Gateway (`src/gateway/`)

The Gateway is the central control plane that orchestrates all operations:
- **Server**: HTTP/WebSocket server for CLI and channel connections
- **Auth**: Token-based authentication with optional password fallback
- **Config**: Loads and validates `openclaw.json` configuration

### 2. Channel Adapters (`src/channels/` or `extensions/*/`)

Each channel adapter implements a common interface:
- **Connection management**: Establish and maintain connections to external services
- **Message parsing**: Convert external message formats to internal representation
- **Delivery**: Send messages back through the appropriate channel
- **Presence**: Track user/channel availability status

Supported channels include: WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, BlueBubbles, IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, WeChat, QQ, and more.

### 3. Agent Engine (`src/agent/`)

The Agent Engine manages AI interactions:
- **Prompt construction**: Builds context-aware prompts from conversation history
- **Model routing**: Selects appropriate LLM based on configuration and availability
- **Response streaming**: Handles real-time response delivery
- **Tool integration**: Executes skills and tools as requested by the model

### 4. Memory System - QMD (`src/memory/`)

Quantized Memory Database (QMD) provides:
- **Conversation history**: Persistent storage of all interactions
- **Semantic search**: Vector-based retrieval of relevant context
- **User preferences**: Long-term memory of user settings and patterns
- **Skill state**: Maintains stateful information across sessions

### 5. Skills & Tools (`skills/`)

Extensible tool system for agent capabilities:
- **Web search**: Brave Search, Perplexity API integration
- **Code execution**: Safe sandboxed code running
- **File operations**: Read/write within workspace boundaries
- **Custom skills**: User-defined extensions via plugins

### 6. Plugin SDK (`src/plugin-sdk/`)

Enables third-party extensions:
- **Channel plugins**: Add new messaging platform support
- **Skill plugins**: Extend agent capabilities
- **Provider plugins**: Integrate new LLM providers
- **Runtime isolation**: Sandboxed execution for safety

## Data Flow

### Inbound Message Flow

1. **Channel receives message** from external platform
2. **Adapter normalizes** to internal message format
3. **Router dispatches** to Agent Engine
4. **Agent constructs prompt** with context from Memory
5. **LLM processes** and returns response
6. **Response streamed** back through original channel

### Outbound Message Flow

1. **CLI/API request** submitted to Gateway
2. **Auth validated** against token/password
3. **Agent Engine processes** request
4. **Target channel identified** from configuration
5. **Adapter delivers** message to external platform
6. **Delivery confirmation** logged and returned

## Configuration System

Configuration flows through multiple layers (highest to lowest priority):

1. **Process environment variables** (`process.env`)
2. **Local `.env`** file in project directory
3. **Global `~/.openclaw/.env`** for daemon installations
4. **`openclaw.json`** `env` block

Key configuration areas:
- **Gateway**: Port, auth tokens, CORS settings
- **Channels**: Bot tokens, webhook URLs, room mappings
- **Models**: API keys, provider selection, fallback chains
- **Memory**: Storage location, retention policies
- **Skills**: API keys, rate limits, enabled features

## Security Model

### Authentication
- Token-based auth for all Gateway endpoints
- Optional password auth for local deployments
- Per-channel token isolation

### Authorization
- Workspace-scoped file access
- Channel-specific permissions
- Skill execution boundaries

### Secrets Management
- Environment variable injection
- Baseline scanning with `.secrets.baseline`
- Git hooks for secret detection

## Deployment Modes

### Development Mode
- Hot reload enabled
- Verbose logging
- Local file storage

### Production Daemon
- systemd (Linux) or launchd (macOS) service
- Minimal logging
- Optimized performance

### Docker Container
- Pre-built images available
- Volume mounts for persistence
- Network isolation options

## Extension Points

### Adding a New Channel
1. Create channel adapter implementing `IChannel` interface
2. Register in extension manifest
3. Configure connection parameters
4. Test with provided channel QA tools

### Creating a Custom Skill
1. Define skill metadata (name, description, inputs)
2. Implement execution logic
3. Register in skills directory or as plugin
4. Enable in configuration

### Plugin Development
1. Use Plugin SDK for consistent APIs
2. Follow sandboxing guidelines
3. Test with plugin QA framework
4. Publish to registry (optional)

## Testing Strategy

- **Unit tests**: Individual component testing
- **Integration tests**: Cross-component workflows
- **Live tests**: Real channel interactions (opt-in)
- **QA channels**: Synthetic test environments

Run tests with:
```bash
pnpm test                    # Unit tests
pnpm test:integration        # Integration tests
OPENCLAW_LIVE_TEST=1 pnpm test:live  # Live tests
```

## Performance Considerations

- **Streaming responses**: Minimize time-to-first-token
- **Connection pooling**: Reuse LLM API connections
- **Memory indexing**: Efficient vector search structures
- **Rate limiting**: Respect external API quotas

## Monitoring & Observability

- Structured JSON logging for production
- Health check endpoints
- Metrics collection points
- Error tracking integration ready

---

For more details, see:
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Vision Document](VISION.md)
- [API Documentation](docs/)
