#!/bin/sh

# Check if node_modules directory does not exist
if [ ! -d "node_modules" ]; then
  # Install dependencies if node_modules is missing
  npm install
fi

# Execute the CMD passed as arguments to the script
exec "$@"
