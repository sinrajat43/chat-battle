# Infrastructure Overview

This directory contains the infrastructure setup for the ChatBattle project, including Docker Compose configuration, Kafka topics, and Cassandra schema.

## Components

### Zookeeper
- **Purpose:** Required for Kafka cluster coordination
- **Port:** 2181
- **Image:** `confluentinc/cp-zookeeper:latest`
- **Data:** Persisted in `zookeeper-data` volume

### Kafka
- **Purpose:** Message broker for event streaming
- **Ports:** 
  - 9092 (external access)
  - 29092 (internal Docker network)
- **Image:** `confluentinc/cp-kafka:latest`
- **Data:** Persisted in `kafka-data` volume
- **Topics:**
  - `twitch-chat-messages`: Raw chat messages from Twitch
  - `channel-stats`: Aggregated statistics per channel

### Cassandra
- **Purpose:** Time-series database for storing chat messages
- **Ports:**
  - 9042 (CQL)
  - 7000 (inter-node communication)
  - 7001 (TLS)
- **Image:** `cassandra:4.1`
- **Data:** Persisted in `cassandra-data` volume
- **Keyspace:** `twitch_chat`
- **Table:** `raw_chat_messages`

## Port Mappings

| Service | Port | Purpose |
|---------|------|---------|
| Zookeeper | 2181 | Client connections |
| Kafka | 9092 | External client access |
| Kafka | 29092 | Internal Docker network |
| Cassandra | 9042 | CQL client connections |
| Cassandra | 7000 | Inter-node communication |
| Cassandra | 7001 | TLS inter-node communication |

## Network Configuration

- **Network Name:** `chatbattle-network`
- **Driver:** bridge
- **Purpose:** Enables service-to-service communication using service names

## Volume Mounts

All data is persisted in Docker volumes:

- `zookeeper-data`: Zookeeper data directory
- `zookeeper-logs`: Zookeeper logs
- `kafka-data`: Kafka data and logs
- `cassandra-data`: Cassandra data directory

## Environment Variables

See `.env.example` in the project root for required environment variables.

## Startup Order

Services start in the following order:

1. **Zookeeper** - Must start first
2. **Kafka** - Depends on Zookeeper
3. **Kafka Init** - Creates topics after Kafka is ready
4. **Cassandra** - Independent of Kafka
5. **Cassandra Init** - Creates schema after Cassandra is ready

## Common Commands

### Start Infrastructure
```bash
docker-compose up -d
# or
./scripts/start-infrastructure.sh
```

### Stop Infrastructure
```bash
docker-compose down
# or
./scripts/stop-infrastructure.sh
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kafka
docker-compose logs -f cassandra
```

### Check Health
```bash
./scripts/check-health.sh
```

### Reset (Delete All Data)
```bash
./scripts/reset-infrastructure.sh
```

## Kafka Topics

### twitch-chat-messages
- **Partitions:** 3
- **Replication Factor:** 1
- **Retention:** 7 days
- **Cleanup Policy:** delete

### channel-stats
- **Partitions:** 3
- **Replication Factor:** 1
- **Retention:** 1 day
- **Cleanup Policy:** compact

### Manual Topic Creation

If topics weren't created automatically:

```bash
# Create twitch-chat-messages topic
docker exec chatbattle-kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic twitch-chat-messages \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete

# Create channel-stats topic
docker exec chatbattle-kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic channel-stats \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=86400000 \
  --config cleanup.policy=compact \
  --config min.cleanable.dirty.ratio=0.1
```

### List Topics
```bash
docker exec chatbattle-kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Describe Topic
```bash
docker exec chatbattle-kafka kafka-topics --describe \
  --topic twitch-chat-messages \
  --bootstrap-server localhost:9092
```

## Cassandra Schema

### Keyspace: twitch_chat
- **Replication Strategy:** SimpleStrategy
- **Replication Factor:** 1

### Table: raw_chat_messages
- **Partition Key:** channel_id
- **Clustering Keys:** timestamp DESC, message_id
- **TTL:** 7 days (604800 seconds)
- **Compaction:** TimeWindowCompactionStrategy

### Manual Schema Creation

If schema wasn't created automatically:

```bash
docker exec -it chatbattle-cassandra cqlsh -f /init-schema.cql
```

Or connect and run manually:

```bash
docker exec -it chatbattle-cassandra cqlsh
```

Then execute:
```cql
CREATE KEYSPACE IF NOT EXISTS twitch_chat
WITH REPLICATION = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

USE twitch_chat;

CREATE TABLE IF NOT EXISTS twitch_chat.raw_chat_messages (
    channel_id TEXT,
    timestamp BIGINT,
    message_id UUID,
    user_id TEXT,
    username TEXT,
    message TEXT,
    emotes LIST<TEXT>,
    PRIMARY KEY ((channel_id), timestamp, message_id)
) WITH CLUSTERING ORDER BY (timestamp DESC)
  AND default_time_to_live = 604800
  AND compaction = {
    'class': 'TimeWindowCompactionStrategy',
    'compaction_window_unit': 'DAYS',
    'compaction_window_size': 1
  };
```

### Verify Schema
```bash
docker exec -it chatbattle-cassandra cqlsh -e "DESCRIBE KEYSPACE twitch_chat;"
docker exec -it chatbattle-cassandra cqlsh -e "DESCRIBE TABLE twitch_chat.raw_chat_messages;"
```

## Troubleshooting

### Kafka won't start
- Check Zookeeper is running: `docker ps | grep zookeeper`
- Check Kafka logs: `docker logs chatbattle-kafka`
- Verify port 9092 is not in use: `lsof -i :9092`

### Cassandra won't start
- Check logs: `docker logs chatbattle-cassandra`
- Verify sufficient memory (Cassandra needs ~2GB)
- Check port 9042 is not in use: `lsof -i :9042`
- Wait 60+ seconds for Cassandra to fully initialize

### Topics not created
- Wait for Kafka to be fully ready (30-60 seconds)
- Check init container logs: `docker logs chatbattle-kafka-init`
- Create topics manually (see above)

### Schema not created
- Wait for Cassandra to be fully ready (60+ seconds)
- Check init container logs: `docker logs chatbattle-cassandra-init`
- Create schema manually (see above)

### Services can't communicate
- Verify all services are on the same network: `docker network inspect chatbattle-network`
- Check service names match docker-compose service names
- Use service names (not localhost) for inter-service communication

## Resource Requirements

- **Zookeeper:** ~256MB RAM
- **Kafka:** ~512MB RAM
- **Cassandra:** ~1-2GB RAM
- **Total:** ~2-3GB RAM recommended

## Next Steps

After infrastructure is set up, proceed to:
- **Milestone 2:** Data Ingestion Pipeline
- **Milestone 3:** Stream Processing & Storage


