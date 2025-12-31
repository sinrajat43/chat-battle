---
name: "Milestone 2: Data Ingestion Pipeline"
overview: ""
todos: []
---

# Mile

stone 2: Data Ingestion Pipeline - Execution Plan

## Overview

Build a Node.js/TypeScript microservice that connects to Twitch IRC chat, parses incoming messages, and publishes them to the `twitch-chat-messages` Kafka topic. This service is the foundation of the data pipeline.**Goal:** Messages from Twitch successfully flow into Kafka**Dependencies:** Milestone 1 (Infrastructure must be running)**Estimated Time:** 2-3 days**Completion Criteria:** Twitch messages successfully published to `twitch-chat-messages` topic---

## Project Structure

```javascript
services/
└── twitch-ingestion-service/
    ├── src/
    │   ├── twitch/
    │   │   ├── TwitchClient.ts          # IRC connection management
    │   │   └── MessageParser.ts         # Parse IRC messages
    │   ├── kafka/
    │   │   ├── Producer.ts              # Kafka producer setup
    │   │   └── MessageSerializer.ts    # Message transformation
    │   ├── config/
    │   │   └── config.ts                # Configuration management
    │   ├── types/
    │   │   └── index.ts                 # TypeScript type definitions
    │   ├── utils/
    │   │   └── logger.ts                # Logger setup
    │   └── index.ts                     # Service entry point
    ├── .env.example                     # Environment variables template
    ├── .gitignore                       # Git ignore rules
    ├── Dockerfile                       # Docker image definition
    ├── package.json                     # Dependencies and scripts
    ├── tsconfig.json                    # TypeScript configuration
    ├── .eslintrc.js                     # ESLint configuration
    ├── .prettierrc                      # Prettier configuration
    └── README.md                        # Service documentation
```

---

## Step 1: Project Setup

### 1.1 Initialize Node.js Project

**Tasks:**

- [ ] Create `services/twitch-ingestion-service/` directory
- [ ] Initialize npm project: `npm init -y`
- [ ] Update package.json with project metadata
- [ ] Set up TypeScript: `npm install -D typescript @types/node`
- [ ] Create `tsconfig.json` with appropriate settings
- [ ] Set up project structure (create all directories)

### 1.2 Install Dependencies

**Production Dependencies:**

- [ ] `tmi.js` - Twitch IRC client library
- [ ] `kafkajs` - Kafka producer client
- [ ] `pino` - Fast JSON logger (recommended for performance)
- [ ] `pino-pretty` - Pretty print for development
- [ ] `dotenv` - Environment variable management

**Development Dependencies:**

- [ ] `typescript` - TypeScript compiler
- [ ] `@types/node` - Node.js type definitions
- [ ] `ts-node` - Run TypeScript directly
- [ ] `nodemon` - Auto-restart on changes
- [ ] `eslint` - Code linting
- [ ] `@typescript-eslint/parser` - TypeScript ESLint parser
- [ ] `@typescript-eslint/eslint-plugin` - TypeScript ESLint rules
- [ ] `prettier` - Code formatting
- [ ] `eslint-config-prettier` - Disable ESLint rules that conflict with Prettier

**Installation Command:**

```bash
npm install tmi.js kafkajs pino pino-pretty dotenv
npm install -D typescript @types/node ts-node nodemon eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```



### 1.3 Configure TypeScript

**File:** `tsconfig.json`**Configuration:**

- Target: ES2020
- Module: CommonJS or ESNext
- Strict mode enabled
- Source maps for debugging
- OutDir: `dist/`
- Include: `src/**/*`

### 1.4 Set Up Code Quality Tools

**ESLint Configuration:**

- [ ] Create `.eslintrc.js`
- [ ] Configure TypeScript parser
- [ ] Set up recommended rules
- [ ] Integrate with Prettier

**Prettier Configuration:**

- [ ] Create `.prettierrc`
- [ ] Set formatting rules (2 spaces, single quotes, etc.)

**Package.json Scripts:**

- [ ] `build` - Compile TypeScript
- [ ] `start` - Run compiled JavaScript
- [ ] `dev` - Run with nodemon and ts-node
- [ ] `lint` - Run ESLint
- [ ] `format` - Run Prettier
- [ ] `type-check` - Type check without emitting

