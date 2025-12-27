# Milestone 1: Infrastructure Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the complete infrastructure stack for Phase 1 MVP. This includes Docker Compose configuration, Kafka cluster with topics, and Cassandra database with schema.

**Goal:** All infrastructure services running, topics created, Cassandra schema ready  
**Estimated Time:** 1-2 days  
**Dependencies:** None

---

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8+ installed
- At least 4GB of available RAM
- At least 10GB of available disk space
- Basic familiarity with Docker and command line

---

## Step 1: Docker Compose Setup

### 1.1 Verify Docker is Running

```bash
docker --version
docker-compose --version
docker ps
```

### 1.2 Start Infrastructure Services

From the project root:

```bash
docker-compose up -d
```

Or use the helper script:

```bash
./scripts/start-infrastructure.sh
```

### 1.3 Verify Services are Starting

```bash
docker-compose ps
```

You should see:
- `chatbattle-zookeeper` - Up
- `chatbattle-kafka` - Up (may take 30-60 seconds)
- `chatbattle-kafka-init` - Exited (0) - This is normal, it creates topics
- `chatbattle-cassandra` - Up (may take 60+ seconds)
- `chatbattle-cassandra-init` - Exited (0) - This is normal, it creates schema

### 1.4 Check Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kafka
docker-compose logs -f cassandra
```

---

## Step 2: Verify Kafka Topics

### 2.1 Wait for Kafka to be Ready

Kafka may take 30-60 seconds to fully start. Wait until you see:

```
kafka_1  | [2024-01-01 12:00:00,000] INFO Kafka version: X.X.X (org.apache.kafka.common.utils.AppInfoParser)
kafka_1  | [2024-01-01 12:00:00,000] INFO Kafka commitId: xxxxx (org.apache.kafka.common.utils.AppInfoParser)
```

### 2.2 Check Topics Were Created

```bash
docker exec chatbattle-kafka kafka-topics --list --bootstrap-server localhost:9092
```

You should see:
- `twitch-chat-messages`
- `channel-stats`

### 2.3 Verify Topic Configuration

```bash
# Check twitch-chat-messages topic
docker exec chatbattle-kafka kafka-topics --describe \
  --topic twitch-chat-messages \
  --bootstrap-server localhost:9092

# Check channel-stats topic
docker exec chatbattle-kafka kafka-topics --describe \
  --topic channel-stats \
  --bootstrap-server localhost:9092
```

### 2.4 Test Message Production/Consumption

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

You should see the message you produced. Press Ctrl+C to exit.

---

## Step 3: Verify Cassandra Schema

### 3.1 Wait for Cassandra to be Ready

Cassandra may take 60+ seconds to fully start. Wait until you see:

```
cassandra_1  | Starting listening for CQL clients on /0.0.0.0:9042
```

### 3.2 Check Keyspace Exists

```bash
docker exec -it chatbattle-cassandra cqlsh -e "DESCRIBE KEYSPACE twitch_chat;"
```

You should see the keyspace definition with replication settings.

### 3.3 Check Table Exists

```bash
docker exec -it chatbattle-cassandra cqlsh -e "DESCRIBE TABLE twitch_chat.raw_chat_messages;"
```

You should see the table schema with all columns and settings.

### 3.4 Test Write Operation

```bash
docker exec -it chatbattle-cassandra cqlsh
```

Then execute:
```cql
INSERT INTO twitch_chat.raw_chat_messages 
(channel_id, timestamp, message_id, user_id, username, message, emotes)
VALUES ('test_channel', 1234567890, uuid(), 'user123', 'testuser', 'Hello!', ['Kappa']);
```

### 3.5 Test Read Operation

Still in cqlsh:
```cql
SELECT * FROM twitch_chat.raw_chat_messages WHERE channel_id = 'test_channel';
```

You should see the row you just inserted.

### 3.6 Verify TTL

```cql
SELECT channel_id, timestamp, message, TTL(message) FROM twitch_chat.raw_chat_messages;
```

The TTL should show seconds remaining (should be close to 604800 for 7 days).

Exit cqlsh:
```cql
exit;
```

---

## Step 4: Health Check

Run the health check script:

```bash
./scripts/check-health.sh
```

All services should show as healthy:
- ✅ Zookeeper is healthy
- ✅ Kafka is healthy
  - ✅ twitch-chat-messages topic exists
  - ✅ channel-stats topic exists
- ✅ Cassandra is healthy
  - ✅ twitch_chat keyspace exists
  - ✅ raw_chat_messages table exists

---

## Step 5: Test Data Persistence

### 5.1 Write Test Data

**Kafka:**
```bash
docker exec -it chatbattle-kafka kafka-console-producer \
  --topic twitch-chat-messages \
  --bootstrap-server localhost:9092
