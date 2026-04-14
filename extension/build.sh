#!/usr/bin/env bash
set -euo pipefail

# Build script for Chrome extension
# Generates the appropriate manifest.json based on environment (dev or prod)

ENV="${1:-dev}"

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 [dev|prod]"
  echo "  dev  - Development mode (includes localhost in host_permissions)"
  echo "  prod - Production mode (removes localhost from host_permissions)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_MANIFEST="${SCRIPT_DIR}/manifest.${ENV}.json"
TARGET_MANIFEST="${SCRIPT_DIR}/manifest.json"

if [[ ! -f "$SOURCE_MANIFEST" ]]; then
  echo "Error: Source manifest not found at $SOURCE_MANIFEST"
  exit 1
fi

echo "Building extension for environment: $ENV"
cp "$SOURCE_MANIFEST" "$TARGET_MANIFEST"
echo "Manifest copied: manifest.${ENV}.json -> manifest.json"
echo "Extension is ready for $ENV environment."
