const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

// ============================================================
// CONFIGURATION - Modify these values as needed
// ============================================================

// Sticker ID range (1-10313)
const MIN_STICKER_ID = 1;
const MAX_STICKER_ID = 10313;

// Wear values to download (0-100)
// Examples:
//   Full quality steps: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
//   Fewer images: [0, 25, 50, 75, 100]
//   Only 5 images: [0, 25, 50, 75, 100]
const WEAR_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

// Concurrency settings
const CONCURRENT_DOWNLOADS = 10; // Number of parallel downloads per batch

// Image processing settings
const TARGET_WIDTH = 512;        // Target width in pixels (original is 1522)
const TARGET_HEIGHT = 512;       // Target height in pixels (original is 1522)
const OPTIMIZE_WEBP = true;      // Enable WebP optimization
const WEBP_QUALITY = 80;         // WebP quality (1-100, lower = smaller file)

// ============================================================
// PATHS AND CONSTANTS
// ============================================================

const BASE_URL = process.env.SCRAPE_URL || 'localhost:3000';
const ASSETS_DIR = path.join(__dirname, 'assets');
const PROGRESS_FILE = path.join(__dirname, 'progress.json');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

sharp.concurrency(CONCURRENT_DOWNLOADS);
/**
 * Download and process a single sticker image
 */
async function downloadAndProcessImage(stickerId, wear) {
    try {
        const stickerDir = path.join(ASSETS_DIR, String(stickerId));

        // Create directory if it doesn't exist
        if (!fs.existsSync(stickerDir)) {
            fs.mkdirSync(stickerDir, { recursive: true });
        }

        const filename = `${wear}.webp`;
        const filePath = path.join(stickerDir, filename);

        // Skip if file already exists
        if (fs.existsSync(filePath)) {
            return { status: 'skipped', stickerId, wear };
        }

        // Construct URL
        const url = `${BASE_URL}/stickers/${stickerId}/${wear}.webp`;

        // Download image
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        // Process image with sharp
        let sharpInstance = sharp(response.data)
            .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            });

        // Apply WebP optimization if enabled
        if (OPTIMIZE_WEBP) {
            sharpInstance = sharpInstance.webp({
                quality: WEBP_QUALITY,
                effort: 4 // Balance between speed and compression
            });
        } else {
            sharpInstance = sharpInstance.webp({
                lossless: true
            });
        }

        // Save processed image
        await sharpInstance.toFile(filePath);

        return { status: 'downloaded', stickerId, wear };

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { status: '404', stickerId, wear };
        }
        console.error(`Error downloading sticker ${stickerId} wear ${wear}: ${error.message}`);
        return { status: 'error', stickerId, wear, error: error.message };
    }
}

/**
 * Load progress from file
 */
function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        } catch {
            console.error('Error reading progress file, starting fresh');
        }
    }
    return { lastStickerId: 0, timestamp: null };
}

/**
 * Save progress to file
 */
function saveProgress(lastStickerId) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        lastStickerId,
        timestamp: new Date().toISOString()
    }, null, 2));
}

/**
 * Main scraper function
 */
