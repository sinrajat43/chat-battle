#!/bin/bash

# Start Infrastructure Script
# Starts all infrastructure services (Zookeeper, Kafka, Cassandra)

set -e

echo "Starting ChatBattle infrastructure services..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 5

echo ""
echo "Infrastructure services started!"
echo ""
echo "Services:"
echo "  - Zookeeper: localhost:2181"
echo "  - Kafka: localhost:9092"
echo "  - Cassandra: localhost:9042"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To check health: ./scripts/check-health.sh"
echo "To stop: ./scripts/stop-infrastructure.sh"


