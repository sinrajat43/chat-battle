#!/bin/bash

# Stop Infrastructure Script
# Stops all infrastructure services

set -e

echo "Stopping ChatBattle infrastructure services..."
docker-compose down

echo ""
echo "Infrastructure services stopped!"


