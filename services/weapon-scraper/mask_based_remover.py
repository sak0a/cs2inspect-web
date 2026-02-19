#!/usr/bin/env python3
"""
Multi-mask background remover for .webm videos.
Uses multiple mask images with fallback - if background color is still detected
after first mask, it retries with alternate masks.
"""

import cv2
import numpy as np
import subprocess
import argparse
from pathlib import Path
import logging
from PIL import Image
from tracking import VideoTracker

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Background color to check (BGR format)
# RGB: 30, 40, 54 -> #1E2836
BACKGROUND_COLOR_BGR = np.array([54, 40, 30], dtype=np.uint8)
BACKGROUND_TOLERANCE = 15

# Default masks directory
DEFAULT_MASKS_DIR = Path("masks")

# Weapon name to mask file prefix mapping
# Maps CLI weapon names to mask file prefixes
WEAPON_TO_MASK_PREFIX = {
    'ak-47': 'ak-47',
    'ak47': 'ak-47',
    'm4a1-s': 'm4a1-s',
    'm4a1s': 'm4a1-s',
    'm4a4': 'm4a4',
    'awp': 'awp',
    'usp-s': 'usp-s',
    'usps': 'usp-s',
    'glock-18': 'glock-18',
    'glock18': 'glock-18',
    'aug': 'aug',
    'famas': 'famas',
    'galil-ar': 'galil-ar',
    'galilar': 'galil-ar',
    'sg-553': 'sg-553',
    'sg553': 'sg-553',
    'scar-20': 'scar-20',
    'scar20': 'scar-20',
    'g3sg1': 'g3sg1',
    'ssg-08': 'ssg-08',
    'ssg08': 'ssg-08',
    'ssg': 'ssg-08',
    'mp7': 'mp7',
    'mp9': 'mp9',
    'mp5-sd': 'mp5-sd',
    'mp5sd': 'mp5-sd',
    'mac-10': 'mac-10',
    'mac10': 'mac-10',
    'ump-45': 'ump-45',
    'ump45': 'ump-45',
    'p90': 'p90',
    'pp-bizon': 'pp-bizon',
    'ppbizon': 'pp-bizon',
    'p2000': 'p2000',
    'p250': 'p250',
    'tec-9': 'tec-9',
    'tec9': 'tec-9',
    'five-seven': 'five-seven',
    'fiveseven': 'five-seven',
    'cz75-auto': 'cz75-auto',
    'cz75auto': 'cz75-auto',
    'desert-eagle': 'desert-eagle',
    'deagle': 'desert-eagle',
    'dual-berettas': 'dual-berettas',
    'dualberettas': 'dual-berettas',
    'r8-revolver': 'r8-revolver',
    'r8': 'r8-revolver',
    'nova': 'nova',
    'xm1014': 'xm1014',
    'sawed-off': 'sawed-off',
    'sawedoff': 'sawed-off',
    'mag-7': 'mag-7',
    'mag7': 'mag-7',
    'm249': 'm249',
    'negev': 'negev',
    'zeus': 'zeus',
}


def find_masks_for_weapon(weapon_name: str, masks_dir: Path = DEFAULT_MASKS_DIR) -> list:
    """
    Auto-detect mask files for a weapon from the masks directory.

    Args:
        weapon_name: Weapon name (e.g., 'awp', 'ak-47')
        masks_dir: Directory containing mask files

    Returns:
        List of mask file paths sorted by priority (primary mask first)
    """
    if not masks_dir.exists():
        logger.error(f"Masks directory not found: {masks_dir}")
        return []

    # Get the mask prefix for this weapon
    weapon_lower = weapon_name.lower()
    mask_prefix = WEAPON_TO_MASK_PREFIX.get(weapon_lower, weapon_lower.replace('-', ''))

    # Find all matching mask files
    mask_files = []

    # Try exact prefix match first
    for mask_file in masks_dir.glob(f"{mask_prefix}_mask*.png"):
        mask_files.append(mask_file)

    # If no matches, try without hyphens/underscores
    if not mask_files:
        alt_prefix = weapon_lower.replace('-', '').replace('_', '')
        for mask_file in masks_dir.glob(f"{alt_prefix}_mask*.png"):
            mask_files.append(mask_file)

    # Sort masks: primary mask first, then _2, _3, etc.
    def mask_sort_key(path):
        name = path.stem
        if name.endswith('_mask'):
            return (0, name)  # Primary mask comes first
        # Extract number from _mask_2, _mask_3, etc.
        try:
            num = int(name.split('_mask_')[-1])
            return (num, name)
        except ValueError:
            return (999, name)

    mask_files.sort(key=mask_sort_key)

    if mask_files:
        logger.info(f"Auto-detected {len(mask_files)} masks for '{weapon_name}': {[f.name for f in mask_files]}")
    else:
        logger.warning(f"No masks found for weapon '{weapon_name}' in {masks_dir}")

    return [str(f) for f in mask_files]


