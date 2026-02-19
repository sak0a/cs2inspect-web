#!/usr/bin/env python3
"""
Video Processing Tracker
Tracks downloaded and masked videos with timestamps, file sizes, and MD5 checksums.
"""

import json
import hashlib
import threading
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any


class VideoTracker:
    """Thread-safe tracker for video download and processing status."""

    def __init__(self, tracking_file: str = "tracking.json"):
        self.tracking_file = Path(tracking_file)
        self.lock = threading.Lock()
        self._load()

    def _load(self) -> None:
        """Load tracking data from JSON file."""
        if self.tracking_file.exists():
            try:
                with open(self.tracking_file, 'r') as f:
                    self.data = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._init_empty()
        else:
            self._init_empty()

    def _init_empty(self) -> None:
        """Initialize empty tracking structure."""
        self.data = {
            "version": "1.0",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "videos": {},
            "stats": {
                "total_downloaded": 0,
                "total_masked": 0,
                "failed_downloads": 0,
                "failed_masks": 0
            }
        }

    def _save(self) -> None:
        """Save tracking data to JSON file."""
        self.data["last_updated"] = datetime.utcnow().isoformat() + "Z"
        with open(self.tracking_file, 'w') as f:
            json.dump(self.data, f, indent=2)

    def _update_stats(self) -> None:
        """Recalculate statistics from video data."""
        stats = {
            "total_downloaded": 0,
            "total_masked": 0,
            "failed_downloads": 0,
            "failed_masks": 0
        }

        for video in self.data["videos"].values():
            if "download" in video:
                if video["download"].get("status") == "success":
                    stats["total_downloaded"] += 1
                elif video["download"].get("status") == "failed":
                    stats["failed_downloads"] += 1

            if "masked" in video:
                if video["masked"].get("status") == "success":
                    stats["total_masked"] += 1
                elif video["masked"].get("status") == "failed":
                    stats["failed_masks"] += 1

        self.data["stats"] = stats

    @staticmethod
    def calculate_md5(filepath: str) -> str:
        """Calculate MD5 checksum of a file."""
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    @staticmethod
    def get_file_size(filepath: str) -> int:
        """Get file size in bytes."""
        return os.path.getsize(filepath)

    def _get_video_id(self, skin_name: str, weapon: str) -> str:
        """Generate consistent video ID from skin name."""
        # Use the skin name as-is, it's usually unique enough
        return skin_name.lower().replace(" ", "-")

    def record_download(
        self,
        video_id: str,
        weapon: str,
        skin_name: str,
        source: str,
        source_url: str,
        file_path: str
    ) -> None:
        """Record a successful download."""
        with self.lock:
            if video_id not in self.data["videos"]:
                self.data["videos"][video_id] = {}

            video = self.data["videos"][video_id]
            video["weapon"] = weapon
            video["skin_name"] = skin_name
            video["source"] = source
            video["source_url"] = source_url
            video["download"] = {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "file_path": str(file_path),
                "file_size": self.get_file_size(file_path),
                "md5": self.calculate_md5(file_path)
            }

            self._update_stats()
            self._save()

    def record_masked(
        self,
        video_id: str,
        output_path: str,
        mask_used: str
    ) -> None:
        """Record a successful masking operation."""
        with self.lock:
            if video_id not in self.data["videos"]:
                self.data["videos"][video_id] = {}

            video = self.data["videos"][video_id]
            video["masked"] = {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "file_path": str(output_path),
                "file_size": self.get_file_size(output_path),
                "md5": self.calculate_md5(output_path),
                "mask_used": str(mask_used)
            }

            self._update_stats()
            self._save()

    def record_failure(
        self,
        video_id: str,
        operation: str,
        error: str,
        weapon: str = None,
        skin_name: str = None
    ) -> None:
        """Record a failed operation."""
        with self.lock:
            if video_id not in self.data["videos"]:
                self.data["videos"][video_id] = {}

            video = self.data["videos"][video_id]
            if weapon:
                video["weapon"] = weapon
            if skin_name:
                video["skin_name"] = skin_name

            video[operation] = {
                "status": "failed",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": error
            }

            self._update_stats()
            self._save()

    def is_downloaded(self, video_id: str) -> bool:
        """Check if video has been successfully downloaded."""
        with self.lock:
            video = self.data["videos"].get(video_id, {})
            return video.get("download", {}).get("status") == "success"

    def is_masked(self, video_id: str) -> bool:
        """Check if video has been successfully masked."""
        with self.lock:
            video = self.data["videos"].get(video_id, {})
            return video.get("masked", {}).get("status") == "success"

    def get_video_info(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get full info for a video."""
        with self.lock:
            return self.data["videos"].get(video_id)

    def get_stats(self) -> Dict[str, int]:
        """Get tracking statistics."""
        with self.lock:
            return self.data["stats"].copy()

    def get_unmasked_videos(self) -> list:
        """Get list of videos that are downloaded but not yet masked."""
        with self.lock:
            unmasked = []
            for video_id, video in self.data["videos"].items():
                if (video.get("download", {}).get("status") == "success" and
                    video.get("masked", {}).get("status") != "success"):
                    unmasked.append({
                        "video_id": video_id,
                        "weapon": video.get("weapon"),
                        "file_path": video.get("download", {}).get("file_path")
                    })
            return unmasked

    def print_summary(self) -> None:
        """Print a summary of tracking status."""
        stats = self.get_stats()
        print("\n" + "=" * 50)
        print("VIDEO PROCESSING TRACKER SUMMARY")
        print("=" * 50)
        print(f"Total Downloaded:    {stats['total_downloaded']}")
        print(f"Total Masked:        {stats['total_masked']}")
        print(f"Failed Downloads:    {stats['failed_downloads']}")
        print(f"Failed Masks:        {stats['failed_masks']}")
        print(f"Pending Masking:     {stats['total_downloaded'] - stats['total_masked']}")
        print("=" * 50)

        # Show by weapon
        weapons = {}
        with self.lock:
            for video in self.data["videos"].values():
                weapon = video.get("weapon", "unknown")
                if weapon not in weapons:
                    weapons[weapon] = {"downloaded": 0, "masked": 0}
                if video.get("download", {}).get("status") == "success":
                    weapons[weapon]["downloaded"] += 1
                if video.get("masked", {}).get("status") == "success":
                    weapons[weapon]["masked"] += 1

        if weapons:
            print("\nBy Weapon:")
            print("-" * 40)
            for weapon in sorted(weapons.keys()):
                d = weapons[weapon]["downloaded"]
                m = weapons[weapon]["masked"]
                print(f"  {weapon:20} {m}/{d} masked")
        print()


def main():
    """CLI for viewing tracking stats."""
    import argparse

    parser = argparse.ArgumentParser(description="Video Processing Tracker")
    parser.add_argument("--file", "-f", default="tracking.json",
                        help="Path to tracking file")
    parser.add_argument("--unmasked", "-u", action="store_true",
                        help="List videos pending masking")

    args = parser.parse_args()

    tracker = VideoTracker(args.file)

    if args.unmasked:
        unmasked = tracker.get_unmasked_videos()
        if unmasked:
            print(f"\nVideos pending masking ({len(unmasked)}):")
            for v in unmasked:
                print(f"  [{v['weapon']}] {v['video_id']}")
        else:
            print("\nNo videos pending masking.")
    else:
        tracker.print_summary()


if __name__ == "__main__":
    main()
