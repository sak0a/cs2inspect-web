#!/usr/bin/env python3
"""
CS:GO Container Skins Video Scraper
Scrapes weapon skin videos from containers with threading and rate limiting.
Organizes videos into weapon-specific directories based on skin names.
Configure BASE_URL in .env file.

Usage:
    python skins_scraper-container.py --container sealed-genesis-terminal
    python skins_scraper-container.py -c sealed-genesis-terminal --workers 3 --delay 2.0

The scraper will automatically organize videos into directories like:
    downloads/ak-47_videos/ak-47-the-oligarch.webm
    downloads/m4a4_videos/m4a4-full-throttle.webm
    downloads/awp_videos/awp-ice-coaled.webm
    etc.
"""

import requests
from bs4 import BeautifulSoup
import os
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse
import logging
from typing import List, Optional
import argparse
from pathlib import Path
from dotenv import load_dotenv
from tracking import VideoTracker

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CSGOSkinsScraper:
    def __init__(self, container: str = "sealed-genesis-terminal", max_workers: int = 5, delay: float = 1.0, skip_tracked: bool = True):
        """
        Initialize the scraper for container items

        Args:
            container: Container name (e.g., "sealed-genesis-terminal")
            max_workers: Maximum number of concurrent threads
            delay: Delay between requests in seconds
            skip_tracked: Skip videos that are already tracked as downloaded
        """
        self.container = container
        self.max_workers = max_workers
        self.delay = delay
        self.skip_tracked = skip_tracked
        self.base_url = f"https://{os.getenv('BASE_URL', 'exampleskins.com')}"
        self.container_url = f"{self.base_url}/containers/{container}"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

        # Initialize tracker
        self.tracker = VideoTracker()

        # Weapon name mapping to directory names (matching existing directory structure)
        self.weapon_mapping = {
            # Assault Rifles
            'ak-47': 'ak-47_videos',
            'ak47': 'ak-47_videos',
            'm4a4': 'm4a4_videos',
            'm4a1-s': 'm4a1-s_videos',
            'm4a1': 'm4a1-s_videos',
            'aug': 'aug_videos',
            'famas': 'famas_videos',
            'galil-ar': 'galil-ar_videos',
            'galil': 'galil-ar_videos',
            'sg-553': 'sg-553_videos',
            'sg553': 'sg-553_videos',

            # Sniper Rifles
            'awp': 'awp_videos',
            'scar-20': 'scar-20_videos',
            'scar20': 'scar-20_videos',
            'g3sg1': 'g3sg1_videos',
            'ssg-08': 'ssg-08_videos',
            'ssg08': 'ssg-08_videos',

            # SMGs
            'mp7': 'mp7_videos',
            'mp9': 'mp9_videos',
            'mp5-sd': 'mp5-sd_videos',
            'mp5sd': 'mp5-sd_videos',
            'mac-10': 'mac-10_videos',
            'mac10': 'mac-10_videos',
            'ump-45': 'ump-45_videos',
            'ump45': 'ump-45_videos',
            'p90': 'p90_videos',
            'pp-bizon': 'pp-bizon_videos',
            'bizon': 'pp-bizon_videos',

            # Pistols
            'glock-18': 'glock-18_videos',
            'glock18': 'glock-18_videos',
            'glock': 'glock-18_videos',
            'usp-s': 'usp-s_videos',
            'usps': 'usp-s_videos',
            'p2000': 'p2000_videos',
            'p250': 'p250_videos',
            'tec-9': 'tec-9_videos',
            'tec9': 'tec-9_videos',
            'five-seven': 'five-seven_videos',
            'fiveseven': 'five-seven_videos',
            'cz75-auto': 'cz75-auto_videos',
            'cz75': 'cz75-auto_videos',
            'desert-eagle': 'desert-eagle_videos',
            'deagle': 'desert-eagle_videos',
            'dual-berettas': 'dual-berettas_videos',
            'dualies': 'dual-berettas_videos',
            'r8-revolver': 'r8-revolver_videos',
            'r8': 'r8-revolver_videos',

            # Shotguns
            'nova': 'nova_videos',
            'xm1014': 'xm1014_videos',
            'sawed-off': 'sawed-off_videos',
            'sawedoff': 'sawed-off_videos',
            'mag-7': 'mag-7_videos',
            'mag7': 'mag-7_videos',

            # Machine Guns
            'm249': 'm249_videos',
            'negev': 'negev_videos'
        }

        # Create base download directory
        self.base_download_dir = Path("downloads")
        self.base_download_dir.mkdir(parents=True, exist_ok=True)

        # Thread lock for rate limiting
        self.request_lock = threading.Lock()
        self.last_request_time = 0

    def rate_limited_request(self, url: str, timeout: int = 10) -> Optional[requests.Response]:
        """Make a rate-limited HTTP request"""
        with self.request_lock:
            # Ensure minimum delay between requests
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            if time_since_last < self.delay:
                time.sleep(self.delay - time_since_last)
            
            try:
                response = self.session.get(url, timeout=timeout)
                response.raise_for_status()
                self.last_request_time = time.time()
                return response
            except requests.RequestException as e:
                logger.error(f"Request failed for {url}: {e}")
                return None

    def get_skin_links(self) -> List[str]:
        """
        Get all skin links from the container page

        Returns:
            List of skin URLs
        """
        logger.info(f"Fetching skin links from {self.container_url}")

        response = self.rate_limited_request(self.container_url)
        if not response:
            logger.error(f"Failed to fetch container page: {self.container_url}")
            return []

        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all skin links using the provided CSS selector
        # Adjusted selector to be more flexible for container pages
        skin_links = []

        # Try multiple selectors as the exact one might vary
        selectors = [
            "body > main > div:nth-child(3) > div > div > div.left-4.right-4.text-center.absolute.overflow-hidden.top-\\[15px\\] > h2 > a",
            ".text-center h2 a",  # More general selector
            "h2 a[href*='/items/']",  # Even more general
            "a[href*='/items/']",  # Most general
        ]

        for selector in selectors:
            try:
                links = soup.select(selector)
                if links:
                    logger.info(f"Found {len(links)} links using selector: {selector}")
                    break
            except Exception as e:
                logger.warning(f"Selector failed: {selector} - {e}")
                continue

        if not links:
            # Fallback: find all links containing '/items/'
            links = soup.find_all('a', href=lambda x: x and '/items/' in x)
            logger.info(f"Using fallback method, found {len(links)} potential skin links")

        for link in links:
            href = link.get('href')
            if href:
                full_url = urljoin(self.base_url, href)
                if '/items/' in full_url and full_url not in skin_links:
                    skin_links.append(full_url)

        logger.info(f"Found {len(skin_links)} unique skin links")
        return skin_links

    def get_video_url(self, skin_url: str) -> Optional[str]:
        """
        Get video URL from a skin page
        
        Args:
            skin_url: URL of the skin page
            
        Returns:
            Video URL or None if not found
        """
        logger.debug(f"Fetching video URL from {skin_url}")
        
        response = self.rate_limited_request(skin_url)
        if not response:
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the canvas element with video URL
        canvas = soup.select_one("#inspect-float-canvas")
        if canvas and canvas.get('data-video-url'):
            video_url = canvas['data-video-url']
            logger.debug(f"Found video URL: {video_url}")
            return video_url
        
        logger.warning(f"No video URL found for {skin_url}")
        return None

    def get_weapon_directory(self, skin_name: str) -> str:
        """
        Determine the weapon directory based on the skin name

        Args:
            skin_name: The skin name (e.g., "ak-47-the-oligarch")

        Returns:
            Directory name for the weapon
        """
        # Extract weapon name from skin name
        skin_lower = skin_name.lower()

        # Check each weapon mapping
        for weapon_key, directory in self.weapon_mapping.items():
            if skin_lower.startswith(weapon_key + '-') or skin_lower.startswith(weapon_key + '_'):
                return directory

        # If no match found, try to extract the first part
        parts = skin_lower.replace('_', '-').split('-')
        if len(parts) >= 2:
            # Try combinations of first parts
            for i in range(1, min(3, len(parts) + 1)):
                weapon_part = '-'.join(parts[:i])
                if weapon_part in self.weapon_mapping:
                    return self.weapon_mapping[weapon_part]

        # Default fallback - use the first part with _videos suffix
        if parts:
            return f"{parts[0]}_videos"

        return "unknown_videos"

    def get_weapon_name(self, skin_name: str) -> str:
        """
        Extract weapon name from skin name for tracking.

        Args:
            skin_name: The skin name (e.g., "ak-47-the-oligarch")

        Returns:
            Weapon name (e.g., "ak-47")
        """
        skin_lower = skin_name.lower()

        # Check each weapon mapping
        for weapon_key in self.weapon_mapping.keys():
            if skin_lower.startswith(weapon_key + '-') or skin_lower.startswith(weapon_key + '_'):
                return weapon_key

        # Fallback: extract first part
        parts = skin_lower.replace('_', '-').split('-')
        if parts:
            return parts[0]
        return "unknown"

    def download_video(self, video_url: str, skin_name: str, skin_url: str) -> bool:
        """
        Download a video file to the appropriate weapon directory

        Args:
            video_url: URL of the video
            skin_name: Name for the file
            skin_url: URL of the skin page (for tracking)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Determine weapon directory and name
            weapon_dir = self.get_weapon_directory(skin_name)
            weapon_name = self.get_weapon_name(skin_name)
            video_id = skin_name.lower()

            # Create weapon-specific directory
            download_dir = self.base_download_dir / weapon_dir
            download_dir.mkdir(parents=True, exist_ok=True)

            # Extract filename from URL or use skin name
            parsed_url = urlparse(video_url)
            filename = os.path.basename(parsed_url.path)
            if not filename or not filename.endswith('.webm'):
                filename = f"{skin_name}.webm"

            filepath = download_dir / filename

            # Skip if already tracked as downloaded
            if self.skip_tracked and self.tracker.is_downloaded(video_id):
                logger.info(f"Already tracked: {weapon_dir}/{filename}")
                return True

            # Skip if file already exists (fallback check)
            if filepath.exists():
                logger.info(f"File already exists: {weapon_dir}/{filename}")
                # Record in tracker if not already tracked
                if not self.tracker.is_downloaded(video_id):
                    self.tracker.record_download(
                        video_id=video_id,
                        weapon=weapon_name,
                        skin_name=skin_name,
                        source="container",
                        source_url=skin_url,
                        file_path=str(filepath)
                    )
                return True

            logger.info(f"Downloading to {weapon_dir}/{filename}")

            response = self.rate_limited_request(video_url, timeout=30)
            if not response:
                self.tracker.record_failure(video_id, "download", "Request failed", weapon_name, skin_name)
                return False

            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            # Record successful download
            self.tracker.record_download(
                video_id=video_id,
                weapon=weapon_name,
                skin_name=skin_name,
                source="container",
                source_url=skin_url,
                file_path=str(filepath)
            )

            logger.info(f"Successfully downloaded: {weapon_dir}/{filename}")
            return True

        except Exception as e:
            logger.error(f"Failed to download {video_url}: {e}")
            self.tracker.record_failure(skin_name.lower(), "download", str(e), self.get_weapon_name(skin_name), skin_name)
            return False

    def process_skin(self, skin_url: str) -> bool:
        """
        Process a single skin: get video URL and download

        Args:
            skin_url: URL of the skin page

        Returns:
            True if successful, False otherwise
        """
        try:
            # Extract skin name from URL
            skin_name = skin_url.split('/')[-1]
            video_id = skin_name.lower()

            # Skip if already tracked
            if self.skip_tracked and self.tracker.is_downloaded(video_id):
                logger.info(f"Skipping (already tracked): {skin_name}")
                return True

            logger.info(f"Processing skin: {skin_name}")

            # Get video URL
            video_url = self.get_video_url(skin_url)
            if not video_url:
                logger.warning(f"No video found for {skin_name}")
                weapon_name = self.get_weapon_name(skin_name)
                self.tracker.record_failure(video_id, "download", "No video URL found", weapon_name, skin_name)
                return False

            # Download video
            return self.download_video(video_url, skin_name, skin_url)

        except Exception as e:
            logger.error(f"Error processing {skin_url}: {e}")
            return False

    def scrape_all(self) -> None:
        """Main scraping method"""
        logger.info(f"Starting scrape for container: {self.container}")

        # Get all skin links
        skin_links = self.get_skin_links()
        if not skin_links:
            logger.error("No skin links found!")
            return

        logger.info(f"Processing {len(skin_links)} skins with {self.max_workers} workers")

        # Process skins with threading
        successful = 0
        failed = 0

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_url = {
                executor.submit(self.process_skin, url): url
                for url in skin_links
            }

            # Process completed tasks
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    success = future.result()
                    if success:
                        successful += 1
                    else:
                        failed += 1
                except Exception as e:
                    logger.error(f"Task failed for {url}: {e}")
                    failed += 1

        logger.info(f"Scraping completed! Successful: {successful}, Failed: {failed}")
        logger.info(f"Videos saved to weapon-specific directories in: {self.base_download_dir}")

        # Print tracking summary
        self.tracker.print_summary()


def main():
    parser = argparse.ArgumentParser(description='CS:GO Container Skins Video Scraper')
    parser.add_argument('--container', '-c', default='sealed-genesis-terminal',
                        help='Container name (e.g., sealed-genesis-terminal)')
    parser.add_argument('--workers', '-t', type=int, default=5,
                        help='Number of concurrent threads')
    parser.add_argument('--delay', '-d', type=float, default=1.0,
                        help='Delay between requests in seconds')
    parser.add_argument('--force', '-f', action='store_true',
                        help='Force re-download even if already tracked')
    parser.add_argument('--show-stats', action='store_true',
                        help='Show tracking statistics and exit')

    args = parser.parse_args()

    # Show stats and exit
    if args.show_stats:
        tracker = VideoTracker()
        tracker.print_summary()
        return

    scraper = CSGOSkinsScraper(
        container=args.container,
        max_workers=args.workers,
        delay=args.delay,
        skip_tracked=not args.force
    )

    scraper.scrape_all()


if __name__ == "__main__":
    main()
