#!/bin/bash
echo "Starting build process..."
# Download models first
node scripts/downloadModels.mjs
# Run Vite build
npx vite build
echo "Build complete!"
