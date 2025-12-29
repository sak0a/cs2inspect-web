# CS2 Sticker Scraper Service

A standalone utility to scrape and download sticker images from SCRAPE_URL with configurable wear values, image scaling, and WebP optimization.

## 📂 Project Structure

```bash
/services/sticker-scraper/
├── assets/                 # Downloaded images are stored here
│   ├── 1/                  # Sticker ID folder
│   │   ├── 0.webp         # Wear 0
│   │   ├── 10.webp        # Wear 10
│   │   └── ...
│   ├── 2/
│   └── ...
├── progress.json          # Progress tracking for resume
├── index.js               # Main scraper script
├── package.json           # Dependencies
└── README.md
```

## 🛠 Configuration

Edit the configuration section at the top of `index.js`:

```javascript
// Sticker ID range (1-10313)
const MIN_STICKER_ID = 1;
const MAX_STICKER_ID = 10313;

// Wear values to download (0-100)
const WEAR_VALUES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Concurrency settings
const CONCURRENT_DOWNLOADS = 10;

// Image processing settings
const TARGET_WIDTH = 512;
const TARGET_HEIGHT = 512;
const OPTIMIZE_WEBP = true;
const WEBP_QUALITY = 80;
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `MIN_STICKER_ID` | `1` | First sticker ID to scrape |
| `MAX_STICKER_ID` | `10313` | Last sticker ID to scrape |
| `WEAR_VALUES` | `[0,10,...,100]` | Array of wear values (0-100) to download |
| `CONCURRENT_DOWNLOADS` | `10` | Number of parallel downloads |
| `TARGET_WIDTH` | `512` | Target image width (original: 1522px) |
| `TARGET_HEIGHT` | `512` | Target image height (original: 1522px) |
| `OPTIMIZE_WEBP` | `true` | Enable lossy WebP compression |
| `WEBP_QUALITY` | `80` | WebP quality 1-100 (lower = smaller) |

### Wear Value Examples

```javascript
// 11 images per sticker (every 10%)
const WEAR_VALUES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// 5 images per sticker
const WEAR_VALUES = [0, 25, 50, 75, 100];

// 3 images per sticker
const WEAR_VALUES = [0, 50, 100];

// Only pristine and most worn
const WEAR_VALUES = [0, 100];
```

## 📦 Usage

### Installation

```bash
cd services/sticker-scraper
bun install
```

### Running

```bash
# Start scraping
bun run start

# Show help
bun run index.js --help

# Reset progress and start fresh
bun run index.js --reset
```

## 🔄 Features

- **Multi-threaded**: Downloads multiple images in parallel
- **Configurable**: Customize wear values, image size, and quality
- **Resume Support**: Automatically resumes from last position if interrupted
- **Image Processing**: Uses Sharp for high-quality resizing and WebP optimization
- **Progress Tracking**: Real-time progress updates in console
- **Error Handling**: Graceful handling of 404s and network errors

## 📊 Disk Space Estimates

| Configuration | Images | Estimated Size |
|--------------|--------|----------------|
| 11 wear values, 512px, Q80 | ~113,000 | ~3-5 GB |
| 5 wear values, 512px, Q80 | ~51,000 | ~1.5-2 GB |
| 11 wear values, 256px, Q70 | ~113,000 | ~1-2 GB |

## 🔗 Image URL Pattern

```
https://SCRAPE_URL/stickers/{stickerId}/{wear}.webp
```

Example: `https://SCRAPE_URL/stickers/10280/50.webp`

## 🎯 Integration

Use the downloaded images in your application:

```javascript
const getStickerImage = (stickerId, wear) => {
    return `/assets/stickers/${stickerId}/${wear}.webp`;
};
```