def load_mask(mask_path: str) -> np.ndarray:
    """
    Load mask image and convert to binary alpha mask.
    Black = keep (255), White/transparent = remove (0)
    """
    logger.info(f"Loading mask: {mask_path}")
    
    mask_pil = Image.open(mask_path).convert('RGBA')
    mask_np = np.array(mask_pil)
    
    rgb = mask_np[:, :, :3]
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    alpha = mask_np[:, :, 3]
    
    # Black areas with high alpha = keep
    mask = np.where((gray < 128) & (alpha > 128), 255, 0).astype(np.uint8)
    
    logger.info(f"Mask shape: {mask.shape}, keep pixels: {np.sum(mask > 0)}")
    return mask


def align_mask_to_video(mask: np.ndarray, video_width: int, video_height: int) -> np.ndarray:
    """Align mask to video dimensions by scaling and centering."""
    mask_h, mask_w = mask.shape[:2]
    
    if (mask_h, mask_w) == (video_height, video_width):
        return mask
    
    scale_w = video_width / mask_w
    scale_h = video_height / mask_h
    scale = min(scale_w, scale_h)
    
    new_w = int(mask_w * scale)
    new_h = int(mask_h * scale)
    
    scaled_mask = cv2.resize(mask, (new_w, new_h), interpolation=cv2.INTER_NEAREST)
    aligned_mask = np.zeros((video_height, video_width), dtype=np.uint8)
    
    offset_x = (video_width - new_w) // 2
    offset_y = (video_height - new_h) // 2
    
    aligned_mask[offset_y:offset_y + new_h, offset_x:offset_x + new_w] = scaled_mask
    
    return aligned_mask


