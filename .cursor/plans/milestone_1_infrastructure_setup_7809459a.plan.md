---
name: "Milestone 1: Infrastructure Setup"
overview: Set up all infrastructure components (Docker Compose, Zookeeper, Kafka, Cassandra) including topic creation and schema setup. This is the foundation for all subsequent milestones.
todos:
  - id: m1-docker-compose
    content: Create docker-compose.yml with Zookeeper, Kafka, and Cassandra services
    status: pending
  - id: m1-env-setup
    content: Set up environment variables (.env and .env.example files)
    status: pending
  - id: m1-kafka-topics
    content: Create Kafka topics initialization script (twitch-chat-messages and channel-stats)
    status: pending
    dependencies:
      - m1-docker-compose
  - id: m1-cassandra-schema
    content: Create Cassandra schema initialization script (keyspace and table)
    status: pending
    dependencies:
      - m1-docker-compose
  - id: m1-verification
    content: Verify all services, topics, and schema are working correctly
    status: pending
    dependencies:
      - m1-kafka-topics
      - m1-cassandra-schema
  - id: m1-documentation
    content: Create infrastructure documentation and milestone guide
    status: pending
    dependencies:
      - m1-verification
  - id: m1-helper-scripts
    content: Create helper scripts for starting/stopping/checking infrastructure
    status: pending
    dependencies:
      - m1-docker-compose
---

# Milestone 1: Infrastructure Setup - Execution Plan

## Overview

Set up the complete infrastructure stack for Phase 1 MVP. This includes Docker Compose configuration, Kafka cluster with topics, and Cassandra database with schema. This milestone has no dependencies and must be completed before any service development.**Goal:** All infrastructure services running, topics created, Cassandra schema ready**Estimated Time:** 1-2 days**Dependencies:** None---

## Project Structure

```javascript
ChatBattle/
├── docker-compose.yml          # Main orchestration file
├── .env                        # Environment variables
├── .env.example                # Example env file
├── infrastructure/
│   ├── kafka/
│   │   ├── init-topics.sh      # Script to create Kafka topics
│   │   └── README.md           # Kafka setup docs
│   ├── cassandra/
│   │   ├── init-schema.cql     # CQL script for keyspace/table
│   │   └── README.md           # Cassandra setup docs
│   └── README.md               # Infrastructure overview
└── docs/
    └── Phase 1/
        └── Milestone1_Infrastructure_Guide.md  # Detailed guide
```

---

## Step 1: Docker Compose Setup

### 1.1 Create docker-compose.yml

**Location:** `docker-compose.yml` (project root)**Services to configure:**

- Zookeeper (required for Kafka)
- Kafka (message broker)
- Cassandra (database)

**Key Configuration:**

- Service dependencies (Zookeeper → Kafka)
- Network configuration
- Volume mounts for data persistence
- Environment variables
- Health checks
- Port mappings

**Implementation Tasks:**

- [ ] Create docker-compose.yml file
- [ ] Configure Zookeeper service
- Image: `confluentinc/cp-zookeeper:latest`
- Port: 2181
- Environment: ZOOKEEPER_CLIENT_PORT, ZOOKEEPER_TICK_TIME
- Volume: zookeeper-data
- [ ] Configure Kafka service
- Image: `confluentinc/cp-kafka:latest`
- Ports: 9092 (internal), 9093 (external)
- Depends on: zookeeper
- Environment: KAFKA_BROKER_ID, KAFKA_ZOOKEEPER_CONNECT, KAFKA_ADVERTISED_LISTENERS
- Volume: kafka-data
- [ ] Configure Cassandra service
- Image: `cassandra:4.1`
- Ports: 9042 (CQL), 7000 (inter-node), 7001 (TLS)
- Environment: CASSANDRA_CLUSTER_NAME, CASSANDRA_DC, CASSANDRA_RACK
- Volume: cassandra-data
- [ ] Set up Docker network
- Network name: `chatbattle-network`
- Driver: bridge
- [ ] Configure volumes for data persistence
- zookeeper-data
- kafka-data
- cassandra-data
- [ ] Add health checks for each service
- [ ] Test: `docker-compose up -d` starts all services
- [ ] Test: `docker-compose down` stops all services cleanly

---

## Step 2: Environment Variables

### 2.1 Create .env file

**Location:** `.env` (project root, gitignored)**Variables needed:**

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

### 2.2 Create .env.example

**Location:** `.env.example` (committed to git)**Purpose:** Template for other developers**Tasks:**

