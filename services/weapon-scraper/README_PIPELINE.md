# CS:GO Weapon Skin Video Processing Pipeline

This pipeline downloads weapon skin videos from exampleskins.com and removes their background using mask-based processing.

## Overview

The workflow consists of two main steps:
1. **Download** weapon skin videos using:
   - `skins_scraper.py` (by weapon)
   - `skins_scraper-container.py` (by container/case)
   - `skins_scraper-collection.py` (by collection)
2. **Process** videos with `mask_based_remover.py` to remove the blue background and make it transparent

## Requirements

```bash
pip install -r requirements.txt
```

Requires:
- Python 3.11+
- FFmpeg installed and available in PATH
- OpenCV, Pillow, NumPy, Requests, BeautifulSoup4

## Step 1: Download Weapon Videos

### Basic Usage

```bash
python skins_scraper.py --weapon awp
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--weapon`, `-w` | Weapon type (awp, ak-47, m4a4, etc.) | awp |
| `--workers`, `-t` | Concurrent download threads | 5 |
| `--delay`, `-d` | Delay between requests (seconds) | 1.0 |
| `--page`, `-p` | Page number for multi-page weapons | 1 |
| `--force`, `-f` | Force re-download even if already tracked | false |
| `--show-stats` | Show tracking statistics and exit | - |

### Examples

```bash
# Download AK-47 skins (page 1)
python skins_scraper.py --weapon ak-47 --workers 3 --delay 2.0

# Download from page 2 (for weapons with many skins)
python skins_scraper.py --weapon ak-47 --page 2

# Conservative scraping (slower but safer)
python skins_scraper.py --weapon m4a4 --workers 2 --delay 3.0
```

### Multi-Page Weapons

Some weapons have many skins split across multiple pages. Run the scraper multiple times with different `--page` values:

```bash
python skins_scraper.py --weapon ak-47 --page 1
python skins_scraper.py --weapon ak-47 --page 2
```

Videos are saved to: `downloads/{weapon}_videos/`

---

## Alternative: Download by Container/Case

Use `skins_scraper-container.py` to download all skins from a specific container (case). Videos are automatically organized into weapon-specific directories.

### Basic Usage

```bash
python skins_scraper-container.py --container sealed-genesis-terminal
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--container`, `-c` | Container name from exampleskins.com URL | sealed-genesis-terminal |
| `--workers`, `-t` | Concurrent download threads | 5 |
| `--delay`, `-d` | Delay between requests (seconds) | 1.0 |
| `--force`, `-f` | Force re-download even if already tracked | false |
| `--show-stats` | Show tracking statistics and exit | - |

### Examples

```bash
# Download all skins from Genesis Terminal case
python skins_scraper-container.py -c sealed-genesis-terminal

# Download from Dreams & Nightmares case with conservative settings
python skins_scraper-container.py -c sealed-dreams-nightmares --workers 2 --delay 3.0

# Download from Revolution case
python skins_scraper-container.py -c sealed-revolution
```

### Finding Container Names

Container names come from the exampleskins.com URL. For example:
- URL: `https://exampleskins.com/containers/sealed-genesis-terminal`
- Container name: `sealed-genesis-terminal`

### Auto-Organization

Videos are automatically sorted into weapon directories:
```
downloads/
├── ak-47_videos/
│   └── ak-47-the-oligarch.webm
├── awp_videos/
│   └── awp-ice-coaled.webm
├── m4a4_videos/
│   └── m4a4-full-throttle.webm
└── ...
```

---

## Alternative: Download by Collection

Use `skins_scraper-collection.py` to download all skins from a specific collection. Videos are automatically organized into weapon-specific directories.

### Basic Usage

```bash
python skins_scraper-collection.py --collection the-harlequin-collection
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--collection`, `-c` | Collection name from exampleskins.com URL | the-harlequin-collection |
| `--workers`, `-t` | Concurrent download threads | 5 |
| `--delay`, `-d` | Delay between requests (seconds) | 1.0 |
| `--force`, `-f` | Force re-download even if already tracked | false |
| `--show-stats` | Show tracking statistics and exit | - |

### Examples

```bash
# Download all skins from The Harlequin Collection
python skins_scraper-collection.py -c the-harlequin-collection

# Download from The 2021 Dust 2 Collection with conservative settings
python skins_scraper-collection.py -c the-2021-dust-2-collection --workers 2 --delay 3.0

# Download from The Control Collection
python skins_scraper-collection.py -c the-control-collection
```

### Finding Collection Names

Collection names come from the exampleskins.com URL. For example:
- URL: `https://exampleskins.com/collections/the-harlequin-collection`
- Collection name: `the-harlequin-collection`

---

## Step 2: Create Weapon Masks

You need to create mask images for each weapon type. Masks define which parts are the weapon (keep) vs background (remove).

### Mask Requirements

