# Quick Start Guide

Get the ChatBattle infrastructure up and running in minutes.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8+
- At least 4GB RAM available
- Basic command line familiarity

## Initial Setup

### Create Environment File

Create a `.env` file from the example template:

```bash
# Copy the example file
cp .env.example .env
```

The `.env` file contains configuration for:

- Kafka connection settings
- Cassandra connection settings
- Docker network name

**Note:** The `.env` file is gitignored for security. The default values in `.env.example` work for local development and typically don't need to be changed.

**Sample `.env` file:**

```bash
# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_INTERNAL_BOOTSTRAP_SERVERS=kafka:29092

# Cassandra Configuration
CASSANDRA_HOSTS=localhost:9042
CASSANDRA_KEYSPACE=twitch_chat

# Docker Network
DOCKER_NETWORK=chatbattle-network
```

## Start Infrastructure

### Option 1: Using Helper Script (Recommended)

```bash
# Start all infrastructure services
./scripts/start-infrastructure.sh
```

### Option 2: Using Docker Compose Directly

```bash
docker-compose up -d
```

This will start:

- **Zookeeper** (port 2181) - Required for Kafka
- **Kafka** (port 9092) - Message broker
- **Cassandra** (port 9042) - Database
- **Init containers** - Automatically create topics and schema

## Verify Setup

### Check Service Health

```bash
./scripts/check-health.sh
```

You should see:

- ✅ Zookeeper is healthy
- ✅ Kafka is healthy
  - ✅ twitch-chat-messages topic exists
  - ✅ channel-stats topic exists
- ✅ Cassandra is healthy
  - ✅ twitch_chat keyspace exists
  - ✅ raw_chat_messages table exists

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kafka
docker-compose logs -f cassandra
```

### Check Service Status

```bash
docker-compose ps
```

All services should show as "Up" (init containers will show as "Exited" which is normal).

## Test the Setup

### Test Kafka

**Produce a test message:**

```bash
docker exec -it chatbattle-kafka kafka-console-producer \
  --topic twitch-chat-messages \
  --bootstrap-server localhost:9092
```

Type a message and press Enter. Press Ctrl+C to exit.

**Consume messages:**

```bash
docker exec -it chatbattle-kafka kafka-console-consumer \
  --topic twitch-chat-messages \
  --from-beginning \
  --bootstrap-server localhost:9092
```

### Test Cassandra

**Connect to Cassandra:**

```bash
docker exec -it chatbattle-cassandra cqlsh
```

**Test write:**

```cql
INSERT INTO twitch_chat.raw_chat_messages
(channel_id, timestamp, message_id, user_id, username, message, emotes)
VALUES ('test_channel', 1234567890, uuid(), 'user123', 'testuser', 'Hello!', ['Kappa']);
```

**Test read:**

```cql
SELECT * FROM twitch_chat.raw_chat_messages WHERE channel_id = 'test_channel';
```

Exit cqlsh:

```cql
exit;
```

## Stop Infrastructure

### Option 1: Using Helper Script

```bash
./scripts/stop-infrastructure.sh
```

### Option 2: Using Docker Compose

```bash
docker-compose down
```

## Reset Infrastructure (Delete All Data)

⚠️ **Warning:** This will delete all data!

```bash
./scripts/reset-infrastructure.sh
```

## Common Commands

| Command                             | Description                |
| ----------------------------------- | -------------------------- |
| `./scripts/start-infrastructure.sh` | Start all services         |
| `./scripts/stop-infrastructure.sh`  | Stop all services          |
| `./scripts/check-health.sh`         | Check service health       |
| `./scripts/reset-infrastructure.sh` | Reset (delete all data)    |
| `docker-compose logs -f`            | View all logs              |
| `docker-compose ps`                 | List service status        |
| `docker-compose down`               | Stop and remove containers |

## Troubleshooting

### Services won't start

1. Check Docker Desktop is running
2. Verify ports are not in use:
   ```bash
   lsof -i :2181  # Zookeeper
   lsof -i :9092  # Kafka
   lsof -i :9042  # Cassandra
   ```
3. Check service logs: `docker-compose logs [service-name]`

### Topics not created

1. Wait 30-60 seconds after Kafka starts
2. Check init container logs: `docker logs chatbattle-kafka-init`
3. Create topics manually (see [infrastructure/README.md](infrastructure/README.md))

### Schema not created

1. Wait 60+ seconds after Cassandra starts
2. Check init container logs: `docker logs chatbattle-cassandra-init`
3. Create schema manually (see [infrastructure/README.md](infrastructure/README.md))

## Next Steps

Once infrastructure is running:

1. **Milestone 2:** Build the Twitch Ingestion Service
2. **Milestone 3:** Build the Stream Processing Service
3. **Milestone 4:** Build the API Service
4. **Milestone 5:** Build the Frontend

For detailed setup instructions, see:

- [Milestone 1 Infrastructure Guide](docs/Phase%201/Milestone1_Infrastructure_Guide.md)
- [Infrastructure README](infrastructure/README.md)

## Getting Help

- Check service logs: `docker-compose logs -f [service-name]`
- Review [infrastructure/README.md](infrastructure/README.md) for detailed documentation
- See [Milestone 1 Infrastructure Guide](docs/Phase%201/Milestone1_Infrastructure_Guide.md) for troubleshooting
