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

// Sticker IDs to ignore (e.g., stickers that don't exist on the server)
const IGNORED_STICKER_IDS = [29, 30, 45, 54, 204, 205, 206, 216, 217, 218, 277, 298, 299,
    1653, 1654, 1655, 1656, 1657, 1658, 1659, 1660, 1661, 1662, 1663, 1664, 1665, 1666, 1667, 1668, 1669, 1670, 1671, 1672, 1673, 1674, 1675, 1676, 1677, 1678, 1679, 1680, 1681, 1682, 1683, 1684, 1685, 1686, 1687, 1688, 1696, 1697, 1698, 1699, 1700, 1701, 1702, 1703, 1704, 1705, 1706, 1707, 1708, 1709, 1710, 1711, 1712, 1713, 1714, 1715, 1716, 1717, 1718, 1719, 1720, 1721, 1722, 1723, 1724, 1725, 1726, 1727, 1728, 1729, 1730, 1731, 1732, 1733, 1734, 1735, 1736, 1737, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1817, 1818, 1819, 1820, 1821, 1822,
    2131, 2132, 2133, 2134, 2135, 2136, 2137, 2138, 2139, 2140, 2141, 2142, 2143, 2144, 2145, 2146, 2147, 2418, 2419, 2420, 2421, 2422, 2423, 2424, 2425, 2426, 2427, 2428, 2429, 2430, 2431, 2432, 2433, 2434, 2435, 2536, 2537, 2538, 2539, 2540, 2541, 2542, 2543, 2544, 2545, 2546, 2547, 2548, 2549, 2550, 2551, 2552, 2553, 2554, 2555, 2556, 2557, 2558, 2559, 2560, 2939,
    3055, 3056, 3057, 3058, 3059, 3060, 3061, 3062, 3063, 3064, 3065, 3066, 3067, 3068, 3069, 3070, 3071, 3072, 3073, 3074, 3075, 3076, 3077, 3078, 3079, 3458, 3459, 3560, 3561, 3562, 3563, 3564, 3565, 3566, 3567, 3568, 3569, 3570, 3571, 3572, 3573, 3574, 3575, 3576, 3577, 3578, 3579, 3580, 3581, 3582, 3583, 3584, 3948, 3957, 3964, 3983, 3984, 3985, 3986, 3987, 3988, 3989, 3990, 3991, 3992, 3993, 3994, 3995, 3996, 3997, 3998, 3999,
    4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010, 4011, 4012, 4013, 4014, 4015, 4016, 4017, 4018, 4119, 4120, 4121, 4122, 4123, 4124, 4125, 4126, 4127, 4128, 4129, 4130, 4131, 4132, 4133, 4134, 4135, 4136, 4137, 4138, 4139, 4140, 4141, 4142, 4143, 4550, 4551, 4552, 4553, 4554, 4555, 4556, 4557, 4558, 4559, 4560, 4561, 4562, 4563, 4564, 4565, 4566, 4567, 4568, 4569, 4570, 4571, 4572, 4573, 4574, 4575, 4576, 4578, 4579, 4581, 4582, 4583, 4584, 4585, 4586, 4587, 4588, 4589, 4591, 4592, 4593, 4594, 4595, 4596, 4597, 4598, 4599, 4600, 4631, 4632, 4633, 4634, 4635, 4636, 4637, 4638, 4639, 4640, 4641, 4642, 4643, 4644, 4645, 4646, 4697, 4699, 4700, 4937, 4938, 4939, 4940, 4941, 4942, 4943, 4944, 4945, 4946, 4947, 4948, 4949,
    5054, 5055, 5056, 5057, 5058, 5059, 5060, 5061, 5062, 5063, 5064, 5065, 5066, 5067, 5068, 5069, 5070, 5071, 5072, 5073, 5074, 5075, 5076, 5077, 5078, 5079, 5080, 5081, 5082, 5083, 5084, 5085, 5086, 5087, 5088, 5089, 5090, 5091, 5092, 5093, 5094, 5095, 5096, 5097, 5098, 5099, 5100, 5101, 5102, 5103, 5104, 5105, 5106, 5107, 5108, 5109, 5110, 5111, 5112, 5113, 5114, 5115, 5116, 5117, 5118, 5119, 5120, 5121, 5122, 5123, 5124, 5125, 5126, 5127, 5128, 5371, 5372, 5373, 5374, 5375, 5376, 5377, 5378, 5379, 5380, 5381, 5382, 5383, 5384, 5385, 5386, 5387, 5388, 5389, 5390, 5391, 5392, 5393, 5394, 5395,
    6061, 6062, 6063, 6064, 6065, 6066, 6067, 6068, 6069, 6070, 6071, 6072, 6073, 6074, 6075, 6076, 6077, 6078, 6079, 6080, 6081, 6082, 6083, 6084, 6085, 6708, 6709, 6710, 6711, 6712, 6713, 6714, 6715, 6716, 6717, 6718, 6719, 6720, 6721, 6722, 6723, 6724, 6725, 6726, 6727, 6728, 6729, 6730, 6731, 6732,
    7354, 7355, 7356, 7357, 7358, 7359, 7360, 7361, 7362, 7363, 7364, 7365, 7366, 7367, 7368, 7369, 7370, 7371, 7372, 7373, 7374, 7375, 7376, 7377, 7378, 7908, 7920,
    8028, 8029, 8030, 8031, 8032, 8033, 8034, 8035, 8036, 8037, 8038, 8039, 8040, 8041, 8042, 8043, 8044, 8045, 8046, 8047, 8048, 8049, 8050, 8051, 8052, 8686, 8687, 8688, 8689, 8690, 8691, 8692, 8693, 8694, 8695, 8696, 8697, 8698, 8699, 8700, 8701, 8702, 8703, 8704, 8705, 8706, 8707, 8708, 8709, 8710, 8711, 8712, 8713, 8714, 8715, 8716, 8717, 8718,
    9621, 9622, 9623, 9624, 9625, 9626, 9627, 9628, 9629, 9630, 9631, 9632, 9633, 9634, 9635, 9636, 9637, 9638, 9639, 9640, 9641, 9642, 9643, 9644, 9645, 9646, 9647, 9648, 9649, 9650, 9651, 9652, 9653];