- **Black pixels** = Weapon (will be visible, alpha=255)
- **White/transparent pixels** = Background (will be transparent, alpha=0)
- Resolution should roughly match video resolution
- Save as PNG with transparency

### Creating Masks

1. Open a frame from one of the downloaded videos
2. In an image editor (Photoshop, GIMP, etc.), create a black silhouette of the weapon
3. Save as PNG in the `masks/` directory

### Multiple Masks

Some weapons have different "forms" (e.g., stock vs no stock). Create multiple masks:
- `masks/awp_mask.png` - Primary mask
- `masks/awp_mask_2.png` - Alternate mask

---

## Step 3: Remove Backgrounds

### Basic Usage (Auto-detect Masks)

```bash
# Automatically finds masks/awp_mask.png, masks/awp_mask_2.png, etc.
python mask_based_remover.py awp
```

### With Explicit Masks

```bash
python mask_based_remover.py awp --masks "masks/awp_mask.png" "masks/awp_mask_2.png"
```

### List Available Masks

```bash
# Show masks available for a weapon
python mask_based_remover.py awp --list-masks

# Show all masks in directory
python mask_based_remover.py --list-masks
```

The script will:
1. Auto-detect masks from `masks/` directory (or use explicit `--masks`)
2. Try the first mask
3. Verify if the mask properly covers the weapon
4. If >5% of weapon is cut off, automatically retry with the next mask

### Options

| Option | Description |
|--------|-------------|
| `--masks`, `-m` | Mask image paths (optional - auto-detected if not specified) |
| `--masks-dir` | Directory containing masks (default: `masks/`) |
| `--list-masks` | List available masks for a weapon and exit |
| `--suffix` | Output filename suffix (default: `_masked`) |
| `--single`, `-s` | Process a single video file |
| `--output`, `-o` | Output path for single file mode |
| `--force`, `-f` | Force re-process even if already tracked |
| `--show-stats` | Show tracking statistics and exit |
| `--auto`, `-a` | Process all tracked unmasked videos automatically |

### Examples

```bash
# Process all AWP videos with 2 masks
python mask_based_remover.py awp --masks "masks/awp_mask.png" "masks/awp_mask_2.png"

# Process single video for testing
python mask_based_remover.py awp --masks "masks/awp_mask.png" \
    --single "downloads/awp_videos/awp-dragon-lore.webm" \
    --output "test_output.webm"
```

### Auto-Process All Unmasked Videos

Process all tracked videos that are downloaded but not yet masked:

```bash
# Auto-detect masks and process all pending videos
python mask_based_remover.py --auto

# Force re-process even if already tracked
python mask_based_remover.py --auto --force

# Use custom masks directory
python mask_based_remover.py --auto --masks-dir custom_masks/
```

This will:
1. Query the tracking database for all unmasked videos
2. Group them by weapon type
3. Auto-detect masks for each weapon
4. Process all videos, skipping weapons without available masks

### Output

Processed videos are saved to: `downloads/{weapon}_videos/masked/`

---

## Step 4: Collect Masked Videos

Use `collect_masked.py` to copy all masked videos from weapon-specific directories into a single folder.

### Basic Usage

```bash
python collect_masked.py
```

This copies all videos from `downloads/*/masked/` to `masked-videos/`.

### Options

| Option | Description |
|--------|-------------|
| `--output`, `-o` | Output directory (default: `masked-videos/`) |
| `--downloads`, `-d` | Downloads directory (default: `downloads/`) |
| `--dry-run`, `-n` | Show what would be done without copying |
| `--force`, `-f` | Overwrite existing files |
| `--verbose`, `-v` | Show verbose output |

### Examples

```bash
# Preview what would be copied
python collect_masked.py --dry-run

# Copy to custom directory
python collect_masked.py --output /path/to/output

# Force overwrite existing files
python collect_masked.py --force
```

---

## Step 5: Optimize Videos (Optional)

Use `optimize_masked_videos.py` to compress masked videos using VP9 two-pass encoding while preserving transparency. This can significantly reduce file sizes.

### Basic Usage

```bash
python optimize_masked_videos.py
```

This reads from `masked-videos/` and outputs to `masked-videos-optimized/`.

### Options

| Option | Description |
|--------|-------------|
| `--input`, `-i` | Input directory (default: `masked-videos/`) |
| `--output`, `-o` | Output directory (default: `masked-videos-optimized/`) |
| `--crf` | Quality setting 0-63, lower=better (default: 32) |
| `--workers` | Parallel workers (default: half of CPU cores) |
| `--test`, `-t` | Process only first video for testing |
| `--sequential`, `-s` | Disable parallel processing |

### Examples

