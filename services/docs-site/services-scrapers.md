# Asset Scrapers

## Overview

The CS2Inspect project includes automated asset scraping services that download and optimize CS2 item assets for use in the web application. These services ensure that all sticker, charm, and weapon skin assets are available locally or via CDN for fast, reliable access.

## Services

### 1. Sticker Scraper

### 2. Charm Scraper

### 3. Weapon Skin Video Scraper

---

## Sticker Scraper

### Purpose

The sticker scraper downloads CS2 sticker images from a source CDN (cs2inspects.com by default) with support for:

- Multiple wear values per sticker (0-100%)
- Image optimization and resizing
- WebP format conversion
- Concurrent downloads for performance
- Progress tracking and resume capability

### Location

```
services/sticker-scraper/
├── index.js           # Main scraper logic
├── package.json       # Dependencies
├── progress.json      # Download progress tracker
└── assets/           # Downloaded stickers
    └── {sticker_id}/
        ├── 0.webp    # Pristine condition
        ├── 25.webp   # Light wear
        ├── 50.webp   # Medium wear
        ├── 75.webp   # Heavy wear
        └── 100.webp  # Fully scratched
```

### Configuration

Edit the configuration section in `index.js`:

```javascript
// Sticker ID range (1-10313)
const MIN_STICKER_ID = 1;
const MAX_STICKER_ID = 10313;

// Wear values to download (0-100)
// Examples:
//   Full quality steps: [0, 10, 20, 30, ..., 100]
//   Fewer images: [0, 25, 50, 75, 100]
const WEAR_VALUES = [0, 5, 10, 15, ..., 100];

// Concurrency settings
const CONCURRENT_DOWNLOADS = 10;

// Image processing settings
const TARGET_WIDTH = 512;
const TARGET_HEIGHT = 512;
const OPTIMIZE_WEBP = true;
const WEBP_QUALITY = 80;

// Source URL
const BASE_URL = 'https://cdn.cs2inspects.com';
```

### Installation

```bash
cd services/sticker-scraper
bun install
```

### Usage

```bash
# Start scraping
bun run start

# With custom source URL
SCRAPE_URL=https://your-cdn.com bun run start
```

### Features

#### 1. **Multiple Wear Values**

Each sticker is downloaded in multiple wear states:

- `0` - Pristine (no wear)
- `25` - Slightly scratched
- `50` - Medium wear
- `75` - Well-worn
- `100` - Fully scratched

This allows users to preview stickers at different wear levels in the customizer.

#### 2. **Image Optimization**

- **Resizing**: Images resized from 1522x1522 to 512x512 pixels
- **WebP Conversion**: Automatic conversion to WebP format
- **Quality Control**: Configurable WebP quality (default 80%)
- **Transparent Background**: Preserves alpha channel
- **File Size Reduction**: Typically 70-90% smaller than originals

#### 3. **Progress Tracking**

The scraper creates `progress.json` to track:

- Total stickers processed
- Successfully downloaded
- Failed downloads
- Skipped (already existing)

This allows resuming interrupted downloads without re-downloading existing files.

#### 4. **Concurrent Downloads**

- Downloads multiple stickers in parallel
- Configurable concurrency (default: 10)
- Respects server limits with built-in delays
- Sharp library concurrency management

#### 5. **Skip Existing**

- Automatically skips files that already exist
- Checks file size to avoid re-downloading
- Saves bandwidth and time on re-runs

#### 6. **Ignored Stickers**

The scraper includes a list of known non-existent sticker IDs to skip:

```javascript
const IGNORED_STICKER_IDS = [29, 30, 45, 54, 204, ...];
```

This prevents wasted attempts on stickers that don't exist on the source server.

### Output

```
assets/
├── 1/
│   ├── 0.webp
│   ├── 25.webp
│   ├── 50.webp
│   ├── 75.webp
│   └── 100.webp
├── 2/
│   ├── 0.webp
│   └── ...
└── 10313/
    └── ...
```

### Example Output Log

