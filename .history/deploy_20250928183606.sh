#!/bin/bash

# Deployment script for NYC Scans V3
# This script builds the project and prepares it for deployment

echo "🚀 Building NYC Scans V3 for deployment..."
echo "======================================"

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📁 Built files are in the 'dist' directory:"
echo "├── index.html"
echo "├── assets/"
echo "│   ├── index-*.css"
echo "│   └── index-*.js"
echo "├── splats/"
echo "└── vite.svg"
echo ""
echo "🔧 To deploy:"
echo "1. Upload the contents of the 'dist' folder to your server"
echo "2. Make sure the files are accessible at https://nycscans.com/nyc_scansV3/"
echo ""
echo "💡 The app expects to be served from the '/nyc_scansV3/' path"
echo "   as configured in vite.config.js"