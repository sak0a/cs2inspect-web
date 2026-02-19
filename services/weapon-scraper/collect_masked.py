#!/usr/bin/env python3
"""
Collect all masked videos into a single directory.
Copies masked videos from downloads/*/masked/ to masked-videos/
"""

import argparse
import shutil
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DEFAULT_OUTPUT_DIR = Path("masked-videos")
DEFAULT_DOWNLOADS_DIR = Path("downloads")


def collect_masked_videos(
    downloads_dir: Path = DEFAULT_DOWNLOADS_DIR,
    output_dir: Path = DEFAULT_OUTPUT_DIR,
    dry_run: bool = False,
    force: bool = False
):
    """
    Collect all masked videos into a single directory.

    Args:
        downloads_dir: Directory containing weapon video folders
        output_dir: Destination directory for collected videos
        dry_run: If True, only print what would be done
        force: If True, overwrite existing files
    """
    if not downloads_dir.exists():
        logger.error(f"Downloads directory not found: {downloads_dir}")
        return

    # Find all masked video directories
    masked_dirs = list(downloads_dir.glob("*_videos/masked"))

    if not masked_dirs:
        logger.info("No masked video directories found.")
        return

    # Collect all masked videos
    videos = []
    for masked_dir in masked_dirs:
        for video in masked_dir.glob("*.webm"):
            videos.append(video)

    if not videos:
        logger.info("No masked videos found.")
        return

    logger.info(f"Found {len(videos)} masked videos in {len(masked_dirs)} weapon directories")

    # Create output directory
    if not dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)

    copied = 0
    skipped = 0
    errors = 0

    for video in sorted(videos):
        dest = output_dir / video.name

        if dest.exists() and not force:
            logger.debug(f"Skipping (exists): {video.name}")
            skipped += 1
            continue

        if dry_run:
            logger.info(f"[DRY RUN] Would copy: {video} -> {dest}")
            copied += 1
        else:
            try:
                shutil.copy2(video, dest)
                logger.info(f"Copied: {video.name}")
                copied += 1
            except Exception as e:
                logger.error(f"Failed to copy {video.name}: {e}")
                errors += 1

    # Summary
    logger.info(f"\n{'='*50}")
    if dry_run:
        logger.info(f"DRY RUN SUMMARY")
    else:
        logger.info(f"COLLECTION COMPLETE")
    logger.info(f"{'='*50}")
    logger.info(f"Copied:  {copied}")
    logger.info(f"Skipped: {skipped}")
    logger.info(f"Errors:  {errors}")
    logger.info(f"Output:  {output_dir.absolute()}")


def main():
    parser = argparse.ArgumentParser(
        description="Collect all masked videos into a single directory"
    )
    parser.add_argument("--output", "-o", type=Path, default=DEFAULT_OUTPUT_DIR,
                        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})")
    parser.add_argument("--downloads", "-d", type=Path, default=DEFAULT_DOWNLOADS_DIR,
                        help=f"Downloads directory (default: {DEFAULT_DOWNLOADS_DIR})")
    parser.add_argument("--dry-run", "-n", action="store_true",
                        help="Show what would be done without copying")
    parser.add_argument("--force", "-f", action="store_true",
                        help="Overwrite existing files")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show verbose output")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    collect_masked_videos(
        downloads_dir=args.downloads,
        output_dir=args.output,
        dry_run=args.dry_run,
        force=args.force
    )


if __name__ == "__main__":
    main()
