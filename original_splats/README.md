# Original Splat Files

Place your original, uncropped PLY files in this directory.

These files will be processed by the `crop_ply_files.py` script to create optimized versions in the `public/splats/` directory.

## Instructions

1. Copy your PLY files here
2. Run: `python crop_ply_files.py`
3. Cropped files will appear in `public/splats/`

Example files might include:
- `scan_001.ply`
- `building_exterior.ply`
- `mailbox_scan.ply`

The cropping script will filter vertices based on spatial bounds to reduce file sizes and improve loading performance.