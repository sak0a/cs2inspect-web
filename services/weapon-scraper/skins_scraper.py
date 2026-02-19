#!/usr/bin/env python3
"""
CS:GO Skins Video Scraper
Scrapes weapon skin videos with threading and rate limiting.
Configure BASE_URL in .env file.
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
    def __init__(self, weapon: str = "awp", max_workers: int = 5, delay: float = 1.0, page: int = 1, skip_tracked: bool = True):
        """
        Initialize the scraper

        Args:
            weapon: Weapon type (awp, m4a4, ak47, etc.)
            max_workers: Maximum number of concurrent threads
            delay: Delay between requests in seconds
            page: Page number for weapons with multiple pages of skins
            skip_tracked: Skip videos that are already tracked as downloaded
        """
        self.weapon = weapon
        self.max_workers = max_workers
        self.delay = delay
        self.page = page
        self.skip_tracked = skip_tracked
        self.base_url = f"https://{os.getenv('BASE_URL', 'exampleskins.com')}"
        self.weapon_url = f"{self.base_url}/weapons/{weapon}?page={page}"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

        # Create download directory
        self.download_dir = Path(f"downloads/{weapon}_videos")
        self.download_dir.mkdir(parents=True, exist_ok=True)

        # Initialize tracker
        self.tracker = VideoTracker()

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
        Get all skin links from the weapon page
        
        Returns:
            List of skin URLs
        """
        logger.info(f"Fetching skin links from {self.weapon_url}")
        
        response = self.rate_limited_request(self.weapon_url)
        if not response:
            logger.error(f"Failed to fetch weapon page: {self.weapon_url}")
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all skin links using the provided CSS selector
        # Adjusted selector to be more flexible
        skin_links = []
        
        # Try multiple selectors as the exact one might vary
        selectors = [
            "body > main > div:nth-child(3) > div > div > div.left-4.right-4.text-center.absolute.overflow-hidden.top-\\[15px\\] > h2 > a",
            ".text-center h2 a",  # More general selector
            "h2 a[href*='/items/']",  # Even more general
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

    def download_video(self, video_url: str, skin_name: str, skin_url: str) -> bool:
        """
        Download a video file

        Args:
            video_url: URL of the video
            skin_name: Name for the file
            skin_url: URL of the skin page (for tracking)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Extract filename from URL or use skin name
            parsed_url = urlparse(video_url)
            filename = os.path.basename(parsed_url.path)
            if not filename or not filename.endswith('.webm'):
                filename = f"{skin_name}.webm"

            video_id = skin_name.lower()
            filepath = self.download_dir / filename

            # Skip if already tracked as downloaded
            if self.skip_tracked and self.tracker.is_downloaded(video_id):
                logger.info(f"Already tracked: {filename}")
                return True

            # Skip if file already exists (fallback check)
            if filepath.exists():
                logger.info(f"File already exists: {filename}")
                # Record in tracker if not already tracked
                if not self.tracker.is_downloaded(video_id):
                    self.tracker.record_download(
                        video_id=video_id,
                        weapon=self.weapon,
                        skin_name=skin_name,
                        source="weapon",
                        source_url=skin_url,
                        file_path=str(filepath)
                    )
                return True

            logger.info(f"Downloading {filename}")

            response = self.rate_limited_request(video_url, timeout=30)
            if not response:
                self.tracker.record_failure(video_id, "download", "Request failed", self.weapon, skin_name)
                return False

            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            # Record successful download
            self.tracker.record_download(
                video_id=video_id,
                weapon=self.weapon,
                skin_name=skin_name,
                source="weapon",
                source_url=skin_url,
                file_path=str(filepath)
            )

            logger.info(f"Successfully downloaded: {filename}")
            return True

        except Exception as e:
            logger.error(f"Failed to download {video_url}: {e}")
            self.tracker.record_failure(skin_name.lower(), "download", str(e), self.weapon, skin_name)
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
                self.tracker.record_failure(video_id, "download", "No video URL found", self.weapon, skin_name)
                return False

            # Download video
            return self.download_video(video_url, skin_name, skin_url)

        except Exception as e:
            logger.error(f"Error processing {skin_url}: {e}")
            return False

    def scrape_all(self) -> None:
        """Main scraping method"""
        logger.info(f"Starting scrape for weapon: {self.weapon}")
        
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
        logger.info(f"Videos saved to: {self.download_dir}")

        # Print tracking summary
        self.tracker.print_summary()


def main():
    parser = argparse.ArgumentParser(description='CS:GO Skins Video Scraper')
    parser.add_argument('--weapon', '-w', default='awp',
                        help='Weapon type (awp, m4a4, ak47, etc.)')
    parser.add_argument('--workers', '-t', type=int, default=5,
                        help='Number of concurrent threads')
    parser.add_argument('--delay', '-d', type=float, default=1.0,
                        help='Delay between requests in seconds')
    parser.add_argument('--page', '-p', type=int, default=1,
                        help='Page number for weapons with many skins (default: 1)')
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
        weapon=args.weapon,
        max_workers=args.workers,
        delay=args.delay,
        page=args.page,
        skip_tracked=not args.force
    )

    scraper.scrape_all()


if __name__ == "__main__":
    main()