// ============================================================
// PATHS AND CONSTANTS
// ============================================================

const BASE_URL = process.env.SCRAPE_URL || 'https://cdn.cs2inspects.com';
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
            const stats = fs.statSync(filePath);
            return { status: 'skipped', stickerId, wear, fileSize: stats.size };
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

        // Get file size after saving
        const stats = fs.statSync(filePath);
        return { status: 'downloaded', stickerId, wear, fileSize: stats.size };

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { status: '404', stickerId, wear, fileSize: 0 };
        }
        console.error(`Error downloading sticker ${stickerId} wear ${wear}: ${error.message}`);
        return { status: 'error', stickerId, wear, error: error.message, fileSize: 0 };
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
 * Format bytes to human readable size
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Save progress to file
 */
function saveProgress(lastStickerId, sessionStats = {}) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        lastStickerId,
        timestamp: new Date().toISOString(),
        sessionStats: {
            totalBytesDownloaded: sessionStats.totalBytes || 0,
            totalImagesDownloaded: sessionStats.totalDownloaded || 0,
            totalImagesSkipped: sessionStats.totalSkipped || 0
        }
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
    let totalBytesDownloaded = 0;
    let last100Bytes = 0;
    let stickersInLast100 = 0;

    const startTime = Date.now();

    // Process stickers in batches
    for (let stickerId = startId; stickerId <= MAX_STICKER_ID; stickerId++) {
        // Check if sticker ID is on ignore list
        if (IGNORED_STICKER_IDS.includes(stickerId)) {
            console.log(`⏭️  Skipping sticker ${stickerId} (on ignore list)`);
            continue;
        }

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
        let stickerBytes = 0;

        for (const result of results) {
            switch (result.status) {
                case 'downloaded':
                    totalDownloaded++;
                    stickerDownloaded++;
                    stickerBytes += result.fileSize || 0;
                    totalBytesDownloaded += result.fileSize || 0;
                    last100Bytes += result.fileSize || 0;
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
            saveProgress(stickerId - 1, { totalBytes: totalBytesDownloaded, totalDownloaded, totalSkipped });
            process.exit(1);
        }

        // Track stickers for 100-sticker summary
        stickersInLast100++;

        // Save progress with stats
        saveProgress(stickerId, { totalBytes: totalBytesDownloaded, totalDownloaded, totalSkipped });

        // Log progress every 50 stickers or on download
        if (stickerId % 50 === 0 || stickerDownloaded > 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const percent = (((stickerId - MIN_STICKER_ID + 1) / (MAX_STICKER_ID - MIN_STICKER_ID + 1)) * 100).toFixed(1);
            const stickerSizeStr = stickerBytes > 0 ? ` | Sticker: ${formatBytes(stickerBytes)}` : '';
            console.log(
                `[${percent}%] Sticker ${stickerId}/${MAX_STICKER_ID} | ` +
                `Downloaded: ${totalDownloaded} | Skipped: ${totalSkipped} | ` +
                `404s: ${total404} | Errors: ${totalErrors}${stickerSizeStr} | Time: ${elapsed}s`
            );
        }

        // Every 100 stickers, log size summary
        if (stickersInLast100 >= 100) {
            console.log(`📊 Last 100 stickers: ${formatBytes(last100Bytes)} | Session total: ${formatBytes(totalBytesDownloaded)}`);
            last100Bytes = 0;
            stickersInLast100 = 0;
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
    console.log(`Total Size Downloaded: ${formatBytes(totalBytesDownloaded)}`);
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

