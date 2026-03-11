#!/bin/bash

# image-magick.sh - Image processing script using ImageMagick
# Usage: ./image-magick.sh <input_file> <output_file> [operations...]

set -e

if [[ $# -lt 2 ]]; then
	echo "Usage: $0 <input_file> <output_file> [imagemagick options...]" >&2
	echo "" >&2
	echo "Examples:" >&2
	echo "  $0 input.jpg output.jpg -resize 800x600" >&2
	echo "  $0 input.png output.webp -quality 85" >&2
	echo "  $0 input.jpg output.jpg -crop 100x100+0+0" >&2
	exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"
shift 2

# Validate input file exists
if [[ ! -f "$INPUT_FILE" ]]; then
	echo "Error: Input file '$INPUT_FILE' not found" >&2
	exit 1
fi

# Check if ImageMagick is installed
if command -v magick &>/dev/null; then
	IMAGEMAGICK_CMD="magick"
elif command -v convert &>/dev/null; then
	IMAGEMAGICK_CMD="convert"
else
	echo "Error: ImageMagick (magick or convert command) not found. Install with: brew install imagemagick" >&2
	exit 1
fi

# Create output directory if needed
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
if [[ "$OUTPUT_DIR" != "." ]]; then
	mkdir -p "$OUTPUT_DIR"
fi

# Run ImageMagick with all passed arguments
"$IMAGEMAGICK_CMD" "$INPUT_FILE" "$@" "$OUTPUT_FILE"

echo "✓ Image processed: $INPUT_FILE → $OUTPUT_FILE"