```
Type a few messages, then Ctrl+C.

**Cassandra:**
```bash
docker exec -it chatbattle-cassandra cqlsh
```
```cql
INSERT INTO twitch_chat.raw_chat_messages 
(channel_id, timestamp, message_id, user_id, username, message, emotes)
VALUES ('persist_test', 1234567891, uuid(), 'user456', 'testuser2', 'Test persistence!', ['PogChamp']);
exit;
```

### 5.2 Stop Services

```bash
docker-compose down
```

### 5.3 Start Services Again

```bash
docker-compose up -d
```

Wait for services to be ready (30-60 seconds).

### 5.4 Verify Data Persisted

**Kafka:** Messages should still be available (within retention period)

**Cassandra:**
```bash
docker exec -it chatbattle-cassandra cqlsh -e "SELECT * FROM twitch_chat.raw_chat_messages WHERE channel_id = 'persist_test';"
```

You should see the row you inserted.

---

## Troubleshooting

### Issue: Kafka won't start

**Symptoms:**
- Container keeps restarting
- Logs show connection errors to Zookeeper

**Solutions:**
1. Check Zookeeper is running: `docker ps | grep zookeeper`
2. Check Zookeeper logs: `docker logs chatbattle-zookeeper`
3. Verify port 9092 is not in use: `lsof -i :9092`
4. Restart: `docker-compose restart kafka`

### Issue: Topics not created

**Symptoms:**
- `kafka-topics --list` shows no topics
- Init container exited with error

**Solutions:**
1. Check init container logs: `docker logs chatbattle-kafka-init`
2. Wait 30-60 seconds after Kafka starts
3. Create topics manually (see infrastructure/README.md)
4. Restart init container: `docker-compose up kafka-init`

### Issue: Cassandra won't start

**Symptoms:**
- Container keeps restarting
- Logs show memory errors

**Solutions:**
1. Check available memory (need ~2GB)
2. Check logs: `docker logs chatbattle-cassandra`
3. Verify port 9042 is not in use: `lsof -i :9042`
4. Increase Docker Desktop memory allocation
5. Wait 60+ seconds for initialization

### Issue: Schema not created

**Symptoms:**
- Keyspace or table doesn't exist
- Init container exited with error

**Solutions:**
1. Check init container logs: `docker logs chatbattle-cassandra-init`
2. Wait 60+ seconds after Cassandra starts
3. Create schema manually (see infrastructure/README.md)
4. Restart init container: `docker-compose up cassandra-init`

### Issue: Services can't communicate

**Symptoms:**
- Connection refused errors
- Timeout errors

**Solutions:**
1. Verify all services on same network: `docker network inspect chatbattle-network`
2. Use service names (not localhost) for inter-service communication
3. Check service names match docker-compose.yml
4. Restart network: `docker network prune` then `docker-compose up -d`

---

## Verification Checklist

Before proceeding to Milestone 2, verify:

### Infrastructure Services
- [ ] Zookeeper running and healthy
- [ ] Kafka running and healthy
- [ ] Cassandra running and healthy
- [ ] All services can communicate
- [ ] Services start in correct order
- [ ] Services can be stopped cleanly

### Kafka Topics
- [ ] `twitch-chat-messages` topic exists
  - [ ] 3 partitions
  - [ ] Replication factor 1
  - [ ] Retention policy set
- [ ] `channel-stats` topic exists
  - [ ] 3 partitions
  - [ ] Replication factor 1
  - [ ] Log compaction enabled
- [ ] Can produce messages to topics
- [ ] Can consume messages from topics

### Cassandra Schema
- [ ] `twitch_chat` keyspace exists
  - [ ] Replication strategy: SimpleStrategy
  - [ ] Replication factor: 1
- [ ] `raw_chat_messages` table exists
  - [ ] Correct schema (partition key, clustering keys)
  - [ ] TTL set to 7 days
  - [ ] Compaction strategy configured
  - [ ] Clustering order: timestamp DESC
- [ ] Can write data to table
- [ ] Can read data from table
- [ ] TTL expiration works

### Data Persistence
- [ ] Kafka data persists after restart
- [ ] Cassandra data persists after restart
- [ ] Volumes are properly mounted

---

## Next Steps

Once all verification checks pass, you're ready for:

### Milestone 2: Data Ingestion Pipeline
- Build Twitch Ingestion Service
- Connect to Twitch IRC
- Publish messages to `twitch-chat-messages` topic
- Test message flow

### Milestone 3: Stream Processing & Storage
- Build Kafka Streams service
- Consume from `twitch-chat-messages`
- Write to Cassandra
- Produce to `channel-stats` topic

---

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Cassandra Documentation](https://cassandra.apache.org/doc/latest/)

---

## Support

If you encounter issues not covered in this guide:

1. Check service logs: `docker-compose logs -f [service-name]`
2. Review infrastructure/README.md for common commands
3. Verify all prerequisites are met
4. Check Docker Desktop has sufficient resources allocated


