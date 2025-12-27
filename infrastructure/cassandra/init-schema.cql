-- Cassandra Schema Initialization Script
-- This script creates the keyspace and table for the ChatBattle application

-- Create keyspace
CREATE KEYSPACE IF NOT EXISTS twitch_chat
WITH REPLICATION = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

-- Use the keyspace
USE twitch_chat;

-- Create raw_chat_messages table
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


