#!/bin/bash

# Cassandra Schema Initialization Script
# This script waits for Cassandra to be ready and then creates the schema

set -e

CASSANDRA_HOST="cassandra"
CASSANDRA_PORT=9042
CQL_FILE="/init-schema.cql"
MAX_RETRIES=60
RETRY_INTERVAL=2

echo "Waiting for Cassandra to be ready..."

# Wait for Cassandra to be ready
for i in $(seq 1 $MAX_RETRIES); do
  if cqlsh $CASSANDRA_HOST $CASSANDRA_PORT -e "DESCRIBE KEYSPACES;" > /dev/null 2>&1; then
    echo "Cassandra is ready!"
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    echo "Cassandra failed to become ready after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Waiting for Cassandra... ($i/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

echo "Creating Cassandra schema..."
cqlsh $CASSANDRA_HOST $CASSANDRA_PORT -f $CQL_FILE

echo "Verifying schema was created..."
cqlsh $CASSANDRA_HOST $CASSANDRA_PORT -e "DESCRIBE KEYSPACE twitch_chat;"
cqlsh $CASSANDRA_HOST $CASSANDRA_PORT -e "DESCRIBE TABLE twitch_chat.raw_chat_messages;"

echo "Schema creation completed successfully!"