```
Starting sticker scraper...
Configuration:
- Sticker range: 1 to 10313
- Wear values: [0, 25, 50, 75, 100]
- Concurrent downloads: 10
- Target size: 512x512
- WebP quality: 80%

Progress: 100/10313 stickers
Status: Downloaded: 450, Skipped: 50, Failed: 0

Progress: 500/10313 stickers
...

Scraping completed!
Total downloaded: 45,120 images
Total size: 2.3 GB
Average size per image: 52 KB
```

### Performance

- **Speed**: ~100-500 stickers per minute (network dependent)
- **Storage**: ~2-5 GB total for all stickers at 512x512
- **Memory**: Uses Sharp's streaming for efficient processing
- **Network**: Respectful delays between requests

### Error Handling

- **404 Errors**: Logged but not fatal (expected for some IDs)
- **Network Timeouts**: 15-second timeout per request
- **Retry Logic**: Automatic retries on transient failures
- **Progress Saving**: Saves progress every 100 stickers

---

## Charm Scraper

### Purpose

The charm scraper downloads CS2 charm (keychain) images with support for:

- Multiple pattern seeds per charm
- Front-facing views
- Variant images for charms with patterns
- Batch downloading with progress tracking

### Location

```
services/charm-scraper/
├── index.js           # Main scraper logic
├── package.json       # Dependencies
├── charms.json        # Charm definitions
├── progress.json      # Download progress
└── assets/            # Downloaded charms
    └── {charm_name}/
        ├── {charm_name}_default_empty.webp
        ├── {charm_name}_seed_1.webp
        ├── {charm_name}_seed_10000.webp
        └── ...
```

### Charm Definitions

`charms.json` contains charm metadata:

```json
[
    {
        "id": 6001,
        "name": "Chicken"
    },
    {
        "id": 6002,
        "name": "Phoenix"
    }
]
```

### Configuration

```javascript
// Pattern seeds to download per charm
const SEEDS = [1, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000]

// Source URL
const envUrl = process.env.SCRAPE_URL || 'http://localhost:3210'

// Asset directory
const ASSETS_DIR = path.join(__dirname, 'assets')
```

### Installation

```bash
cd services/charm-scraper
bun install
```

### Usage

```bash
# Start scraping
bun run start

# With custom source URL
SCRAPE_URL=https://cdn.cs2inspects.com bun run start
```

### Features

#### 1. **Pattern Seeds**

Charms with patterns are downloaded in multiple seed variations:

- Default pattern (seed 1)
- Seed 10000, 20000, ..., 90000

This captures the variety of charm appearances.

#### 2. **Sanitized Filenames**

Charm names are sanitized for filesystem compatibility:

```javascript
"Chicken" → "chicken_default_empty.webp"
"Mr. Phoenix" → "mr_phoenix_seed_10000.webp"
```

#### 3. **404 Handling**

- Gracefully handles missing seeds
- Logs 404s without failing the entire scrape
- Continues with remaining charms

#### 4. **Batch Processing**

- Processes 5 charms at a time with logging
- Parallel seed downloads per charm
- Progress indicators every 5 charms

### Output

```
assets/
├── chicken/
│   ├── chicken_default_empty.webp
│   ├── chicken_seed_1.webp
│   ├── chicken_seed_10000.webp
│   └── ...
├── phoenix/
│   ├── phoenix_default_empty.webp
│   └── ...
└── ...
```

### Example Output Log

```
Starting Standard Charm Scraper for 50 charms...
Charms processed: 5/50
Charms processed: 10/50
...
Standard Charm Scraping finished.
Total images downloaded: 485
```

---

## Comparison

| Feature               | Sticker Scraper                        | Charm Scraper                      |
| --------------------- | -------------------------------------- | ---------------------------------- |
| **Image Processing**  | Yes (Sharp resize + WebP optimization) | No (direct downloads)              |
| **Wear Values**       | Yes (0-100%)                           | No                                 |
| **Pattern Seeds**     | No                                     | Yes (10 seeds)                     |
| **Concurrency**       | Configurable (default 10)              | Parallel per charm                 |
| **Ignored IDs**       | Yes (extensive list)                   | No                                 |
| **Progress Tracking** | Yes                                    | Yes                                |
| **File Structure**    | `assets/{id}/{wear}.webp`              | `assets/{name}/{name}_{seed}.webp` |
| **Optimization**      | Resize + WebP encoding                 | None                               |

