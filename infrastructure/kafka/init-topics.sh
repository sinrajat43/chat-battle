#!/bin/bash

# Kafka Topics Initialization Script
# This script creates the required Kafka topics for the ChatBattle application

set -e

KAFKA_BOOTSTRAP_SERVER="kafka:29092"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "Waiting for Kafka to be ready..."

# Wait for Kafka to be ready
for i in $(seq 1 $MAX_RETRIES); do
  if kafka-broker-api-versions --bootstrap-server $KAFKA_BOOTSTRAP_SERVER > /dev/null 2>&1; then
    echo "Kafka is ready!"
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    echo "Kafka failed to become ready after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Waiting for Kafka... ($i/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

echo "Creating Kafka topics..."

# Create twitch-chat-messages topic
echo "Creating topic: twitch-chat-messages"
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVER \
  --topic twitch-chat-messages \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete \
  --if-not-exists

# Create channel-stats topic
echo "Creating topic: channel-stats"
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVER \
  --topic channel-stats \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=86400000 \
  --config cleanup.policy=compact \
  --config min.cleanable.dirty.ratio=0.1 \
  --if-not-exists

echo "Verifying topics were created..."
kafka-topics --list --bootstrap-server $KAFKA_BOOTSTRAP_SERVER

echo "Topic creation completed successfully!"


