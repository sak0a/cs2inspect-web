const fs = require('fs');
const path = require('path');
const axios = require('axios');
const charms = require('./charms.json');

const ASSETS_DIR = path.join(__dirname, 'assets');
const SEEDS = [1, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000];

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
            return;
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

async function run() {
    console.log(`Starting Scraper for ${charms.length} charms...`);

    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR);
    }

    let totalDownloaded = 0;
    let totalErrors = 0;

    for (let i = 0; i < charms.length; i++) {
        const { name, id } = charms[i];
        const safeName = sanitizeName(name);

        // console.log(`[${i + 1}/${charms.length}] Processing: ${name} (ID: ${id})`);

        // 1. Download Default Image (Seed 100 usually, or just checked)
        // Based on user report: "1355_82_100_front.webp" is the default.
        const defaultUrl = `https://img.cs2inspects.com/${id}_100_front.webp`;
        const defaultFilename = `${safeName}_default.webp`;

        const res = await downloadImage(defaultUrl, safeName, defaultFilename);
        if (res === true) totalDownloaded++;

        // 2. Download Variants
        // Try all standard seeds
        const promises = SEEDS.map(async (seed) => {
            const variantUrl = `https://img.cs2inspects.com/${id}_${seed}_front.webp`;
            const variantFilename = `${safeName}_seed_${seed}.webp`;
            const vRes = await downloadImage(variantUrl, safeName, variantFilename);
            if (vRes === true) totalDownloaded++;
        });

        await Promise.all(promises);

        // Log progress every 5 charms to keep output clean
        if ((i + 1) % 5 === 0) {
            console.log(`Examples processed: ${i + 1}/${charms.length}`);
        }
    }

    console.log('Scraping finished.');
    console.log(`Total images downloaded (new): ${totalDownloaded}`);
}

run();