- [ ] Create .env file with local values
- [ ] Create .env.example with placeholder values
- [ ] Add .env to .gitignore
- [ ] Document environment variables in README

---

## Step 3: Kafka Topics Setup

### 3.1 Create Topic Initialization Script

**Location:** `infrastructure/kafka/init-topics.sh`**Purpose:** Automatically create required Kafka topics on startup**Topics to create:**

1. **twitch-chat-messages**

- Partitions: 3
- Replication factor: 1
- Retention: 7 days (604800000 ms)
- Config: cleanup.policy=delete

2. **channel-stats**

- Partitions: 3
- Replication factor: 1
- Retention: 1 day (86400000 ms)
- Config: cleanup.policy=compact, min.cleanable.dirty.ratio=0.1

**Implementation Tasks:**

- [ ] Create init-topics.sh script
- [ ] Add script to wait for Kafka to be ready
- [ ] Use kafka-topics command to create topics
- [ ] Add script to docker-compose.yml (init container or entrypoint)
- [ ] Test topic creation manually
- [ ] Verify topics exist using: `docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092`

**Alternative Approach:**

- Use Kafka init container in docker-compose
- Or create topics manually after first startup
- Document manual creation steps

---

## Step 4: Cassandra Schema Setup

### 4.1 Create Schema Initialization Script

**Location:** `infrastructure/cassandra/init-schema.cql`**Purpose:** Create keyspace and table schema**Schema to create:**

1. **Keyspace: twitch_chat**

   ```cql
      CREATE KEYSPACE IF NOT EXISTS twitch_chat
      WITH REPLICATION = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      };
   ```

