#!/usr/bin/env python3
"""
PLY File Cropper

This script processes PLY files by applying spatial crop bounds to reduce file sizes
and improve loading performance. It reads PLY files from a source directory,
applies the specified crop bounds, and saves the cropped files to a destination directory.

Usage:
    python crop_ply_files.py [--source SOURCE_DIR] [--dest DEST_DIR] [--crop minX,maxX,minY,maxY,minZ,maxZ]

Example:
    python crop_ply_files.py --source ./original_splats --dest ./public/splats --crop -3,3,-3,3,-3,3
"""

import os
import sys
import argparse
import struct
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PLYCropper:
    def __init__(self, crop_bounds=None):
        """
        Initialize PLY cropper with crop bounds.
        
        Args:
            crop_bounds (dict): Dictionary with keys minX, maxX, minY, maxY, minZ, maxZ
        """
        self.crop_bounds = crop_bounds or {
            'minX': -3, 'maxX': 3,
            'minY': -3, 'maxY': 3, 
            'minZ': -3, 'maxZ': 3
        }
        logger.info(f"Crop bounds: {self.crop_bounds}")
    
    def parse_ply_header(self, file_content):
        """
        Parse PLY file header to extract vertex information.
        
        Args:
            file_content (bytes): Raw PLY file content
            
        Returns:
            tuple: (vertex_count, properties, header_end_index)
        """
        # Decode header (first 10KB should be enough)
        header_text = file_content[:10240].decode('utf-8', errors='ignore')
        header_end = "end_header\n"
        header_end_index = header_text.find(header_end)
        
        if header_end_index < 0:
            raise ValueError("Unable to read .ply file header")
        
        # Extract vertex count
        import re
        vertex_match = re.search(r'element vertex (\d+)', header_text)
        if not vertex_match:
            raise ValueError("Could not find vertex count in header")
        
        vertex_count = int(vertex_match.group(1))
        
        # Parse properties
        properties = []
        property_lines = [line for line in header_text[:header_end_index].split('\n') 
                         if line.startswith('property ')]
        
        row_offset = 0
        offsets = {}
        types = {}
        
        TYPE_MAP = {
            'double': ('d', 8),
            'int': ('i', 4),
            'uint': ('I', 4),
            'float': ('f', 4),
            'short': ('h', 2),
            'ushort': ('H', 2),
            'uchar': ('B', 1),
        }
        
        for prop_line in property_lines:
            parts = prop_line.split(' ')
            if len(parts) >= 3:
                prop_type = parts[1]
                prop_name = parts[2]
                
                if prop_type in TYPE_MAP:
                    struct_char, byte_size = TYPE_MAP[prop_type]
                    types[prop_name] = (struct_char, byte_size)
                    offsets[prop_name] = row_offset
                    row_offset += byte_size
                    properties.append((prop_name, prop_type))
        
        return vertex_count, properties, offsets, types, row_offset, header_end_index + len(header_end)
    
    def read_vertex_data(self, file_content, data_start, vertex_count, offsets, types, row_size):
        """
        Read and parse vertex data from PLY file.
        
        Returns:
            list: List of vertex dictionaries
        """
        vertices = []
        
        for i in range(vertex_count):
            vertex_start = data_start + i * row_size
            vertex = {}
            
            for prop_name, (struct_char, byte_size) in types.items():
                offset = offsets[prop_name]
                data_pos = vertex_start + offset
                
                if data_pos + byte_size <= len(file_content):
                    value = struct.unpack('<' + struct_char, 
                                        file_content[data_pos:data_pos + byte_size])[0]
                    vertex[prop_name] = value
            
            vertices.append(vertex)
            
            if i % 10000 == 0 and i > 0:
                logger.info(f"Read {i}/{vertex_count} vertices...")
        
        return vertices
    
    def apply_crop_filter(self, vertices):
        """
        Filter vertices based on crop bounds.
        
        Args:
            vertices (list): List of vertex dictionaries
            
        Returns:
            list: Filtered vertices
        """
        filtered_vertices = []
        total_count = len(vertices)
        
        # Track bounds for debugging
        bounds = {
            'minX': float('inf'), 'maxX': float('-inf'),
            'minY': float('inf'), 'maxY': float('-inf'),
            'minZ': float('inf'), 'maxZ': float('-inf')
        }
        
        for vertex in vertices:
            x, y, z = vertex.get('x', 0), vertex.get('y', 0), vertex.get('z', 0)
            
            # Update bounds tracking
            bounds['minX'] = min(bounds['minX'], x)
            bounds['maxX'] = max(bounds['maxX'], x)
            bounds['minY'] = min(bounds['minY'], y)
            bounds['maxY'] = max(bounds['maxY'], y)
            bounds['minZ'] = min(bounds['minZ'], z)
            bounds['maxZ'] = max(bounds['maxZ'], z)
            
            # Apply crop filtering
            if (self.crop_bounds['minX'] <= x <= self.crop_bounds['maxX'] and
                self.crop_bounds['minY'] <= y <= self.crop_bounds['maxY'] and
                self.crop_bounds['minZ'] <= z <= self.crop_bounds['maxZ']):
                filtered_vertices.append(vertex)
        
        logger.info(f"Filtering results:")
        logger.info(f"  Original vertices: {total_count}")
        logger.info(f"  Filtered vertices: {len(filtered_vertices)}")
        logger.info(f"  Reduction: {(1 - len(filtered_vertices)/total_count)*100:.1f}%")
        logger.info(f"  Data bounds: {bounds}")
        logger.info(f"  Crop bounds: {self.crop_bounds}")
        
        return filtered_vertices
    
    def sort_vertices_by_importance(self, vertices):
        """
        Sort vertices by importance (size * opacity).
        
        Args:
            vertices (list): List of vertex dictionaries
            
        Returns:
            list: Sorted vertices
        """
        def calculate_importance(vertex):
            # Calculate importance like the original JavaScript
            if 'scale_0' in vertex and 'scale_1' in vertex and 'scale_2' in vertex:
                import math
                size = (math.exp(vertex['scale_0']) * 
                       math.exp(vertex['scale_1']) * 
                       math.exp(vertex['scale_2']))
                if 'opacity' in vertex:
                    opacity = 1 / (1 + math.exp(-vertex['opacity']))
                else:
                    opacity = 1.0
                return size * opacity
            return 1.0
        
        logger.info("Sorting vertices by importance...")
        sorted_vertices = sorted(vertices, key=calculate_importance, reverse=True)
        logger.info("Sorting complete")
        
        return sorted_vertices
    
    def write_ply_file(self, vertices, properties, output_path):
        """
        Write filtered vertices to a new PLY file.
        
        Args:
            vertices (list): Filtered and sorted vertices
            properties (list): List of (name, type) tuples
            output_path (str): Output file path
        """
        logger.info(f"Writing {len(vertices)} vertices to {output_path}")
        
        with open(output_path, 'wb') as f:
            # Write header
            header = "ply\n"
            header += "format binary_little_endian 1.0\n"
            header += f"element vertex {len(vertices)}\n"
            
            # Write property definitions
            for prop_name, prop_type in properties:
                header += f"property {prop_type} {prop_name}\n"
            
            header += "end_header\n"
            f.write(header.encode('utf-8'))
            
            # Write binary vertex data
            TYPE_MAP = {
                'double': ('d', 8),
                'int': ('i', 4), 
                'uint': ('I', 4),
                'float': ('f', 4),
                'short': ('h', 2),
                'ushort': ('H', 2),
                'uchar': ('B', 1),
            }
            
            for i, vertex in enumerate(vertices):
                for prop_name, prop_type in properties:
                    if prop_type in TYPE_MAP:
                        struct_char, _ = TYPE_MAP[prop_type]
                        value = vertex.get(prop_name, 0)
                        f.write(struct.pack('<' + struct_char, value))
                
                if i % 10000 == 0 and i > 0:
                    logger.info(f"Wrote {i}/{len(vertices)} vertices...")
        
        logger.info(f"Successfully wrote {output_path}")
    
    def process_ply_file(self, input_path, output_path):
        """
        Process a single PLY file with cropping.
        
        Args:
            input_path (str): Input PLY file path
            output_path (str): Output PLY file path
        """
        logger.info(f"Processing {input_path}")
        
        # Read file
        with open(input_path, 'rb') as f:
            file_content = f.read()
        
        logger.info(f"File size: {len(file_content)/1024/1024:.2f} MB")
        
        # Parse header
        vertex_count, properties, offsets, types, row_size, data_start = self.parse_ply_header(file_content)
        logger.info(f"Found {vertex_count} vertices, row size: {row_size} bytes")
        
        # Read vertex data
        logger.info("Reading vertex data...")
        vertices = self.read_vertex_data(file_content, data_start, vertex_count, offsets, types, row_size)
        
        # Apply crop filter
        logger.info("Applying crop filter...")
        filtered_vertices = self.apply_crop_filter(vertices)
        
        if not filtered_vertices:
            logger.warning("No vertices remain after filtering!")
            return False
        
        # Sort by importance
        logger.info("Sorting vertices by importance...")
        sorted_vertices = self.sort_vertices_by_importance(filtered_vertices)
        
        # Write output file
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        self.write_ply_file(sorted_vertices, properties, output_path)
        
        # Calculate size reduction
        output_size = os.path.getsize(output_path)
        reduction = (1 - output_size / len(file_content)) * 100
        logger.info(f"Size reduction: {reduction:.1f}% ({output_size/1024/1024:.2f} MB)")
        
        return True