def check_mask_quality(input_path: str, output_path: str, mask: np.ndarray, sample_frames: int = 3) -> bool:
    """
    Check if mask is correctly covering the weapon.
    
    A bad mask will make non-background colored weapon pixels transparent.
    This checks if pixels that are NOT background color in original
    have been incorrectly masked out (alpha=0).
    
    Returns True if mask quality is BAD (too many weapon pixels masked).
    """
    cap_in = cv2.VideoCapture(input_path)
    cap_out = cv2.VideoCapture(output_path)
    
    if not cap_in.isOpened() or not cap_out.isOpened():
        logger.error(f"Cannot open videos for verification")
        return True
    
    frame_count = int(cap_in.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap_in.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap_in.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Ensure even dimensions
    if width % 2 != 0:
        width -= 1
    if height % 2 != 0:
        height -= 1
    
    # Get aligned mask
    aligned_mask = align_mask_to_video(mask, width, height)
    
    sample_indices = [int(i * frame_count / (sample_frames + 1)) for i in range(1, sample_frames + 1)]
    
    total_weapon_pixels = 0
    masked_weapon_pixels = 0
    
    for idx in sample_indices:
        cap_in.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame_in = cap_in.read()
        if not ret:
            continue
        
        if frame_in.shape[1] != width or frame_in.shape[0] != height:
            frame_in = cv2.resize(frame_in, (width, height))
        
        # Find pixels that are NOT background color (likely weapon)
        lower = np.clip(BACKGROUND_COLOR_BGR - BACKGROUND_TOLERANCE, 0, 255)
        upper = np.clip(BACKGROUND_COLOR_BGR + BACKGROUND_TOLERANCE, 0, 255)
        
        bg_match = cv2.inRange(frame_in[:,:,:3], lower, upper)
        weapon_pixels = bg_match == 0  # NOT background = weapon
        
        weapon_count = np.sum(weapon_pixels)
        total_weapon_pixels += weapon_count
        
        # Check how many weapon pixels have alpha=0 in mask
        masked_out = (aligned_mask == 0) & weapon_pixels
        masked_weapon_pixels += np.sum(masked_out)
    
    cap_in.release()
    cap_out.release()
    
    # If more than 5% of weapon pixels are incorrectly masked, consider it failed
    if total_weapon_pixels > 0:
        masked_ratio = masked_weapon_pixels / total_weapon_pixels
        if masked_ratio > 0.05:  # 5%
            logger.warning(f"Mask cuts off {masked_ratio*100:.1f}% of weapon")
            return True
    
    logger.info(f"✓ Mask quality OK")
    return False


def process_video_with_mask(input_path: str, output_path: str, mask: np.ndarray) -> bool:
    """Process video using mask to remove background."""
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        logger.error(f"Cannot open video: {input_path}")
        return False
    
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if width % 2 != 0:
        width -= 1
    if height % 2 != 0:
        height -= 1
    
    aligned_mask = align_mask_to_video(mask, width, height)
    
    ffmpeg_cmd = [
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{width}x{height}', '-pix_fmt', 'bgra', '-r', str(fps),
        '-i', '-', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
        '-b:v', '2M', '-auto-alt-ref', '0', output_path
    ]
    
    process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    
    frame_idx = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame.shape[1] != width or frame.shape[0] != height:
                frame = cv2.resize(frame, (width, height))
            
            frame_bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
            frame_bgra[:, :, 3] = aligned_mask
            
            process.stdin.write(frame_bgra.tobytes())
            frame_idx += 1
            
            if frame_idx % 20 == 0:
                print(f"  Frame {frame_idx}/{frame_count}...", end='\r')
        
        print(f"  Processed {frame_idx} frames.      ")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return False
    finally:
        cap.release()
        if process.stdin:
            process.stdin.close()
        process.wait()
    
    return process.returncode == 0


def process_weapon_videos_multi_mask(weapon_name: str, mask_paths: list, output_suffix: str = "_masked", skip_tracked: bool = True):
    """
    Process all videos for a weapon using multiple masks with fallback.
    Tries first mask, verifies result, retries with next mask if needed.

    Args:
        weapon_name: Name of the weapon (e.g., 'awp')
        mask_paths: List of mask file paths in priority order
        output_suffix: Suffix for output filenames
        skip_tracked: Skip videos already tracked as masked
    """
    downloads_dir = Path("downloads")
    weapon_dir = downloads_dir / f"{weapon_name}_videos"

    if not weapon_dir.exists():
        logger.error(f"Weapon directory not found: {weapon_dir}")
        return

    # Initialize tracker
    tracker = VideoTracker()

    # Load all masks
    masks = []
    for mask_path in mask_paths:
        try:
            masks.append(load_mask(mask_path))
        except Exception as e:
            logger.error(f"Failed to load mask {mask_path}: {e}")

    if not masks:
        logger.error("No valid masks loaded!")
        return

    output_dir = weapon_dir / "masked"
    output_dir.mkdir(exist_ok=True)

    webm_files = list(weapon_dir.glob("*.webm"))
    logger.info(f"Found {len(webm_files)} .webm files, {len(masks)} masks available")

    results = {"success": [], "failed": [], "skipped": []}

    for i, webm_file in enumerate(webm_files, 1):
        video_id = webm_file.stem.lower()

        # Skip if already tracked as masked
        if skip_tracked and tracker.is_masked(video_id):
            logger.info(f"[{i}/{len(webm_files)}] Skipping (already masked): {webm_file.name}")
            results["skipped"].append(webm_file.name)
            continue

        logger.info(f"\n[{i}/{len(webm_files)}] {webm_file.name}")

        output_filename = webm_file.stem + output_suffix + ".webm"
        output_path = output_dir / output_filename

        success = False
        used_mask = None

        for mask_idx, mask in enumerate(masks):
            logger.info(f"  Trying mask {mask_idx + 1}/{len(masks)}...")

            if process_video_with_mask(str(webm_file), str(output_path), mask):
                # Verify the result - check if mask cuts off weapon parts
                if not check_mask_quality(str(webm_file), str(output_path), mask):
                    logger.info(f"  Success with mask {mask_idx + 1}")
                    success = True
                    used_mask = mask_paths[mask_idx]
                    break
                else:
                    logger.warning(f"  Mask {mask_idx + 1} cuts off weapon parts")
            else:
                logger.error(f"  Processing failed with mask {mask_idx + 1}")

        if success:
            results["success"].append(webm_file.name)
            # Record successful masking
            tracker.record_masked(
                video_id=video_id,
                output_path=str(output_path),
                mask_used=str(used_mask)
            )
        else:
            results["failed"].append(webm_file.name)
            logger.error(f"  All masks failed for {webm_file.name}")
            # Record failure
            tracker.record_failure(video_id, "masked", "All masks failed")

    # Summary
    logger.info(f"\n{'='*60}")
    logger.info(f"COMPLETE: {len(results['success'])} successful, {len(results['failed'])} failed, {len(results['skipped'])} skipped")
    logger.info(f"Output: {output_dir}")

    if results["failed"]:
        logger.warning(f"Failed videos: {results['failed']}")

    # Print tracking summary
    tracker.print_summary()

    return results


def process_all_unmasked(masks_dir: Path, output_suffix: str = "_masked", force: bool = False):
    """
    Automatically process all tracked videos that are downloaded but not yet masked.
    Groups videos by weapon type and processes each group with auto-detected masks.
    """
    tracker = VideoTracker()
    unmasked = tracker.get_unmasked_videos()

    if not unmasked:
        logger.info("No unmasked videos found. All tracked videos have been processed.")
        return

    # Group by weapon
    weapons = {}
    for video in unmasked:
        weapon = video.get("weapon")
        if weapon:
            if weapon not in weapons:
                weapons[weapon] = []
            weapons[weapon].append(video)

    logger.info(f"Found {len(unmasked)} unmasked videos across {len(weapons)} weapons")

    # Process each weapon type
    for weapon, videos in sorted(weapons.items()):
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing {len(videos)} {weapon} videos")

        # Find masks for this weapon
        mask_paths = find_masks_for_weapon(weapon, masks_dir)
        if not mask_paths:
            logger.warning(f"No masks found for {weapon}, skipping {len(videos)} videos")
            continue

        # Process using existing function
        process_weapon_videos_multi_mask(
            weapon,
            mask_paths,
            output_suffix,
            skip_tracked=not force
        )

    # Final summary
    tracker.print_summary()


def main():
    parser = argparse.ArgumentParser(
        description="Remove background using multiple masks with fallback",
        epilog="If --masks is not specified, masks are auto-detected from the masks directory."
    )
    parser.add_argument("weapon", nargs='?', help="Weapon name (e.g., 'awp', 'ak-47')")
    parser.add_argument("--masks", "-m", nargs='+',
                        help="Paths to mask images (optional - auto-detected if not specified)")
    parser.add_argument("--masks-dir", default="masks",
                        help="Directory containing mask files (default: masks/)")
    parser.add_argument("--suffix", default="_masked", help="Output filename suffix")
    parser.add_argument("--single", "-s", help="Process a single video")
    parser.add_argument("--output", "-o", help="Output path (for single file)")
    parser.add_argument("--force", "-f", action="store_true",
                        help="Force re-process even if already tracked")
    parser.add_argument("--show-stats", action="store_true",
                        help="Show tracking statistics and exit")
    parser.add_argument("--auto", "-a", action="store_true",
                        help="Automatically process all unmasked tracked videos")
    parser.add_argument("--list-masks", action="store_true",
                        help="List available masks for a weapon and exit")

    args = parser.parse_args()

    # Show stats and exit
    if args.show_stats:
        tracker = VideoTracker()
        tracker.print_summary()
        return

    # Auto-process all unmasked
    if args.auto:
        masks_dir = Path(args.masks_dir)
        process_all_unmasked(masks_dir, args.suffix, force=args.force)
        return

    # Validate required args for processing
    if not args.weapon and not args.single:
        parser.error("weapon is required unless using --show-stats or --auto")

    masks_dir = Path(args.masks_dir)

    # List masks and exit
    if args.list_masks:
        if args.weapon:
            mask_paths = find_masks_for_weapon(args.weapon, masks_dir)
            if mask_paths:
                print(f"Available masks for '{args.weapon}':")
                for p in mask_paths:
                    print(f"  - {p}")
            else:
                print(f"No masks found for '{args.weapon}' in {masks_dir}")
        else:
            print(f"Masks in {masks_dir}:")
            for f in sorted(masks_dir.glob("*_mask*.png")):
                print(f"  - {f.name}")
        return

    # Determine mask paths
    if args.masks:
        mask_paths = args.masks
    elif args.weapon:
        mask_paths = find_masks_for_weapon(args.weapon, masks_dir)
        if not mask_paths:
            parser.error(f"No masks found for weapon '{args.weapon}' in {masks_dir}. "
                        f"Use --masks to specify mask files manually.")
    else:
        parser.error("Either --masks or weapon name is required")

    if args.single:
        masks = [load_mask(m) for m in mask_paths]
        output = args.output or args.single.replace('.webm', '_masked.webm')

        for i, mask in enumerate(masks):
            logger.info(f"Trying mask {i+1}...")
            if process_video_with_mask(args.single, output, mask):
                if not check_mask_quality(args.single, output, mask):
                    logger.info(f"Success with mask {i+1}")
                    break
    else:
        process_weapon_videos_multi_mask(
            args.weapon,
            mask_paths,
            args.suffix,
            skip_tracked=not args.force
        )


if __name__ == "__main__":
    main()
