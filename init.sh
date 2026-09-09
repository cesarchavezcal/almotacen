#!/bin/bash
set -e

echo "=== Harness Initialization: almotacen ==="

echo "=== Checking Project Files & Configuration ==="
if [ -f "package.json" ]; then
    echo "  ✓ package.json present (Expo / React Native / TypeScript)"
fi

if [ -f "app.json" ]; then
    echo "  ✓ app.json present"
fi

if [ -d "node_modules" ]; then
    echo "=== Running Typecheck ==="
    npm run typecheck
    echo "=== Running Unit & Behavioral Tests ==="
    npm test
fi

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
