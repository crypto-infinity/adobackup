#!/bin/sh

if ! command -v git >/dev/null 2>&1; then
  echo "Git not found, installing..."
  apt-get update && apt-get install -y git
else
  echo "Git already available."
fi

exec npm start