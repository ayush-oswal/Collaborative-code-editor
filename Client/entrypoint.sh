#!/bin/sh

if [ ! -d "node_modules" ]; then
  npm install
fi

exec "$@"
