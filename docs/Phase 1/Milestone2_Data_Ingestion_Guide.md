# Milestone 2: Data Ingestion Pipeline Guide

## Overview

This guide provides step-by-step instructions for building and deploying the Twitch Ingestion Service. This service connects to Twitch IRC chat and publishes messages to Kafka.

**Goal:** Messages from Twitch successfully flow into Kafka  
**Estimated Time:** 2-3 days  
**Dependencies:** Milestone 1 (Infrastructure Setup)

---

## Prerequisites

- ✅ Milestone 1 completed (Kafka and infrastructure running)
- Node.js 18+ installed
- npm or yarn package manager
- Twitch Developer Account with OAuth application
- Basic familiarity with TypeScript and Node.js

---

## Step 1: Project Setup

### 1.1 Navigate to Service Directory

```bash
cd services/twitch-ingestion-service
```

### 1.2 Install Dependencies

```bash
npm install
```

This installs:
- `@tmi.js/chat` - Twitch IRC client
- `kafkajs` - Kafka client for Node.js
- `pino` - Fast JSON logger
- `express` - OAuth authentication server
- `axios` - HTTP client for token refresh
- TypeScript and development tools

### 1.3 Verify Project Structure

Your project should have:
```
services/twitch-ingestion-service/
├── src/
│   ├── auth/
│   │   ├── TwitchAuth.ts      # OAuth token management
│   │   └── types.ts           # Token types
│   ├── config/
│   │   └── config.ts          # Configuration management
│   ├── kafka/
│   │   ├── Producer.ts         # Kafka producer
│   │   └── MessageSerializer.ts
│   ├── twitch/
│   │   ├── TwitchClient.ts    # Twitch IRC client
│   │   └── MessageParser.ts   # Message parsing
│   ├── types/
│   │   ├── index.ts           # Core types
│   │   └── twitch-events.ts   # Twitch event structure
│   ├── utils/
│   │   └── logger.ts          # Logger setup
│   └── index.ts               # Main entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Step 2: Twitch OAuth Setup

### 2.1 Create Twitch Application

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Sign in with your Twitch account
3. Click "Register Your Application"
4. Fill in the form:
   - **Name:** ChatBattle Ingestion Service
   - **OAuth Redirect URLs:** `http://localhost:3000/auth/callback`
     - ⚠️ **Important:** Must match EXACTLY (protocol, port, path)
   - **Category:** Chat Bot
5. Click "Create"
6. Click "Manage" on your application
7. Click "New Secret" to generate a Client Secret
8. Note your **Client ID** and **Client Secret**

### 2.2 Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```bash
# Twitch Configuration
TWITCH_CHANNEL=your_channel_name          # Channel to monitor (without #)
TWITCH_USERNAME=your_bot_username          # Optional: Bot username (filters self messages)
TWITCH_CLIENT_ID=your_client_id           # From Twitch Developer Console
TWITCH_CLIENT_SECRET=your_client_secret   # From Twitch Developer Console
TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback
TWITCH_SCOPES=chat:read

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_CHAT_MESSAGES=twitch-chat-messages
KAFKA_CLIENT_ID=twitch-ingestion-service

# Logging
LOG_LEVEL=info
```

**Note:** `TWITCH_OAUTH_TOKEN` is optional if using automatic token refresh (recommended).

---

## Step 3: Authenticate with Twitch (One-Time Setup)

### 3.1 Start Authentication Server

```bash
npm run auth
```

You should see:
```
Twitch auth server running on http://localhost:3000
Visit http://localhost:3000/auth to authenticate.
```

### 3.2 Complete OAuth Flow

1. Open your browser and visit: `http://localhost:3000/auth`
2. You'll be redirected to Twitch authorization page
3. Click "Authorize" to grant permissions
4. You'll be redirected back to `http://localhost:3000/auth/callback`
5. You should see: "Tokens saved successfully."

### 3.3 Verify Token Storage

Check that `tokenStore.json` was created:

```bash
ls -la tokenStore.json
```

The file should contain:
```json
{
  "accessToken": "oauth:...",
  "refreshToken": "...",
  "expiresAt": 1234567890
}
```

### 3.4 Stop Authentication Server

Press `Ctrl+C` to stop the auth server. You only need to run this once.

---

## Step 4: Verify Infrastructure is Running

### 4.1 Check Kafka is Running

```bash
docker ps | grep kafka
```

You should see `chatbattle-kafka` running.

### 4.2 Verify Kafka Topic Exists

