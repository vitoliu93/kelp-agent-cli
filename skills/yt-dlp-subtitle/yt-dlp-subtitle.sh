#!/bin/bash

# yt-dlp-subtitle: Extract subtitles from video URLs
# Supports multiple subtitle formats and languages

set -euo pipefail

# Default output directory
DEFAULT_OUTPUT_DIR="/tmp/yt-dlp-subtitles"

show_usage() {
    cat << 'USAGE'
yt-dlp-subtitle - Extract subtitles from videos

Usage:
  yt-dlp-subtitle <URL> [OPTIONS]

Options:
  -l, --lang <code>      Subtitle language code(s), comma-separated (default: en)
                         Use 'all' for all available languages
  -f, --format <fmt>     Output format: vtt, srt, json3, ass, sub (default: vtt)
  -o, --output <path>    Output directory (default: /tmp/yt-dlp-subtitles)
  -a, --all-subs         Download all available subtitles (not just auto)
  -h, --help             Show this help message

Examples:
  yt-dlp-subtitle "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  yt-dlp-subtitle "https://www.youtube.com/watch?v=dQw4w9WgXcQ" -l en,es -f srt
  yt-dlp-subtitle "https://www.youtube.com/watch?v=dQw4w9WgXcQ" -a -o ./subs

USAGE
}

# Parse arguments
URL=""
LANG="en"
FORMAT="vtt"
OUTPUT_DIR="$DEFAULT_OUTPUT_DIR"
AUTO_ONLY="--write-auto-sub"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -l|--lang)
            LANG="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -a|--all-subs)
            AUTO_ONLY=""
            shift
            ;;
        -*)
            echo "Error: Unknown option: $1" >&2
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "$URL" ]]; then
                URL="$1"
                shift
            else
                echo "Error: Multiple URLs provided" >&2
                exit 1
            fi
            ;;
    esac
done

# Validate URL
if [[ -z "$URL" ]]; then
    echo "Error: No URL provided" >&2
    show_usage
    exit 1
fi

# Validate format
case "$FORMAT" in
    vtt|srt|json3|ass|sub) ;;
    *)
        echo "Error: Invalid format '$FORMAT'. Supported: vtt, srt, json3, ass, sub" >&2
        exit 1
        ;;
esac

# Create output directory if needed
mkdir -p "$OUTPUT_DIR"

# Build yt-dlp command
CMD="yt-dlp $AUTO_ONLY --sub-lang '$LANG' --sub-format '$FORMAT' --skip-download -o '$OUTPUT_DIR/%(title)s.%(ext)s' '$URL'"

echo "Downloading subtitles..." >&2
echo "Language(s): $LANG" >&2
echo "Format: $FORMAT" >&2
echo "Output: $OUTPUT_DIR" >&2

# Execute command and capture output/errors
if eval "$CMD" 2>&1; then
    echo "✓ Subtitles downloaded successfully" >&2
    echo "" >&2
    echo "Output files:" >&2
    ls -lh "$OUTPUT_DIR"/ 2>/dev/null | awk 'NR>1 {print "  " $9 " (" $5 ")"}'
    echo "" >&2
    echo "Full path: $OUTPUT_DIR" >&2
else
    echo "Error: Failed to download subtitles" >&2
    exit 1
fi