---

## Step 2: Type Definitions

### 2.1 Create TypeScript Types

**File:** `src/types/index.ts`**Types to Define:**

- [ ] `ChatMessage` interface - Kafka message format
- channel_id: string
- user_id: string
- username: string
- message: string
- timestamp: number (Unix timestamp in milliseconds)
- emotes: string[]
- [ ] `TwitchIRCMessage` interface - Raw Twitch message format
- [ ] `ServiceConfig` interface - Configuration structure
- [ ] `ConnectionStatus` type - 'connected' | 'disconnected' | 'connecting'

---

## Step 3: Configuration Management

### 3.1 Create Configuration Module

**File:** `src/config/config.ts`**Configuration to Load:**

- [ ] Twitch configuration:
- TWITCH_CHANNEL (required)
- TWITCH_USERNAME (required)
- TWITCH_OAUTH_TOKEN (required)
- [ ] Kafka configuration:
- KAFKA_BROKERS (default: localhost:9092)
- KAFKA_TOPIC_CHAT_MESSAGES (default: twitch-chat-messages)
- KAFKA_CLIENT_ID (default: twitch-ingestion-service)
- [ ] Logging:
- LOG_LEVEL (default: info)

**Features:**

- [ ] Load from environment variables
- [ ] Validate required variables
- [ ] Provide sensible defaults
- [ ] Export typed configuration object

### 3.2 Create Environment Template

**File:** `.env.example`**Content:**

```bash
# Twitch Configuration
TWITCH_CHANNEL=channelname
TWITCH_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_token_here

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_CHAT_MESSAGES=twitch-chat-messages
KAFKA_CLIENT_ID=twitch-ingestion-service

# Logging
LOG_LEVEL=info
```



### 3.3 Twitch OAuth Token Setup Instructions

**Documentation to Create:**

- [ ] Instructions for getting Twitch OAuth token
- [ ] Link to Twitch Developer Console
- [ ] Steps to generate OAuth token
- [ ] Token format requirements (must start with `oauth:`)
- [ ] Security notes (never commit token)

---

## Step 4: Logger Setup

### 4.1 Create Logger Utility

**File:** `src/utils/logger.ts`**Features:**

- [ ] Initialize Pino logger
- [ ] Configure log level from environment
- [ ] Pretty print for development
- [ ] JSON format for production
- [ ] Export logger instance

---

## Step 5: Twitch IRC Integration

### 5.1 Create TwitchClient Class

**File:** `src/twitch/TwitchClient.ts`**Responsibilities:**

- [ ] Initialize tmi.js client with configuration
- [ ] Handle connection events (connected, disconnected, reconnecting)
- [ ] Implement connection retry logic with exponential backoff
- [ ] Emit parsed messages to subscribers
- [ ] Handle rate limiting gracefully
- [ ] Log connection status and events
- [ ] Provide methods: connect(), disconnect(), isConnected()

**Key Features:**

- [ ] Exponential backoff for reconnection (1s, 2s, 4s, 8s, max 60s)
- [ ] Connection state management
- [ ] Error handling for connection failures
- [ ] Event emitter pattern for message events

### 5.2 Create MessageParser

**File:** `src/twitch/MessageParser.ts`**Responsibilities:**

- [ ] Parse tmi.js message objects
- [ ] Extract channel_id from channel name
- [ ] Extract user_id and username
- [ ] Extract message text
- [ ] Extract emotes (if available)
- [ ] Generate timestamp (Unix milliseconds)
- [ ] Transform to ChatMessage format
- [ ] Handle malformed messages gracefully

**Message Parsing:**

- [ ] Handle regular chat messages
- [ ] Handle messages with emotes
- [ ] Handle special message types (if needed)
- [ ] Validate parsed message structure

---

## Step 6: Kafka Producer Setup

### 6.1 Create Kafka Producer

**File:** `src/kafka/Producer.ts`**Responsibilities:**

- [ ] Initialize Kafka client (KafkaJS)
- [ ] Create producer instance
- [ ] Configure producer settings:
- acks: 'all' (wait for all replicas)
- retries: 5
- batch size: 32KB
- linger: 10ms
- [ ] Connect producer to Kafka
- [ ] Handle producer errors and retries
- [ ] Provide method: sendMessage(channelId, message)
- [ ] Log producer events (ready, error, etc.)