```bash
docker exec chatbattle-kafka kafka-topics --list --bootstrap-server localhost:9092
```

You should see `twitch-chat-messages` in the list.

### 4.3 Test Kafka Consumer (Optional)

In a separate terminal, start a consumer to see messages:

```bash
docker exec -it chatbattle-kafka kafka-console-consumer \
  --topic twitch-chat-messages \
  --from-beginning \
  --bootstrap-server localhost:9092
```

Keep this running to see messages as they arrive.

---

## Step 5: Start the Ingestion Service

### 5.1 Development Mode (Recommended)

```bash
npm run dev
```

This starts the service with auto-reload on file changes.

### 5.2 Production Mode

```bash
npm run build
npm start
```

### 5.3 Expected Output

You should see logs like:

```
[INFO] Starting Twitch Ingestion Service...
[INFO] Configuration loaded
[INFO] Connecting to Kafka...
[INFO] Kafka producer connected
[INFO] Kafka producer ready
[INFO] Connecting to Twitch IRC...
[INFO] Connected to Twitch IRC successfully
[INFO] Service started successfully
```

---

## Step 6: Verify Message Flow

### 6.1 Send Test Message

1. Open the Twitch channel you configured (`TWITCH_CHANNEL`)
2. Send a message in chat
3. Check the service logs - you should see message processing

### 6.2 Verify in Kafka

If you have the Kafka consumer running (from Step 4.3), you should see JSON messages like:

```json
{"channel_id":"your_channel","user_id":"123456","username":"viewer123","message":"Hello!","timestamp":1234567890,"emotes":[]}
```

### 6.3 Verify Message Format

Messages should be valid JSON with:
- `channel_id` (string)
- `user_id` (string)
- `username` (string)
- `message` (string)
- `timestamp` (number, Unix milliseconds)
- `emotes` (array of strings)

---

## Step 7: Test Reconnection

### 7.1 Simulate Connection Loss

1. Stop the service (`Ctrl+C`)
2. Wait a few seconds
3. Restart: `npm run dev`

The service should:
- Attempt to reconnect to Twitch
- Reconnect to Kafka
- Resume message ingestion

### 7.2 Verify Exponential Backoff

If connection fails, check logs for increasing retry delays:
- First retry: ~1 second
- Second retry: ~2 seconds
- Third retry: ~4 seconds
- And so on (max 60 seconds)

---

## Troubleshooting

### Issue: "Failed to get Twitch access token"

**Symptoms:**
- Error when starting service
- No `tokenStore.json` file

**Solutions:**
1. Run `npm run auth` to start authentication server
2. Complete OAuth flow at `http://localhost:3000/auth`
3. Verify `tokenStore.json` exists and contains valid tokens
4. Check `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env`

### Issue: "Kafka producer not connected"

**Symptoms:**
- Service can't connect to Kafka
- Error logs about Kafka connection

**Solutions:**
1. Verify Kafka is running: `docker ps | grep kafka`
2. Check Kafka is accessible: `telnet localhost 9092`
3. Verify `KAFKA_BROKERS` in `.env` matches your setup
4. Check Kafka logs: `docker logs chatbattle-kafka`

### Issue: "Cannot connect to Twitch IRC"

**Symptoms:**
- Service starts but doesn't receive messages
- Connection errors in logs

**Solutions:**
1. Verify `TWITCH_CHANNEL` is correct (no `#` prefix)
2. Check token is valid: `cat tokenStore.json`
3. Verify channel exists and is live
4. Check Twitch IRC status: https://status.twitch.tv/
5. Try regenerating token: `npm run auth`

### Issue: Messages not appearing in Kafka

**Symptoms:**
- Service connects successfully
- No messages in Kafka topic

**Solutions:**
1. Verify channel has active chat (send a test message)
2. Check service logs for errors
3. Verify Kafka topic exists: `docker exec chatbattle-kafka kafka-topics --list --bootstrap-server localhost:9092`
4. Check if `TWITCH_USERNAME` is set and filtering your own messages
5. Verify message format: Check logs for parsing errors

### Issue: Token expired

**Symptoms:**
- Service was working but stopped receiving messages
- 401 errors in logs

**Solutions:**
1. The service should auto-refresh tokens
2. If refresh fails, run `npm run auth` again
3. Check `tokenStore.json` has valid `refreshToken`
4. Verify `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are correct

### Issue: "Redirect URI mismatch"

**Symptoms:**
- OAuth flow fails with 403 error
- "Redirect URI mismatch" error

**Solutions:**
1. Verify redirect URI in `.env` matches Twitch Developer Console EXACTLY:
   - Protocol: `http://` (not `https://`)
   - Port: `:3000`
   - Path: `/auth/callback`
