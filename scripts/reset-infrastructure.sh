#!/bin/bash

# Reset Infrastructure Script
# Stops all services and removes volumes (WARNING: This deletes all data!)

set -e

read -p "This will delete all data. Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Reset cancelled."
  exit 0
fi

echo "Stopping services and removing volumes..."
docker-compose down -v

echo ""
echo "Infrastructure reset complete!"
echo "All data has been deleted."


