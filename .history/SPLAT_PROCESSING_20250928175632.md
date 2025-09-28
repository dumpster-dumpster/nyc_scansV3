# NYC Scans V3 - Splat File Processing

This project has been updated to use pre-cropped splat files for better performance. Instead of cropping files on-the-fly during loading, we now crop them ahead of time using a Python script.

## Directory Structure

- `original_splats/` - Place your original, uncropped PLY files here
- `public/splats/` - Cropped and optimized PLY files for hosting
- `crop_ply_files.py` - Python script for cropping PLY files

## Quick Start

1. **Add your original PLY files** to the `original_splats/` directory

2. **Install Python dependencies** (if needed):
   ```bash
   # No additional dependencies required - uses only Python standard library
   ```

3. **Crop your files**:
   ```bash
   python crop_ply_files.py
   ```

4. **Or with custom settings**:
   ```bash
   python crop_ply_files.py --source ./original_splats --dest ./public/splats --crop -3,3,-3,3,-3,3
   ```

## Cropping Script Options

- `--source` - Source directory containing original PLY files (default: `./original_splats`)
- `--dest` - Destination directory for cropped files (default: `./public/splats`) 
- `--crop` - Crop bounds as `minX,maxX,minY,maxY,minZ,maxZ` (default: `-3,3,-3,3,-3,3`)
- `--pattern` - File pattern to match (default: `*.ply`)

## Benefits of Pre-cropping

- **Faster loading times** - Smaller files load much faster
- **Reduced bandwidth** - Less data to transfer
- **Better performance** - No client-side cropping overhead
- **Consistent experience** - Same crop bounds applied to all files

## What Changed

The JavaScript viewer (`src/splatViewer.js`) no longer performs cropping operations. The crop filtering logic has been removed to improve runtime performance. All cropping is now done offline using the Python script.

## Example Workflow

```bash
# 1. Add your PLY files to original_splats/
cp ~/Downloads/scan1.ply original_splats/
cp ~/Downloads/scan2.ply original_splats/

# 2. Crop them for hosting
python crop_ply_files.py

# 3. Your cropped files are now in public/splats/ ready for hosting
```

The cropped files will be significantly smaller and load much faster in the viewer.