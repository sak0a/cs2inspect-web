# CS2 Charm Scraper Service

This service is a standalone Node.js utility designed to scrape and download charm images from a configured source for use in the CS2 Inspect Web application.

## 📂 Project Structure

```bash
/services/charm-scraper/
├── assets/                 # Downloaded images are stored here
│   ├── charm_name_a/       # Subdirectory for each charm
│   │   ├── charm_name_a_default.webp
│   │   ├── charm_name_a_seed_1.webp
│   │   └── ...
│   └── ...
├── charms.json            # Configuration file mapping Charm Names to IDs
├── index.js               # Main scraper script
├── package.json           # Dependencies (axios)
```

## 🛠 How It Works

1.  **Configuration**:
    - The `charms.json` file contains a curated list of charms with their names and internal IDs.
    - **Environment Variable**: The base URL for scraping is configured via the `SCRAPE_URL` environment variable in the project's `.env` file.
2.  **Image URL Pattern**: The scraper constructs image URLs using the pattern:
    - Default: `https://{SCRAPE_URL}/{ID}_100_front.webp`
    - Variants: `https://{SCRAPE_URL}/{ID}_{SEED}_front.webp`
3.  **Downloading**: It iterates through the list and downloads images to local folders in `assets/`.
    - It skips files that already exist.
    - It uses a standard set of 10 seed variations (`1, 10000, ... 90000`) commonly used for charms.

## 📦 Usage

To run the scraper and update/download images:

```bash
cd services/charm-scraper
npm install
node index.js
```

## 🔗 Integration Guide

This data is intended to be used in the `InlineVisualCustomizer` and `KeychainModal` components.

### Data Format

The file naming convention is designed to be easily parsed:

- **Format**: `{sanitized_charm_name}_{type}_{seed/variant}.webp`
- **Example**: `dr__brian_seed_10000.webp`

### Implementation Strategy for Frontend

1.  **Importing**: You can either import these assets statically or serve them via a public directory.
2.  **Mapping**: Use the `charms.json` (or a similar derived config) in your Vue components to know which charms are available.
3.  **Seed Selection**:
    - When a user selects a charm, the default image (`_default.webp`) should be shown.
    - If the charm supports pattern variations, you can provide a UI (slider or dropdown) to select from the standard seeds.
    - The image source can be dynamically computed based on the selection:
        ```javascript
        const getCharmImage = (charmName, seed) => {
            // Construct path based on convention
            return `/assets/charms/${charmName}/${charmName}_seed_${seed}.webp`
        }
        ```