def parse_crop_bounds(crop_string):
    """
    Parse crop bounds from command line string.
    
    Args:
        crop_string (str): Comma-separated bounds "minX,maxX,minY,maxY,minZ,maxZ"
        
    Returns:
        dict: Crop bounds dictionary
    """
    try:
        values = [float(x.strip()) for x in crop_string.split(',')]
        if len(values) != 6:
            raise ValueError("Expected 6 values")
        
        return {
            'minX': values[0], 'maxX': values[1],
            'minY': values[2], 'maxY': values[3],
            'minZ': values[4], 'maxZ': values[5]
        }
    except Exception as e:
        raise ValueError(f"Invalid crop bounds format: {e}")

def main():
    parser = argparse.ArgumentParser(description='Crop PLY files to reduce size and improve loading performance')
    parser.add_argument('--source', default='./original_splats', 
                       help='Source directory containing PLY files (default: ./original_splats)')
    parser.add_argument('--dest', default='./public/splats', 
                       help='Destination directory for cropped files (default: ./public/splats)')
    parser.add_argument('--crop', default='-3,3,-3,3,-3,3',
                       help='Crop bounds as minX,maxX,minY,maxY,minZ,maxZ (default: -3,3,-3,3,-3,3)')
    parser.add_argument('--pattern', default='*.ply',
                       help='File pattern to match (default: *.ply)')
    
    args = parser.parse_args()
    
    # Parse crop bounds
    try:
        crop_bounds = parse_crop_bounds(args.crop)
    except ValueError as e:
        logger.error(f"Error parsing crop bounds: {e}")
        sys.exit(1)
    
    # Initialize cropper
    cropper = PLYCropper(crop_bounds)
    
    # Find source files
    source_path = Path(args.source)
    if not source_path.exists():
        logger.error(f"Source directory does not exist: {source_path}")
        sys.exit(1)
    
    ply_files = list(source_path.glob(args.pattern))
    if not ply_files:
        logger.error(f"No PLY files found in {source_path}")
        sys.exit(1)
    
    logger.info(f"Found {len(ply_files)} PLY files to process")
    
    # Process files
    dest_path = Path(args.dest)
    success_count = 0
    
    for input_file in ply_files:
        try:
            output_file = dest_path / input_file.name
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing {input_file.name}")
            
            if cropper.process_ply_file(str(input_file), str(output_file)):
                success_count += 1
            
        except Exception as e:
            logger.error(f"Error processing {input_file}: {e}")
            continue
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Processing complete!")
    logger.info(f"Successfully processed {success_count}/{len(ply_files)} files")
    logger.info(f"Output directory: {dest_path}")

if __name__ == '__main__':
    main()