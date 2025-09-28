#!/bin/bash

# Batch processing script for PLY files
# This script makes it easy to crop all PLY files with common settings

echo "🎯 NYC Scans V3 - PLY File Cropper"
echo "=================================="
echo

# Default settings
SOURCE_DIR="./original_splats"
DEST_DIR="./public/splats" 
CROP_BOUNDS="-3,3,-3,3,-3,3"

# Check if Python script exists
if [ ! -f "crop_ply_files.py" ]; then
    echo "❌ Error: crop_ply_files.py not found!"
    exit 1
fi

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source directory $SOURCE_DIR not found!"
    echo "Please create it and add your PLY files."
    exit 1
fi

# Count PLY files
PLY_COUNT=$(find "$SOURCE_DIR" -name "*.ply" | wc -l)

if [ "$PLY_COUNT" -eq 0 ]; then
    echo "❌ No PLY files found in $SOURCE_DIR"
    echo "Please add some PLY files to process."
    exit 1
fi

echo "📊 Found $PLY_COUNT PLY file(s) to process"
echo "📁 Source: $SOURCE_DIR"
echo "📁 Destination: $DEST_DIR"
echo "✂️  Crop bounds: $CROP_BOUNDS"
echo

# Ask for confirmation
read -p "Continue with processing? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo "🚀 Starting processing..."
echo

# Run the Python cropping script
python3 crop_ply_files.py --source "$SOURCE_DIR" --dest "$DEST_DIR" --crop "$CROP_BOUNDS"

echo
echo "✅ Processing complete!"
echo "💡 Cropped files are now available in $DEST_DIR"
echo "💡 You can now serve these files for better performance."