2. Update Twitch Developer Console if needed
3. Try OAuth flow again

---

## Verification Checklist

Before proceeding to Milestone 3, verify:

### Service Setup
- [ ] Project dependencies installed
- [ ] TypeScript compiles without errors
- [ ] Environment variables configured
- [ ] `.env` file created from `.env.example`

### Twitch Authentication
- [ ] Twitch application created in Developer Console
- [ ] Client ID and Secret configured
- [ ] OAuth flow completed successfully
- [ ] `tokenStore.json` file exists with valid tokens
- [ ] Token refresh works automatically

### Service Functionality
- [ ] Service starts without errors
- [ ] Connects to Kafka successfully
- [ ] Connects to Twitch IRC successfully
- [ ] Receives messages from Twitch channel
- [ ] Messages are published to Kafka topic
- [ ] Message format is correct JSON
- [ ] Reconnection works after disconnection

### Message Flow
- [ ] Messages appear in Kafka topic
- [ ] Message structure matches expected format
- [ ] Timestamps are correct (Unix milliseconds)
- [ ] Channel ID is correct
- [ ] User IDs and usernames are captured
- [ ] Emotes array is populated (if present)

### Error Handling
- [ ] Service handles Kafka connection failures gracefully
- [ ] Service handles Twitch connection failures gracefully
- [ ] Exponential backoff reconnection works
- [ ] Token refresh works automatically
- [ ] Errors are logged appropriately

---

## Next Steps

Once all verification checks pass, you're ready for:

### Milestone 3: Stream Processing & Storage
- Build Kafka Streams service (Scala)
- Consume messages from `twitch-chat-messages` topic
- Process and aggregate messages
- Write raw messages to Cassandra
- Produce aggregated stats to `channel-stats` topic

---

## Additional Resources

- [Twitch IRC Guide](https://dev.twitch.tv/docs/irc/)
- [Twitch OAuth Documentation](https://dev.twitch.tv/docs/authentication)
- [@tmi.js/chat Documentation](https://github.com/tmijs/tmi.js/tree/main/packages/chat)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Pino Logger Documentation](https://getpino.io/)

---

## Support

If you encounter issues not covered in this guide:

1. Check service logs: Look for error messages
2. Review `services/twitch-ingestion-service/README.md` for detailed documentation
3. Verify all prerequisites are met
4. Check Twitch Developer Console for application status
5. Verify infrastructure is running (Milestone 1)

---

## Architecture Overview

```
┌─────────────┐
│   Twitch    │
│     IRC     │
└──────┬──────┘
       │
       │ Messages
       ▼
┌─────────────┐
│ TwitchClient│
│ (@tmi.js)   │
└──────┬──────┘
       │
       │ Parsed Messages
       ▼
┌─────────────┐
│MessageParser│
└──────┬──────┘
       │
       │ ChatMessage
       ▼
┌─────────────┐
│KafkaProducer│
│  (kafkajs)  │
└──────┬──────┘
       │
       │ JSON Messages
       ▼
┌─────────────┐
│    Kafka    │
│   Topic:    │
│twitch-chat- │
│  messages   │
└─────────────┘
```

**Components:**
- **TwitchClient** - Manages IRC connection with automatic reconnection
- **MessageParser** - Transforms Twitch IRC messages to ChatMessage format
- **KafkaProducer** - Publishes messages to Kafka topic
- **TwitchAuth** - Handles OAuth token refresh (runs separately)

---

## Message Format

Messages published to Kafka follow this JSON structure:

```json
{
  "channel_id": "channel123",
  "user_id": "user456",
  "username": "viewer123",
  "message": "Hello chat!",
  "timestamp": 1234567890,
  "emotes": ["Kappa", "PogChamp"]
}
```

**Kafka Message:**
- **Key:** `channel_id` (for partitioning)
- **Value:** JSON string of ChatMessage
- **Topic:** `twitch-chat-messages`

---

## Available Twitch Event Fields

The service receives rich event data from Twitch IRC. While we currently only extract a subset of fields, **all available fields are documented** in `src/types/twitch-events.ts` for future enhancements:

- Channel info (ID, login name)
- User info (ID, display name, login, color, badges, roles)
- Message info (ID, text, emotes, flags, action messages)
- IRC tags (timestamps, room IDs, client nonce, etc.)

See `src/types/twitch-events.ts` for complete type definitions.


