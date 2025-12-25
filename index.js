const fs = require('fs');
const path = require('path');
const axios = require('axios');
const charms = require('./charms.json');

const ASSETS_DIR = path.join(__dirname, 'assets');
const STICKER_SLAB_DIR = path.join(ASSETS_DIR, 'sticker_slab');
const PROGRESS_FILE = path.join(__dirname, 'sticker_slab_progress.json');
const SEEDS = [1, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000];

// Helper to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to download image
async function downloadImage(url, folderName, filename) {
    try {
        const dirPath = path.join(ASSETS_DIR, folderName);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, filename);

        // Check if exists to avoid redownloading
        if (fs.existsSync(filePath)) {
            // console.log(`Skipping ${filename}, already exists.`);
            return true; // Marked as success even if skipped
        }

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', () => {
                resolve(true); // Downloaded
            });
            writer.on('error', reject);
        });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // 404 is expected for seeds that don't exist
            return '404';
        }
        console.error(`Error downloading ${url}: ${error.message}`);
        return 'error';
    }
}

function sanitizeName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function scrapeCharms() {
    console.log(`Starting Standard Charm Scraper for ${charms.length} charms...`);

    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR);
    }

    let totalDownloaded = 0;

    for (let i = 0; i < charms.length; i++) {
        const { name, id } = charms[i];
        const safeName = sanitizeName(name);

        // 1. Download Default Image
        const envUrl = process.env.SCRAPE_URL || 'localhost:3000';
        const defaultUrl = envUrl + `/${id}_100_front.webp`;
        const defaultFilename = `${safeName}_default_empty.webp`;

        const res = await downloadImage(defaultUrl, safeName, defaultFilename);
        if (res === true) totalDownloaded++;

        // 2. Download Variants
        const promises = SEEDS.map(async (seed) => {
            const variantUrl = envUrl + `/${id}_${seed}_front.webp`;
            const variantFilename = `${safeName}_seed_${seed}.webp`;
            const vRes = await downloadImage(variantUrl, safeName, variantFilename);
            if (vRes === true) totalDownloaded++;
        });

        await Promise.all(promises);

        if ((i + 1) % 5 === 0) {
            console.log(`Charms processed: ${i + 1}/${charms.length}`);
        }
    }

    console.log('Standard Charm Scraping finished.');
    console.log(`Total images downloaded: ${totalDownloaded}`);
}

async function scrapeStickerSlabs() {
    console.log('Starting Sticker Slab Scraper (IDs 1-10312)...');
    console.log('Running with 50 concurrent downloads...');

    // Create sticker_slab directory
    if (!fs.existsSync(STICKER_SLAB_DIR)) {
        fs.mkdirSync(STICKER_SLAB_DIR, { recursive: true });
    }

    // Load progress
    let startId = 1;
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
            if (progress.lastId) {
                startId = progress.lastId + 1;
                console.log(`Resuming from ID ${startId}...`);
            }
        } catch {
            console.error('Error reading progress file, starting from 1');
        }
    }

    const END_ID = 10312;
    const BATCH_SIZE = 50;
    let totalDownloaded = 0;
    let consecutiveErrors = 0;

    // Helper function to process a single ID
    const processId = async (id) => {
        const envUrl = process.env.SCRAPE_URL || 'localhost:3000';
        const url = envUrl + `/1355_37_${id}_front.webp`;
        const filename = `sticker_slab_sticker_${id}.webp`;

        const result = await downloadImage(url, 'sticker_slab', filename);

        if (result === true) {
            totalDownloaded++;
            consecutiveErrors = 0; // Reset error count on success
            return true;
        } else if (result === 'error') {
            console.warn(`Failed to download ID ${id}`);
            consecutiveErrors++;
            return false;
        }
        return true; // 404 or skipped counts as "processed"
    };

    for (let id = startId; id <= END_ID; id += BATCH_SIZE) {
        // Create a batch of promises
        const batchPromises = [];
        const currentBatchEnd = Math.min(id + BATCH_SIZE - 1, END_ID);

        for (let currentId = id; currentId <= currentBatchEnd; currentId++) {
            batchPromises.push(processId(currentId));
        }

        // Wait for all in batch to complete
        await Promise.all(batchPromises);

        // Check for too many errors
        if (consecutiveErrors > 20) { // Increased threshold for batching
            console.error('Too many consecutive errors. Stopping to prevent IP ban or useless retries.');
            process.exit(1);
        }

        // Save progress (last processed ID in this batch)
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastId: currentBatchEnd, timestamp: new Date().toISOString() }));

        // Log progress
        console.log(`Stickers processed: ${currentBatchEnd}/${END_ID} (Downloaded this session: ${totalDownloaded})`);

        // Small delay between batches
        await delay(500);
    }

    console.log('Sticker Slab Scraping finished.');
}

async function run() {
    const args = process.argv.slice(2);
    const mode = args[0];

    if (mode === 'slabs') {
        await scrapeStickerSlabs();
    } else if (mode === 'charms') {
        await scrapeCharms();
    } else {
        console.log('Please specify mode: "node index.js charms" or "node index.js slabs"');
        console.log('Running standard charms by default in 3 seconds...');
        await delay(3000);
        await scrapeCharms();
    }
}

run();
