# Kafka Infrastructure

This directory contains Kafka topic initialization scripts and configuration.

## Files

- `init-topics.sh` - Script to create required Kafka topics
- `README.md` - This file

## Topics

### twitch-chat-messages
- **Purpose:** Raw chat messages from Twitch channels
- **Partitions:** 3
- **Replication Factor:** 1
- **Retention:** 7 days (604800000 ms)
- **Cleanup Policy:** delete

### channel-stats
- **Purpose:** Aggregated statistics per channel
- **Partitions:** 3
- **Replication Factor:** 1
- **Retention:** 1 day (86400000 ms)
- **Cleanup Policy:** compact
- **Config:** min.cleanable.dirty.ratio=0.1

## Manual Topic Creation

If topics weren't created automatically, you can create them manually:

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

## Verification

List all topics:
```bash
docker exec chatbattle-kafka kafka-topics --list --bootstrap-server localhost:9092
```

Describe a topic:
```bash
docker exec chatbattle-kafka kafka-topics --describe \
  --topic twitch-chat-messages \
  --bootstrap-server localhost:9092
```