async function scrapeStickers() {
    console.log('='.repeat(60));
    console.log('CS2 Sticker Scraper');
    console.log('='.repeat(60));
    console.log(`Sticker Range: ${MIN_STICKER_ID} - ${MAX_STICKER_ID}`);
    console.log(`Wear Values: [${WEAR_VALUES.join(', ')}]`);
    console.log(`Concurrent Downloads: ${CONCURRENT_DOWNLOADS}`);
    console.log(`Target Size: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
    console.log(`WebP Optimization: ${OPTIMIZE_WEBP ? `Yes (Quality: ${WEBP_QUALITY})` : 'No (Lossless)'}`);
    console.log(`Total images to check: ${(MAX_STICKER_ID - MIN_STICKER_ID + 1) * WEAR_VALUES.length}`);
    console.log('='.repeat(60));

    // Create assets directory
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    // Load progress
    const progress = loadProgress();
    let startId = progress.lastStickerId > 0 ? progress.lastStickerId + 1 : MIN_STICKER_ID;

    if (startId > MIN_STICKER_ID) {
        console.log(`Resuming from sticker ID ${startId}...`);
    }

    let totalDownloaded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let total404 = 0;
    let consecutiveErrors = 0;

    const startTime = Date.now();

    // Process stickers in batches
    for (let stickerId = startId; stickerId <= MAX_STICKER_ID; stickerId++) {
        // Create download tasks for all wear values
        const downloadTasks = WEAR_VALUES.map(wear =>
            downloadAndProcessImage(stickerId, wear)
        );

        // Execute with concurrency limit
        const batchSize = CONCURRENT_DOWNLOADS;
        const results = [];

        for (let i = 0; i < downloadTasks.length; i += batchSize) {
            const batch = downloadTasks.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch);
            results.push(...batchResults);
        }

        // Process results
        let stickerDownloaded = 0;
        let stickerErrors = 0;

        for (const result of results) {
            switch (result.status) {
                case 'downloaded':
                    totalDownloaded++;
                    stickerDownloaded++;
                    consecutiveErrors = 0;
                    break;
                case 'skipped':
                    totalSkipped++;
                    consecutiveErrors = 0;
                    break;
                case '404':
                    total404++;
                    break;
                case 'error':
                    totalErrors++;
                    stickerErrors++;
                    consecutiveErrors++;
                    break;
            }
        }

        // Check for too many consecutive errors
        if (consecutiveErrors > 50) {
            console.error('\n❌ Too many consecutive errors. Stopping to prevent issues.');
            console.error('Check your network connection or if the source is available.');
            saveProgress(stickerId - 1);
            process.exit(1);
        }

        // Save progress
        saveProgress(stickerId);

        // Log progress every 50 stickers or on download
        if (stickerId % 50 === 0 || stickerDownloaded > 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const percent = (((stickerId - MIN_STICKER_ID + 1) / (MAX_STICKER_ID - MIN_STICKER_ID + 1)) * 100).toFixed(1);
            console.log(
                `[${percent}%] Sticker ${stickerId}/${MAX_STICKER_ID} | ` +
                `Downloaded: ${totalDownloaded} | Skipped: ${totalSkipped} | ` +
                `404s: ${total404} | Errors: ${totalErrors} | Time: ${elapsed}s`
            );
        }

        // Small delay between stickers to be respectful
        await delay(250);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('Scraping Complete!');
    console.log('='.repeat(60));
    console.log(`Total Downloaded: ${totalDownloaded}`);
    console.log(`Total Skipped (existing): ${totalSkipped}`);
    console.log(`Total 404 (not found): ${total404}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Total Time: ${totalTime}s`);
    console.log('='.repeat(60));
}

/**
 * Find and delete empty sticker directories
 */
async function cleanEmptyDirectories() {
    console.log('='.repeat(60));
    console.log('Checking for empty sticker directories...');
    console.log('='.repeat(60));

    if (!fs.existsSync(ASSETS_DIR)) {
        console.log('Assets directory does not exist.');
        return;
    }

    const entries = fs.readdirSync(ASSETS_DIR, { withFileTypes: true });
    const emptyDirs = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const dirPath = path.join(ASSETS_DIR, entry.name);
            const files = fs.readdirSync(dirPath);

            if (files.length === 0) {
                emptyDirs.push(entry.name);
            }
        }
    }

    if (emptyDirs.length === 0) {
        console.log('✅ No empty directories found.');
        return;
    }

    console.log(`\nFound ${emptyDirs.length} empty directories:\n`);
    emptyDirs.forEach(dir => console.log(`  - ${dir}`));
    console.log('');

    // Delete empty directories
    for (const dir of emptyDirs) {
        const dirPath = path.join(ASSETS_DIR, dir);
        fs.rmdirSync(dirPath);
    }

    console.log(`✅ Deleted ${emptyDirs.length} empty directories.`);
    console.log('='.repeat(60));
}

// ============================================================
// ENTRY POINT
// ============================================================

async function run() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
CS2 Sticker Scraper

Usage: bun run index.js [options]

Options:
  --help, -h     Show this help message
  --reset        Reset progress and start from beginning
  --clean        Find and delete empty sticker directories

Configuration (edit index.js):
  WEAR_VALUES           Array of wear values to download (0-100)
  CONCURRENT_DOWNLOADS  Number of parallel downloads
  TARGET_WIDTH/HEIGHT   Resize dimensions
  OPTIMIZE_WEBP         Enable WebP optimization
  WEBP_QUALITY          Quality for WebP compression (1-100)
`);
        return;
    }

    if (args.includes('--clean')) {
        await cleanEmptyDirectories();
        return;
    }

    if (args.includes('--reset')) {
        if (fs.existsSync(PROGRESS_FILE)) {
            fs.unlinkSync(PROGRESS_FILE);
            console.log('Progress reset. Starting from beginning.');
        }
    }

    await scrapeStickers();
}

run().catch(console.error);

