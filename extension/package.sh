#!/usr/bin/env bash
set -euo pipefail

# Package script for Chrome Web Store submission
# Builds the extension in prod mode and creates a clean zip

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Run production build
echo "Running production build..."
"${SCRIPT_DIR}/build.sh" prod

# 2. Read version from generated manifest.json
VERSION=$(grep -o '"version": *"[^"]*"' "${SCRIPT_DIR}/manifest.json" | head -1 | grep -o '"[^"]*"$' | tr -d '"')
if [[ -z "$VERSION" ]]; then
  echo "Error: Could not read version from manifest.json"
  exit 1
fi

ZIP_NAME="jobtracker-${VERSION}.zip"
ZIP_PATH="${SCRIPT_DIR}/${ZIP_NAME}"

# 3. Remove previous zip if it exists
rm -f "$ZIP_PATH"

# 4. Create zip with only the necessary files
echo "Creating ${ZIP_NAME}..."
cd "$SCRIPT_DIR"
zip -r "$ZIP_PATH" \
  manifest.json \
  config.js \
  debug.js \
  background/ \
  content/ \
  popup/ \
  utils/ \
  assets/ \
  PRIVACY.md \
  -x "node_modules/*" \
  -x "scripts/*"

echo ""
echo "Package created: ${ZIP_PATH}"
echo "Version: ${VERSION}"
echo ""
echo "Contents:"
unzip -l "$ZIP_PATH" | tail -n +4 | head -n -2
