# Cassandra Infrastructure

This directory contains Cassandra schema initialization scripts and configuration.

## Files

- `init-schema.cql` - CQL script to create keyspace and table
- `init-schema.sh` - Shell script that waits for Cassandra and executes CQL
- `README.md` - This file

## Schema

### Keyspace: twitch_chat
- **Replication Strategy:** SimpleStrategy
- **Replication Factor:** 1

### Table: raw_chat_messages
- **Partition Key:** channel_id
- **Clustering Keys:** timestamp DESC, message_id
- **TTL:** 7 days (604800 seconds)
- **Compaction:** TimeWindowCompactionStrategy

## Manual Schema Creation

If schema wasn't created automatically, you can create it manually:

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

Or execute the CQL file directly:
```bash
docker exec -i chatbattle-cassandra cqlsh < infrastructure/cassandra/init-schema.cql
```

## Verification

Check keyspace exists:
```bash
docker exec -it chatbattle-cassandra cqlsh -e "DESCRIBE KEYSPACE twitch_chat;"
```

Check table exists:
```bash
docker exec -it chatbattle-cassandra cqlsh -e "DESCRIBE TABLE twitch_chat.raw_chat_messages;"
```

Test write:
```bash
docker exec -it chatbattle-cassandra cqlsh
```
```cql
INSERT INTO twitch_chat.raw_chat_messages 
(channel_id, timestamp, message_id, user_id, username, message, emotes)
VALUES ('test_channel', 1234567890, uuid(), 'user123', 'testuser', 'Hello!', ['Kappa']);
```

Test read:
```cql
SELECT * FROM twitch_chat.raw_chat_messages WHERE channel_id = 'test_channel';
```


