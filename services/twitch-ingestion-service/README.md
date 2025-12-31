# Twitch Ingestion Service

Service that connects to Twitch IRC chat and publishes messages to Kafka.

## Overview

This service:

- Connects to Twitch IRC chat for a specified channel
- Parses incoming chat messages
- Transforms messages to the ChatMessage format
- Publishes messages to the `twitch-chat-messages` Kafka topic

## Prerequisites

- Node.js 18+
- Docker (if running in container)
- Twitch OAuth token (see setup instructions below)
- Kafka running (from Milestone 1)

## Getting Started with Automatic Token Refresh

**🎉 New Feature:** This service now supports **automatic OAuth token refresh**! After a one-time setup, tokens will refresh automatically, so you never need to manually update them again.

### Step 1: Create a Twitch Application

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Sign in with your Twitch account
3. Click "Register Your Application"
4. Fill in the form:
   - **Name:** ChatBattle Ingestion Service (or any name)
   - **OAuth Redirect URLs:** `http://localhost:3000/auth/callback` (required for OAuth flow)
     - **⚠️ Important:** The redirect URI must match EXACTLY, including the protocol (`http://`), port (`:3000`), and path (`/auth/callback`)
   - **Category:** Chat Bot
5. Click "Create"
6. **Important:** Click "Manage" on your application
7. Click "New Secret" to generate a Client Secret
8. Note your **Client ID** and **Client Secret** (you'll need both)

### Step 2: Configure Environment

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Twitch credentials:
   ```bash
   TWITCH_CHANNEL=your_channel_name
   TWITCH_USERNAME=your_bot_username
   TWITCH_CLIENT_ID=your_client_id_here
   TWITCH_CLIENT_SECRET=your_client_secret_here
   TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback
   TWITCH_SCOPES=chat:read
   ```

### Step 3: Authenticate (One-Time Setup)

1. **Start the authentication server:**

   ```bash
   npm run auth
   ```

2. **Open your browser** and visit: `http://localhost:3000/auth`
   - This will redirect you to Twitch
   - Click "Authorize" to approve the connection
   - You'll be redirected back and see: "Authentication successful! You can close this window."

3. **Stop the auth server** (Ctrl+C)
   - A `tokenStore.json` file has been created with your tokens
   - **Important:** This file contains sensitive tokens - it's already in `.gitignore`

### Step 4: Run the Service

Now you can run the service normally. It will automatically refresh tokens when they expire!

```bash
npm run dev
```

---

## Legacy: Manual Token Generation (Optional)

If you prefer to use a static token instead of automatic refresh:

#### Option A: Using the Helper Script

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Client ID and Secret:

   ```bash
   TWITCH_CLIENT_ID=your_client_id_here
   TWITCH_CLIENT_SECRET=your_client_secret_here
   ```

3. Run the token generator script:

   ```bash
   npm run generate-token
   ```

   Or directly:

   ```bash
   node scripts/generate-token.js
   ```

4. Follow the prompts:
   - The script will open a URL in your browser
   - Authorize the application
   - Copy the authorization code from the redirect URL
   - Paste it into the script
   - The script will generate your OAuth token

5. Copy the generated token to your `.env` file:
   ```bash
   TWITCH_OAUTH_TOKEN=oauth:generated_token_here
   ```

#### Option B: Manual OAuth Flow

1. Get your Client ID from the Twitch Developer Console

2. Open this URL in your browser (replace `YOUR_CLIENT_ID`):

   ```
   https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&response_type=code&scope=chat:read
   ```

3. Authorize the application

4. You'll be redirected to: `http://localhost?code=AUTHORIZATION_CODE`

5. Copy the `code` parameter from the URL

6. Exchange the code for a token using curl:

   ```bash
   curl -X POST https://id.twitch.tv/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=AUTHORIZATION_CODE" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=http://localhost"
   ```

7. Copy the `access_token` from the response and add `oauth:` prefix:

   ```bash
   TWITCH_OAUTH_TOKEN=oauth:access_token_here
   ```

8. **Configure your `.env` file:**
   - Copy `.env.example` to `.env` if you haven't already
   - Add your static token:
     ```bash
     TWITCH_CHANNEL=your_channel_name  # Without the # prefix
     TWITCH_USERNAME=your_bot_username
     TWITCH_OAUTH_TOKEN=oauth:your_token_here
     ```

**Note:** When using a static token, `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are **optional**. They're only required if you want to use automatic token refresh.

## Local Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

### Authentication Server

```bash
# Start the OAuth authentication server (one-time setup)
npm run auth
```

Visit `http://localhost:3000/auth` in your browser to authenticate.

## Docker

### Build Image

```bash
docker build -t twitch-ingestion-service .
```

### Run Container

```bash
docker run --rm \
  --env-file .env \
  --network chatbattle-network \
  twitch-ingestion-service
```

## Configuration

### Environment Variables

**Note:** Variables marked with `*` are conditionally required:

- **For automatic token refresh:** `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are required, `TWITCH_OAUTH_TOKEN` is optional
- **For static token:** `TWITCH_OAUTH_TOKEN` is required, `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are optional

| Variable                    | Required | Default                               | Description                                           |
| --------------------------- | -------- | ------------------------------------- | ----------------------------------------------------- |
| `TWITCH_CHANNEL`            | Yes      | -                                     | Twitch channel name (without #)                       |
| `TWITCH_USERNAME`           | Yes      | -                                     | Bot username                                          |
| `TWITCH_OAUTH_TOKEN`        | No\*     | -                                     | OAuth token (required if NOT using auto-refresh)      |
| `TWITCH_CLIENT_ID`          | No\*     | -                                     | Twitch Client ID (required if using auto-refresh)     |
| `TWITCH_CLIENT_SECRET`      | No\*     | -                                     | Twitch Client Secret (required if using auto-refresh) |
| `TWITCH_REDIRECT_URI`       | No       | `http://localhost:3000/auth/callback` | OAuth redirect URI                                    |
| `TWITCH_SCOPES`             | No       | `chat:read`                           | OAuth scopes (space-separated)                        |
| `TWITCH_AUTH_PORT`          | No       | `3000`                                | Port for OAuth auth server                            |
| `KAFKA_BROKERS`             | No       | `localhost:9092`                      | Kafka broker addresses (comma-separated)              |
| `KAFKA_TOPIC_CHAT_MESSAGES` | No       | `twitch-chat-messages`                | Kafka topic name                                      |
| `KAFKA_CLIENT_ID`           | No       | `twitch-ingestion-service`            | Kafka client ID                                       |
| `LOG_LEVEL`                 | No       | `info`                                | Log level (debug, info, warn, error)                  |
| `NODE_ENV`                  | No       | `development`                         | Node environment                                      |

## Message Format

Messages are published to Kafka in the following format:

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

## Twitch Event Structure

The service receives rich event data from Twitch IRC via `@tmi.js/chat`. While we currently only extract a subset of fields for the Kafka message, **all available fields are documented** in `src/types/twitch-events.ts`.

### Available Fields

The raw Twitch event includes:

- **Channel Info:** Channel ID, login name
- **User Info:** User ID, display name, login, color, badges (mod, subscriber, VIP, broadcaster, etc.)
- **Message Info:** Message ID, text, emotes, flags, action messages, first message indicator
- **Tags:** IRC tags including timestamps, room IDs, client nonce, and more
- **Shared Chat:** Information for shared chat channels

### Future Enhancements

The `ExtendedChatMessage` interface in `src/types/twitch-events.ts` shows all fields that could be added to the Kafka message format in future phases:

- User badges and roles (mod, subscriber, VIP, etc.)
- Display names (with capitalization)
- User colors
- Message IDs
- First message indicators
- Action messages (/me commands)
- And more...

See `src/types/twitch-events.ts` for the complete type definitions and field descriptions.

## Architecture

```
Twitch IRC → TwitchClient → MessageParser → KafkaProducer → Kafka Topic
                ↑
         TwitchAuth (token refresh)
```

### Components

- **TwitchClient** - Manages IRC connection with automatic reconnection (uses `@tmi.js/chat`)
- **TwitchAuth** - Handles OAuth authentication and automatic token refresh
- **MessageParser** - Parses Twitch messages to ChatMessage format
- **KafkaProducer** - Publishes messages to Kafka with error handling
- **MessageSerializer** - Serializes messages to JSON

## Error Handling

### Twitch Connection Errors

- Automatic reconnection with exponential backoff (1s → 60s max)
- Logs connection status and errors
- Handles rate limiting gracefully

### Kafka Producer Errors

- Retries with exponential backoff
- Logs errors with message context
- Service continues running on transient errors

## Monitoring

### Logs

The service logs:

- Connection status (connected/disconnected)
- Message processing (debug level)
- Errors with context
- Reconnection attempts

### Health Check

Currently no HTTP health endpoint (can be added in Phase 2).

Check service health via:

- Docker logs: `docker logs chatbattle-twitch-ingestion`
- Process status: `docker ps | grep twitch-ingestion`

## Troubleshooting

### "TWITCH_OAUTH_TOKEN must start with 'oauth:'"

Make sure your token includes the `oauth:` prefix:

```bash
TWITCH_OAUTH_TOKEN=oauth:your_actual_token_here
```

### Token Expiration

**With Automatic Token Refresh (Recommended):**

- Tokens refresh automatically - no action needed!
- The service checks token expiration and refreshes before expiry
- If refresh fails, check your `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env`

**With Manual Token (Legacy):**

- If your token expires, use the helper script again: `npm run generate-token`
- Or follow the manual OAuth flow steps
- Update `TWITCH_OAUTH_TOKEN` in your `.env` file

### "Failed to connect to Twitch"

**If using automatic token refresh:**

1. Make sure you've run `npm run auth` and authorized the application
2. Verify `tokenStore.json` exists in the service directory
3. Check that `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are set in `.env`
4. If you see "Failed to get Twitch access token", run `npm run auth` again

**If using static token:**

1. Verify OAuth token is valid and not expired
2. Check token format: must start with `oauth:`
3. Check channel name is correct (no # prefix)
4. Verify bot username matches token
5. Check network connectivity

### "Error fetching tokens" (403 Forbidden)

If you see a 403 error when running `npm run auth`, this usually means:

1. **Redirect URI mismatch** (most common):
   - The redirect URI in your Twitch app settings must match EXACTLY: `http://localhost:3000/auth/callback`
   - Check your Twitch Developer Console → Your App → OAuth Redirect URLs
   - It must include: protocol (`http://`), host (`localhost`), port (`:3000`), and path (`/auth/callback`)
   - No trailing slashes or extra characters

2. **Authorization code expired**:
   - Authorization codes expire quickly (usually within 1 minute)
   - If you took too long between authorization and token exchange, try again

3. **Authorization code already used**:
   - Each code can only be used once
   - If you see this error, start the auth flow again: `npm run auth`

4. **Client Secret incorrect**:
   - Verify your `TWITCH_CLIENT_SECRET` in `.env` matches the one in Twitch Developer Console
   - Make sure you copied the entire secret (no extra spaces or line breaks)

**Solution:**

- Double-check your redirect URI in Twitch app settings matches exactly: `http://localhost:3000/auth/callback`
- Make sure your `.env` has the correct `TWITCH_REDIRECT_URI` value
- Try the authorization flow again from the beginning

### "Kafka producer not connected"

1. Verify Kafka is running: `docker ps | grep kafka`
2. Check Kafka is accessible: `telnet localhost 9092`
3. Verify topic exists: `docker exec chatbattle-kafka kafka-topics --list --bootstrap-server localhost:9092`
4. Check network: Ensure service is on `chatbattle-network`

### Messages not appearing in Kafka

1. Check service logs: `docker logs chatbattle-twitch-ingestion`
2. Verify Twitch connection: Look for "Connected to Twitch IRC" in logs
3. Verify Kafka connection: Look for "Kafka producer connected" in logs
4. Check Kafka topic: `docker exec chatbattle-kafka kafka-console-consumer --topic twitch-chat-messages --from-beginning --bootstrap-server localhost:9092`

## Testing

### Manual Testing

1. Start infrastructure: `docker-compose up -d`
2. Start service: `npm run dev` or via Docker
3. Send a message in the Twitch channel
4. Verify message in Kafka:
   ```bash
   docker exec -it chatbattle-kafka kafka-console-consumer \
     --topic twitch-chat-messages \
     --from-beginning \
     --bootstrap-server localhost:9092
   ```

### Verify Message Format

Messages should be valid JSON with all required fields:

- `channel_id` (string)
- `user_id` (string)
- `username` (string)
- `message` (string)
- `timestamp` (number, Unix milliseconds)
- `emotes` (array of strings)

## Next Steps

After this service is working:

- **Milestone 3:** Stream Processing Service (consumes from Kafka, processes, stores in Cassandra)
- **Milestone 4:** API Service (serves stats to frontend)
