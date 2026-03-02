---
name: image-magick
description: Process images using ImageMagick with resize, format conversion, crop, and compression capabilities. Trigger when user asks to modify, edit, or process images.
---

# Image Magick

Process and manipulate images using ImageMagick to combine multiple operations in a single command.

## Operations Available

The skill supports the following image operations:

1. **Resize** (修改尺寸): Change image dimensions by width, height, or percentage
2. **Format Conversion** (调整格式): Convert between image formats (jpg, png, webp, etc)
3. **Crop** (剪切): Extract a region from an image
4. **Compress** (压缩图片): Reduce file size while maintaining quality

## Usage

All operations run through the `image-magick` script which accepts:

```
scripts/image-magick.sh <input_file> <output_file> [operations...]
```

### Examples

**Resize to 800x600:**
```
scripts/image-magick.sh input.jpg output.jpg -resize 800x600
```

**Resize to 50% of original:**
```
scripts/image-magick.sh input.jpg output.jpg -resize 50%
```

**Convert PNG to WebP:**
```
scripts/image-magick.sh input.png output.webp
```

**Crop (100x100 from top-left):**
```
scripts/image-magick.sh input.jpg output.jpg -crop 100x100+0+0
```

**Compress JPEG (quality 85):**
```
scripts/image-magick.sh input.jpg output.jpg -quality 85
```

**Chain operations (resize + compress + convert):**
```
scripts/image-magick.sh input.jpg output.webp -resize 1200x800 -quality 80
```

## Requirements

- ImageMagick (`convert` command) must be installed
- Input file must exist and be a valid image format
- Output directory must be writable

## Notes

- Operations are applied in the order specified
- The output format is determined by the file extension
- Use `-quality 85` for JPEG/WebP to balance size vs quality
- Aspect ratio is preserved by default; use `!` to force dimensions: `800x600!`