2. **Table: raw_chat_messages**
   ```cql
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

**Implementation Tasks:**

- [ ] Create init-schema.cql file
- [ ] Add CQL script execution to docker-compose (init container)
- [ ] Test schema creation manually using cqlsh
- [ ] Verify table exists: `docker exec -it cassandra cqlsh -e "DESCRIBE KEYSPACE twitch_chat;"`
- [ ] Test write operation
- [ ] Test read operation
- [ ] Verify TTL configuration

**Alternative Approach:**

- Execute CQL manually after Cassandra starts
- Use docker exec to run cqlsh commands
- Document manual setup steps

---

## Step 5: Verification & Testing

### 5.1 Service Health Checks

**Tasks:**

- [ ] Verify Zookeeper is running
- Command: `docker exec zookeeper nc -zv localhost 2181`
- Or: `echo ruok | nc localhost 2181` (should return "imok")
- [ ] Verify Kafka is running
- Command: `docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092`
- Check logs: `docker logs kafka`
- [ ] Verify Cassandra is running
- Command: `docker exec cassandra nodetool status`
- Check logs: `docker logs cassandra`
- Connect: `docker exec -it cassandra cqlsh`

### 5.2 Kafka Topic Verification

**Tasks:**

- [ ] List all topics: `docker exec kafka kafka-topics --list --bootstrap-server localhost:9092`
- [ ] Describe topic: `docker exec kafka kafka-topics --describe --topic twitch-chat-messages --bootstrap-server localhost:9092`
- [ ] Test message production:

  ```bash
    docker exec -it kafka kafka-console-producer \
      --topic twitch-chat-messages \
      --bootstrap-server localhost:9092
  ```

- [ ] Test message consumption:

  ```bash
    docker exec -it kafka kafka-console-consumer \
      --topic twitch-chat-messages \
      --from-beginning \
      --bootstrap-server localhost:9092
  ```

- [ ] Verify partitioning strategy

### 5.3 Cassandra Verification

**Tasks:**

- [ ] Connect to Cassandra: `docker exec -it cassandra cqlsh`
- [ ] Verify keyspace exists: `DESCRIBE KEYSPACE twitch_chat;`
- [ ] Verify table exists: `DESCRIBE TABLE twitch_chat.raw_chat_messages;`
- [ ] Test write operation:

  ```cql
    INSERT INTO twitch_chat.raw_chat_messages
    (channel_id, timestamp, message_id, user_id, username, message, emotes)
    VALUES ('test_channel', 1234567890, uuid(), 'user123', 'testuser', 'Hello!', ['Kappa']);
  ```

- [ ] Test read operation:

  ```cql
    SELECT * FROM twitch_chat.raw_chat_messages WHERE channel_id = 'test_channel';
  ```

- [ ] Verify TTL: `SELECT channel_id, timestamp, message, TTL(message) FROM twitch_chat.raw_chat_messages;`
- [ ] Test query patterns (time range queries)

### 5.4 Network Communication

**Tasks:**

- [ ] Verify services can communicate on Docker network
- [ ] Test Kafka connection from host: `telnet localhost 9092`
- [ ] Test Cassandra connection from host: `telnet localhost 9042`
- [ ] Verify service discovery (using service names in docker-compose)

### 5.5 Data Persistence

**Tasks:**

- [ ] Write test data to Kafka
- [ ] Write test data to Cassandra
- [ ] Stop all services: `docker-compose down`
- [ ] Start services again: `docker-compose up -d`
- [ ] Verify data persists (Kafka messages, Cassandra data)

---

## Step 6: Documentation

### 6.1 Infrastructure Documentation

**Location:** `infrastructure/README.md`**Content:**

- Overview of infrastructure components
- Service descriptions
- Port mappings
- Network configuration
- Volume mounts
- Environment variables
- Startup/shutdown procedures
- Troubleshooting guide

**Tasks:**

- [ ] Create infrastructure/README.md
- [ ] Document each service (Zookeeper, Kafka, Cassandra)
- [ ] Document port mappings
- [ ] Document volume mounts
- [ ] Create troubleshooting section
- [ ] Add common commands reference

### 6.2 Milestone 1 Guide

**Location:** `docs/Phase 1/Milestone1_Infrastructure_Guide.md`**Content:**

- Step-by-step setup instructions
- Configuration details
- Verification procedures
- Common issues and solutions
- Next steps (Milestone 2)

**Tasks:**

- [ ] Create detailed milestone guide
- [ ] Include all configuration examples
- [ ] Add verification checklist
- [ ] Document troubleshooting steps

---

## Step 7: Cleanup & Optimization

### 7.1 Docker Compose Optimization

**Tasks:**

- [ ] Add resource limits (CPU, memory) for each service
- [ ] Configure restart policies
- [ ] Optimize volume mounts
- [ ] Add logging configuration
- [ ] Review and optimize health checks

### 7.2 Script Automation

**Tasks:**

- [ ] Create helper scripts:
- `scripts/start-infrastructure.sh` - Start all services
- `scripts/stop-infrastructure.sh` - Stop all services
- `scripts/reset-infrastructure.sh` - Reset (remove volumes)
- `scripts/check-health.sh` - Health check all services
- [ ] Make scripts executable
- [ ] Document script usage

---

## Verification Checklist

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

## Common Issues & Solutions

### Issue: Kafka won't start

- **Solution:** Check Zookeeper is running first
- **Solution:** Verify KAFKA_ADVERTISED_LISTENERS is correct
- **Solution:** Check port 9092 is not in use

### Issue: Cassandra won't start

- **Solution:** Check port 9042 is not in use
- **Solution:** Verify sufficient memory (Cassandra needs ~2GB)
- **Solution:** Check disk space

### Issue: Topics not created

- **Solution:** Wait for Kafka to be fully ready (30-60 seconds)
- **Solution:** Create topics manually using kafka-topics command
- **Solution:** Check init script has proper wait logic

### Issue: Schema not created

- **Solution:** Wait for Cassandra to be fully ready (60+ seconds)
- **Solution:** Execute CQL manually using cqlsh
- **Solution:** Check init script execution

---

## Next Steps

After completing Milestone 1:

1. **Milestone 2:** Data Ingestion Pipeline

- Can now connect services to Kafka
- Can test message production
- Can verify messages in topics

2. **Milestone 3:** Stream Processing

- Can consume from `twitch-chat-messages` topic
- Can write to Cassandra
- Can produce to `channel-stats` topic

---

## Files to Create

1. `docker-compose.yml` - Main orchestration
2. `.env` - Environment variables (gitignored)
3. `.env.example` - Environment template
4. `infrastructure/kafka/init-topics.sh` - Topic creation script
5. `infrastructure/cassandra/init-schema.cql` - Schema definition
6. `infrastructure/README.md` - Infrastructure docs
7. `docs/Phase 1/Milestone1_Infrastructure_Guide.md` - Detailed guide
8. `scripts/start-infrastructure.sh` - Helper script
9. `scripts/stop-infrastructure.sh` - Helper script
10. `scripts/check-health.sh` - Health check script

---

## Success Criteria

✅ All infrastructure services start successfully✅ Kafka topics are created and accessible✅ Cassandra schema is created and accessible✅ Can produce/consume messages from Kafka✅ Can read/write data to Cassandra✅ Data persists after service restarts✅ Documentation is complete