```bash
# Preview with one video first
python optimize_masked_videos.py --test

# Higher quality (larger files)
python optimize_masked_videos.py --crf 28

# Lower quality (smaller files)
python optimize_masked_videos.py --crf 38

# Custom directories
python optimize_masked_videos.py -i custom-input/ -o custom-output/

# Sequential processing (less CPU usage)
python optimize_masked_videos.py --sequential
```

### Output

Optimized videos are saved to: `masked-videos-optimized/`

---

## Directory Structure

```
.
├── skins_scraper.py            # Download videos by weapon
├── skins_scraper-container.py  # Download videos by container/case
├── skins_scraper-collection.py # Download videos by collection
├── mask_based_remover.py           # Remove backgrounds using masks
├── collect_masked.py               # Collect masked videos into single folder
├── optimize_masked_videos.py       # Optimize videos for smaller file size
├── tracking.py                     # Video tracking module
├── tracking.json                   # Tracking data (auto-generated)
├── masks/                          # Weapon mask images
│   ├── awp_mask.png
│   ├── awp_mask_2.png
│   └── ...
├── masked-videos/                  # All masked videos (from collect_masked.py)
│   ├── awp-dragon-lore_masked.webm
│   ├── ak-47-redline_masked.webm
│   └── ...
├── masked-videos-optimized/        # Optimized videos (from optimize_masked_videos.py)
│   ├── awp-dragon-lore_masked.webm
│   ├── ak-47-redline_masked.webm
│   └── ...
└── downloads/
    ├── awp_videos/
    │   ├── awp-dragon-lore.webm
    │   ├── awp-asiimov.webm
    │   └── masked/           # Processed videos
    │       ├── awp-dragon-lore_masked.webm
    │       └── ...
    └── ak-47_videos/
        └── ...
```

---

## Complete Workflow Examples

### Example 1: Download by Weapon

```bash
# 1. Download AWP videos
python skins_scraper.py --weapon awp --workers 3 --delay 2.0

# 2. Create masks (manual step in image editor)
# Save to masks/awp_mask.png and masks/awp_mask_2.png

# 3. Process all videos with background removal (auto-detects masks)
python mask_based_remover.py awp

# 4. Check output
ls downloads/awp_videos/masked/
```

### Example 2: Download by Container

```bash
# 1. Download all skins from a container (auto-organized by weapon)
python skins_scraper-container.py -c sealed-genesis-terminal --workers 3 --delay 2.0

# 2. Process each weapon type (masks auto-detected from masks/ directory)
python mask_based_remover.py ak-47
python mask_based_remover.py awp
python mask_based_remover.py m4a4

# 3. Check outputs
ls downloads/*/masked/
```

---

## Video Tracking System

All download and masking operations are tracked in `tracking.json`. This allows:
- Skipping already processed videos on re-runs
- Tracking progress across sessions
- Viewing statistics about your processing pipeline

### Tracking File Location

`tracking.json` is created in the working directory and tracks:
- Video ID, weapon type, and skin name
- Download timestamp, file path, size, and MD5 checksum
- Masking timestamp, output path, size, checksum, and mask used
- Source information (weapon scraper or container scraper)

### View Statistics

```bash
# Using any script with --show-stats
python skins_scraper.py --show-stats
python mask_based_remover.py --show-stats

# Or using the tracking module directly
python tracking.py

# List videos pending masking
python tracking.py --unmasked
```

### Force Re-Processing

By default, already-tracked videos are skipped. Use `--force` to re-process:

```bash
# Re-download even if already tracked
python skins_scraper.py --weapon awp --force

# Re-mask even if already processed
python mask_based_remover.py awp --masks masks/awp_mask.png --force
```

### Tracking Data Structure

```json
{
  "version": "1.0",
  "last_updated": "2024-01-15T10:30:00Z",
  "videos": {
    "awp-dragon-lore": {
      "weapon": "awp",
      "skin_name": "awp-dragon-lore",
      "source": "weapon",
      "download": {
        "status": "success",
        "timestamp": "2024-01-15T10:00:00Z",
        "file_path": "downloads/awp_videos/awp-dragon-lore.webm",
        "file_size": 1234567,
        "md5": "abc123..."
      },
      "masked": {
        "status": "success",
        "timestamp": "2024-01-15T10:15:00Z",
        "file_path": "downloads/awp_videos/masked/awp-dragon-lore_masked.webm",
        "file_size": 987654,
        "md5": "def456...",
        "mask_used": "masks/awp_mask.png"
      }
    }
  },
  "stats": {
    "total_downloaded": 150,
    "total_masked": 120,
    "failed_downloads": 5,
    "failed_masks": 10
  }
}
```

---

## Notes

- **Background Color**: Original videos have background color `#1E2836` (RGB 30, 40, 54)
- **Output Format**: WebM with VP9 codec and alpha channel (yuva420p)
- **Mask Quality Check**: Script automatically checks if masks cut off >5% of weapon pixels
- **Rate Limiting**: Be respectful to exampleskins.com - use reasonable delay settings