**Error Handling:**

- [ ] Retry on transient errors
- [ ] Log errors with context
- [ ] Emit error events for monitoring
- [ ] Handle producer disconnection

### 6.2 Create Message Serializer

**File:** `src/kafka/MessageSerializer.ts`**Responsibilities:**

- [ ] Serialize ChatMessage to JSON
- [ ] Validate message structure before serialization
- [ ] Handle serialization errors
- [ ] Ensure proper encoding (UTF-8)

---

## Step 7: Service Integration

### 7.1 Create Main Service Entry Point

**File:** `src/index.ts`**Responsibilities:**

- [ ] Load configuration
- [ ] Initialize logger
- [ ] Initialize Kafka producer
- [ ] Initialize Twitch client
- [ ] Connect Twitch client
- [ ] Set up message flow: Twitch → Parser → Kafka
- [ ] Handle graceful shutdown (SIGTERM, SIGINT)
- [ ] Error handling and recovery

**Message Flow:**

1. TwitchClient receives IRC message
2. MessageParser transforms to ChatMessage
3. Producer sends to Kafka with channel_id as key
4. Log success/failure

**Graceful Shutdown:**

- [ ] Disconnect Twitch client
- [ ] Flush Kafka producer
- [ ] Close Kafka connection
- [ ] Exit process

---

## Step 8: Error Handling & Resilience

### 8.1 Twitch Connection Error Handling

**Scenarios to Handle:**

- [ ] Connection refused
- [ ] Authentication failures
- [ ] Network timeouts
- [ ] Rate limiting (429 errors)
- [ ] Invalid channel name

**Implementation:**

- [ ] Exponential backoff retry
- [ ] Maximum retry attempts
- [ ] Log errors with context
- [ ] Emit health status

### 8.2 Kafka Producer Error Handling

**Scenarios to Handle:**

- [ ] Broker unavailable
- [ ] Topic doesn't exist
- [ ] Network errors
- [ ] Serialization errors

**Implementation:**

- [ ] Retry with exponential backoff
- [ ] Log errors with message context
- [ ] Don't crash on transient errors
- [ ] Buffer messages if Kafka is down (optional, Phase 2)

---

## Step 9: Docker Integration

### 9.1 Create Dockerfile

**File:** `Dockerfile`**Configuration:**

- [ ] Use Node.js 18 Alpine base image
- [ ] Set working directory
- [ ] Copy package files
- [ ] Install dependencies
- [ ] Copy source code
- [ ] Build TypeScript
- [ ] Set up non-root user
- [ ] Expose ports (if health check needed)
- [ ] Set CMD to run service

**Multi-stage Build (Optional):**

- [ ] Build stage: Install deps and compile
- [ ] Production stage: Copy only necessary files

### 9.2 Update docker-compose.yml

**Tasks:**

- [ ] Add twitch-ingestion service to docker-compose.yml
- [ ] Configure depends_on: kafka
- [ ] Set environment variables
- [ ] Mount .env file or use environment section
- [ ] Add to chatbattle-network
- [ ] Configure restart policy

---

## Step 10: Testing & Verification

### 10.1 Manual Testing

**Test Scenarios:**

- [ ] Start service and connect to Twitch
- [ ] Verify messages appear in Kafka topic
- [ ] Test with real Twitch channel
- [ ] Verify message format in Kafka
- [ ] Test reconnection (stop/start Twitch connection)
- [ ] Test error scenarios:
- Invalid channel name
- Invalid OAuth token
- Kafka down
- Network interruption

### 10.2 Verification Commands

**Check Kafka Messages:**

```bash
docker exec -it chatbattle-kafka kafka-console-consumer \
  --topic twitch-chat-messages \
  --from-beginning \
  --bootstrap-server localhost:9092
```

**Verify Message Format:**

- [ ] Messages are valid JSON
- [ ] All required fields present
- [ ] Timestamps are Unix milliseconds
- [ ] Channel IDs are correct
- [ ] Emotes array is present (even if empty)