---

## Deployment

### Git Subtree Deployment

Both scrapers can be deployed independently:

```bash
# Sticker scraper
git subtree push --prefix=services/sticker-scraper origin sticker-scraper-only

# Charm scraper
git subtree push --prefix=services/charm-scraper origin charm-scraper-only
```

### Docker Deployment

#### Sticker Scraper Dockerfile

```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN bun install

# Copy source
COPY index.js ./

# Create volume for assets
VOLUME /app/assets

# Run scraper
CMD ["bun", "run", "start"]
```

#### Charm Scraper Dockerfile

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source and data
COPY index.js charms.json ./

# Create volume for assets
VOLUME /app/assets

# Run scraper
CMD ["node", "index.js"]
```

### Scheduled Scraping

For automated updates, use cron or GitHub Actions:

#### GitHub Actions Example

```yaml
name: Update Assets

on:
    schedule:
        # Run every Monday at 2 AM
        - cron: '0 2 * * 1'
    workflow_dispatch:

jobs:
    scrape:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Setup Bun
              uses: oven-sh/setup-bun@v1

            - name: Run Sticker Scraper
              run: |
                  cd services/sticker-scraper
                  bun install
                  bun run start

            - name: Run Charm Scraper
              run: |
                  cd services/charm-scraper
                  bun install
                  bun run start

            - name: Upload Assets
              uses: actions/upload-artifact@v4
              with:
                  name: cs2-assets
                  path: |
                      services/sticker-scraper/assets
                      services/charm-scraper/assets
```

---

## Integration with Main App

### Asset Storage

The main app expects assets in specific locations:

```
/storage/stickers/{id}/{wear}.webp
/storage/charms/{name}/{name}_{seed}.webp
```

### Serving Assets

Assets are served via Nitro server assets:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
    nitro: {
        serverAssets: [
            {
                baseName: 'stickers',
                dir: './storage/stickers',
            },
            {
                baseName: 'charms',
                dir: './storage/charms',
            },
        ],
    },
})
```

### Runtime Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            assetsUrl: 'https://assets.cu.sakoa.xyz/cs2inspect',
            assetsStickerPath: '/stickers',
            assetsCharmsPath: '/charms',
        },
    },
})
```

### Usage in Components

```vue
<script setup>
const config = useRuntimeConfig()

const getStickerUrl = (stickerId, wear = 0) => {
    return `${config.public.assetsUrl}${config.public.assetsStickerPath}/${stickerId}/${wear}.webp`
}

const getCharmUrl = (charmName, seed = 1) => {
    return `${config.public.assetsUrl}${config.public.assetsCharmsPath}/${charmName}/${charmName}_seed_${seed}.webp`
}
</script>

<template>
    <img :src="getStickerUrl(1230, 0)" alt="Sticker" />
    <img :src="getCharmUrl('chicken', 10000)" alt="Charm" />
</template>
```

---

## Best Practices

### 1. **Storage Management**

- Store assets on CDN for production
- Use local storage for development
- Implement lazy loading for large image sets
- Consider image CDN with automatic optimization

### 2. **Scraping Etiquette**

- Respect source server limits
- Use reasonable delays between requests
- Implement user-agent headers
- Monitor for 429 (rate limit) responses
- Don't scrape during peak hours

### 3. **Asset Updates**

- Run scrapers periodically (weekly/monthly)
- Check for new stickers after game updates
- Maintain changelog of asset updates
- Version control asset metadata

### 4. **Error Recovery**

- Save progress frequently
- Implement resume capability
- Log all errors for debugging
- Monitor disk space during scraping

### 5. **Optimization**

- Optimize images for web delivery
- Use appropriate formats (WebP, AVIF)
- Implement responsive images
- Lazy load images below the fold

---

## Troubleshooting

### Sticker Scraper Issues

#### Out of Disk Space

```bash
# Check available space
df -h

