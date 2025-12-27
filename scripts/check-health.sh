#!/bin/bash

# Health Check Script
# Checks the health of all infrastructure services

set -e

echo "Checking ChatBattle infrastructure health..."
echo ""

# Check Zookeeper
echo "Checking Zookeeper..."
if docker exec chatbattle-zookeeper nc -z localhost 2181 > /dev/null 2>&1; then
  echo "  ✅ Zookeeper is healthy"
else
  echo "  ❌ Zookeeper is not responding"
fi

# Check Kafka
echo "Checking Kafka..."
if docker exec chatbattle-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
  echo "  ✅ Kafka is healthy"
  
  # Check topics
  echo "  Checking topics..."
  TOPICS=$(docker exec chatbattle-kafka kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null)
  if echo "$TOPICS" | grep -q "twitch-chat-messages"; then
    echo "    ✅ twitch-chat-messages topic exists"
  else
    echo "    ❌ twitch-chat-messages topic not found"
  fi
  if echo "$TOPICS" | grep -q "channel-stats"; then
    echo "    ✅ channel-stats topic exists"
  else
    echo "    ❌ channel-stats topic not found"
  fi
else
  echo "  ❌ Kafka is not responding"
fi

# Check Cassandra
echo "Checking Cassandra..."
if docker exec chatbattle-cassandra nodetool status > /dev/null 2>&1; then
  echo "  ✅ Cassandra is healthy"
  
  # Check keyspace
  echo "  Checking schema..."
  if docker exec chatbattle-cassandra cqlsh -e "DESCRIBE KEYSPACE twitch_chat;" > /dev/null 2>&1; then
    echo "    ✅ twitch_chat keyspace exists"
    if docker exec chatbattle-cassandra cqlsh -e "DESCRIBE TABLE twitch_chat.raw_chat_messages;" > /dev/null 2>&1; then
      echo "    ✅ raw_chat_messages table exists"
    else
      echo "    ❌ raw_chat_messages table not found"
    fi
  else
    echo "    ❌ twitch_chat keyspace not found"
  fi
else
  echo "  ❌ Cassandra is not responding"
fi

echo ""
echo "Health check complete!"