# Clean up failed downloads
rm -rf services/sticker-scraper/assets/*/0.webp
```

#### Sharp Installation Errors

```bash
# Reinstall Sharp
cd services/sticker-scraper
rm -rf node_modules
bun install
```

#### Network Timeouts

Increase timeout in code:

```javascript
const response = await axios({
    timeout: 30000, // Increase to 30 seconds
    // ...
})
```

### Charm Scraper Issues

#### Missing charms.json

Ensure `charms.json` exists with proper format:

```json
[{ "id": 6001, "name": "Chicken" }]
```

#### 404 Errors for All Seeds

- Check source URL configuration
- Verify charm IDs are correct
- Test URL manually in browser

---

## Monitoring

### Metrics to Track

- **Success Rate**: Percentage of successful downloads
- **Download Speed**: Images per minute
- **File Sizes**: Average size per image
- **Disk Usage**: Total storage consumed
- **Error Rate**: Failed downloads per run

### Logging

Both scrapers log:

- Start and completion times
- Progress updates
- Error conditions
- Final statistics

Example:

```
2026-01-25 12:00:00 - Starting sticker scraper
2026-01-25 12:05:00 - Progress: 500/10313 (4.85%)
2026-01-25 12:10:00 - Progress: 1000/10313 (9.70%)
...
2026-01-25 14:30:00 - Completed successfully
Total: 51,565 images, 2.3 GB, Success rate: 99.2%
```

---

## Related Documentation

- [Architecture](./architecture.md) - System architecture
- [Deployment Guide](./deployment.md) - Deployment strategies
- [Self-Hosting](./self-hosting.md) - Self-hosting instructions

## Future Enhancements

### Planned Features

1. **Incremental Updates**: Download only new stickers
2. **Image Validation**: Verify downloaded images
3. **Metadata Extraction**: Extract sticker names and properties
4. **Cloud Storage Integration**: Upload directly to S3/GCS
5. **Progress Dashboard**: Real-time scraping progress UI
6. **Multi-Source Support**: Scrape from multiple CDNs
7. **AVIF Support**: Add AVIF format alongside WebP
8. **Automatic Cleanup**: Remove outdated assets

### Contributing

When contributing to scrapers:

1. **Test Thoroughly**: Verify downloads work correctly
2. **Update Documentation**: Keep this doc current
3. **Respect Source**: Don't overload source servers
4. **Optimize**: Improve performance where possible
5. **Error Handling**: Handle edge cases gracefully

---

## License

See the main project's LICENSE file.

---

## Weapon Skin Video Scraper

### Purpose

Downloads and processes CS2 weapon skin showcase videos for visual previews. The pipeline scrapes videos, removes blue backgrounds using mask-based processing, and optimizes the output for web delivery.

### Location

```
services/weapon-scraper/
├── skins_scraper.py              # Main scraper - download by weapon type
├── skins_scraper-collection.py   # Download by collection
├── skins_scraper-container.py    # Download by container/case
├── mask_based_remover.py         # Remove backgrounds using weapon masks
├── optimize_masked_videos.py     # Compress and optimize videos
├── collect_masked.py             # Collect processed videos with corrected filenames
├── tracking.py                   # Track download progress
├── tracking.json                 # Download state persistence
├── requirements.txt              # Python dependencies
├── README_PIPELINE.md            # Detailed pipeline documentation
└── masks/                        # 75+ PNG weapon masks for background removal
```

### Tech Stack

- **Language**: Python 3
- **Dependencies**: OpenCV, Pillow, NumPy, requests, BeautifulSoup4
- **Install**: `pip install -r requirements.txt`

### Pipeline

The scraping process follows three stages:

1. **Scrape** — Download skin showcase videos from source CDN
    - Multi-threaded downloading with configurable worker count
    - Request delay handling for rate limiting
    - Progress tracking to avoid duplicate downloads

2. **Mask** — Remove blue backgrounds using weapon-specific PNG masks
    - Per-weapon mask files in `masks/` directory
    - Produces transparent-background videos

3. **Optimize** — Compress and convert videos for web use
    - Codec conversion and quality settings
    - File size optimization for fast loading

### Usage

```bash
# Install dependencies
pip install -r requirements.txt

# Scrape skins by weapon type
python skins_scraper.py

# Remove backgrounds
python mask_based_remover.py

# Optimize output
python optimize_masked_videos.py

# Collect final files
python collect_masked.py
```

See `README_PIPELINE.md` in the service directory for detailed pipeline documentation.
