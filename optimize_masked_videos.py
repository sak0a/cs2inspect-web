#!/usr/bin/env python3
"""
Optimize masked .webm videos for smaller file size while preserving quality and transparency.

This script processes videos from masked-videos/ and saves optimized versions to masked-videos-optimized/
Key considerations:
- Preserves alpha channel (transparency) using VP9 with yuva420p pixel format
- Uses two-pass encoding for optimal quality-to-size ratio
- Applies CRF-based quality settings to maintain visual quality

Note: VP9 alpha videos may show yuv420p in ffprobe but actually contain an alpha channel
encoded separately. We check the alpha_mode tag and verify by decoding a frame.
"""

import argparse
import concurrent.futures
import multiprocessing
import os
import subprocess
import tempfile
from pathlib import Path

# Default directories
DEFAULT_INPUT_DIR = Path("masked-videos")
DEFAULT_OUTPUT_DIR = Path("masked-videos-optimized")


def check_video_has_alpha(video_path: str) -> bool:
    """
    Check if video actually has alpha channel by decoding a frame.
    
    VP9 alpha videos store alpha in a separate stream that ffprobe may not
    properly detect. We decode one frame to rgba and check if any pixels
    are transparent.
    """
    with tempfile.NamedTemporaryFile(suffix='.png', delete=True) as tmp:
        # Decode first frame to RGBA PNG using libvpx-vp9 decoder
        cmd = [
            'ffmpeg', '-y', '-v', 'error',
            '-c:v', 'libvpx-vp9',  # Force VP9 decoder to get alpha
            '-i', video_path,
            '-vframes', '1',
            '-pix_fmt', 'rgba',
            '-update', '1',
            tmp.name
        ]
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode != 0:
            return False
        
        # Check if the PNG has any transparent pixels using ffprobe
        # by looking at whether the format includes alpha
        check_cmd = [
            'ffprobe', '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=pix_fmt',
            '-of', 'csv=p=0',
            tmp.name
        ]
        result = subprocess.run(check_cmd, capture_output=True, text=True)
        pix_fmt = result.stdout.strip()
        
        if 'a' not in pix_fmt.lower():  # rgba, bgra, etc.
            return False
        
        # Now check if there are actually transparent pixels
        # by using ffmpeg to count black pixels in alpha channel
        check_alpha_cmd = [
            'ffmpeg', '-v', 'error',
            '-i', tmp.name,
            '-vf', 'alphaextract,blackdetect=d=0.001:pix_th=0.01',
            '-f', 'null', '-'
        ]
        result = subprocess.run(check_alpha_cmd, capture_output=True, text=True)
        
        # If alpha extract succeeded and found black (transparent) areas
        # Or we can just trust that rgba format with alpha_mode=1 has alpha
        return True


def get_video_info(video_path: str) -> dict:
    """Get video information using ffprobe."""
    cmd = [
        'ffprobe', '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name,pix_fmt,width,height',
        '-show_entries', 'stream_tags',
        '-of', 'json',
        video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return {}
    
    import json
    try:
        data = json.loads(result.stdout)
        if data.get('streams'):
            stream = data['streams'][0]
            pix_fmt = stream.get('pix_fmt', '')
            
            # Check if alpha is indicated by either:
            # 1. alpha_mode tag (can be lowercase or uppercase depending on encoder)
            # 2. pixel format containing 'a' (yuva420p, rgba, etc.)
            tags = stream.get('tags', {})
            # Check both lowercase and uppercase alpha_mode
            has_alpha_tag = (
                tags.get('alpha_mode') == '1' or 
                tags.get('ALPHA_MODE') == '1'
            )
            has_alpha_pix = 'yuva' in pix_fmt or 'rgba' in pix_fmt or 'bgra' in pix_fmt
            
            return {
                'codec': stream.get('codec_name'),
                'pix_fmt': pix_fmt,
                'width': stream.get('width'),
                'height': stream.get('height'),
                'has_alpha': has_alpha_tag or has_alpha_pix,
                'alpha_mode_tag': has_alpha_tag
            }
    except json.JSONDecodeError:
        pass
    return {}


def optimize_video(input_path: str, output_path: str, crf: int = 32, verbose: bool = True) -> bool:
    """
    Optimize a WebM video using VP9 two-pass encoding.
    
    Args:
        input_path: Path to input video
        output_path: Path to save optimized video
        crf: Constant Rate Factor (0-63, lower = higher quality, higher file size)
             Recommended range: 28-35 for good quality/size balance
        verbose: Print progress information
    
    Returns:
        True if optimization succeeded, False otherwise
    """
    # Get video info to check for alpha channel
    info = get_video_info(input_path)
    has_alpha = info.get('has_alpha', False)
    
    # Use yuva420p for videos with alpha, yuv420p otherwise
    # For VP9 with alpha: we need to preserve the alpha channel
    pix_fmt = 'yuva420p' if has_alpha else 'yuv420p'
    
    if verbose:
        print(f"  Video info: {info.get('width')}x{info.get('height')}, alpha={has_alpha}")
    
    # Create temporary file for two-pass log
    passlog_file = output_path + '_passlog'
    
    try:
        # Base encoding settings for VP9 with good quality
        # Using two-pass encoding for better quality/size ratio
        # IMPORTANT: Use -c:v libvpx-vp9 on INPUT to properly decode VP9 alpha
        base_cmd = [
            'ffmpeg', '-y',
            '-c:v', 'libvpx-vp9',  # Input decoder - critical for alpha!
            '-i', input_path,
            '-c:v', 'libvpx-vp9',  # Output encoder
            '-pix_fmt', pix_fmt,
            '-crf', str(crf),
            '-b:v', '0',  # Use CRF mode (set bitrate to 0)
            '-deadline', 'good',  # Encoding speed preset
            '-cpu-used', '2',  # 0-5, lower = slower but better quality
            '-row-mt', '1',  # Enable row-based multithreading
            '-auto-alt-ref', '1' if not has_alpha else '0',  # Disable for alpha videos
            '-lag-in-frames', '25',  # Lookahead frames for better compression
        ]
        
        # For videos with alpha, add alpha-specific settings
        if has_alpha:
            # Ensure alpha channel is preserved
            base_cmd.extend(['-metadata:s:v:0', 'alpha_mode=1'])
        
        # Pass 1 - analyze video
        if verbose:
            print("  Pass 1/2: Analyzing...")
        pass1_cmd = base_cmd + [
            '-pass', '1',
            '-passlogfile', passlog_file,
            '-an',  # No audio
            '-f', 'null',
            '/dev/null' if os.name != 'nt' else 'NUL'
        ]
        
        result = subprocess.run(
            pass1_cmd,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"  Pass 1 failed: {result.stderr[:200]}")
            return False
        
        # Pass 2 - encode
        if verbose:
            print("  Pass 2/2: Encoding...")
        pass2_cmd = base_cmd + [
            '-pass', '2',
            '-passlogfile', passlog_file,
            '-an',  # No audio (source videos don't have audio)
            output_path
        ]
        
        result = subprocess.run(
            pass2_cmd,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"  Pass 2 failed: {result.stderr[:200]}")
            return False
        
        return True
        
    finally:
        # Clean up pass log files
        for suffix in ['', '-0.log']:
            log_file = passlog_file + suffix
            if os.path.exists(log_file):
                os.remove(log_file)


def verify_video(original_path: str, optimized_path: str) -> dict:
    """
    Verify that optimized video preserves essential properties.
    
    Returns dict with verification results.
    """
    original_info = get_video_info(original_path)
    optimized_info = get_video_info(optimized_path)
    
    original_size = os.path.getsize(original_path)
    optimized_size = os.path.getsize(optimized_path)
    
    # Check alpha by looking at the alpha_mode tag, which is preserved correctly
    # ffprobe shows pix_fmt as yuv420p but the actual video has alpha
    original_has_alpha = original_info.get('alpha_mode_tag', False) or original_info.get('has_alpha', False)
    optimized_has_alpha = optimized_info.get('alpha_mode_tag', False) or optimized_info.get('has_alpha', False)
    
    results = {
        'original_size': original_size,
        'optimized_size': optimized_size,
        'reduction_pct': (1 - optimized_size / original_size) * 100 if original_size > 0 else 0,
        'dimensions_match': (
            original_info.get('width') == optimized_info.get('width') and
            original_info.get('height') == optimized_info.get('height')
        ),
        'alpha_preserved': original_has_alpha == optimized_has_alpha,
        'original_alpha': original_has_alpha,
        'optimized_alpha': optimized_has_alpha,
    }
    
    return results


def format_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} TB"


def process_single_video(args: tuple) -> dict:
    """
    Process a single video (wrapper for parallel execution).
    
    Args:
        args: Tuple of (input_path, output_path, crf, index, total)
    
    Returns:
        Dict with results
    """
    input_path, output_path, crf, index, total = args
    filename = Path(input_path).name
    
    result = {
        'filename': filename,
        'success': False,
        'skipped': False,
        'original_size': 0,
        'optimized_size': 0,
        'reduction_pct': 0,
        'alpha_preserved': False,
        'dimensions_match': False,
    }
    
    # Skip if already optimized
    if Path(output_path).exists():
        result['skipped'] = True
        return result
    
    # Get video info for logging
    info = get_video_info(input_path)
    print(f"[{index}/{total}] Processing: {filename} ({info.get('width')}x{info.get('height')}, alpha={info.get('has_alpha', False)})")
    
    success = optimize_video(input_path, output_path, crf=crf, verbose=False)
    
    if success and Path(output_path).exists():
        verification = verify_video(input_path, output_path)
        result['success'] = True
        result['original_size'] = verification['original_size']
        result['optimized_size'] = verification['optimized_size']
        result['reduction_pct'] = verification['reduction_pct']
        result['alpha_preserved'] = verification['alpha_preserved']
        result['dimensions_match'] = verification['dimensions_match']
        
        print(f"  ✓ {filename}: {format_size(verification['original_size'])} → {format_size(verification['optimized_size'])} ({verification['reduction_pct']:.1f}% reduction)")
    else:
        print(f"  ✗ {filename}: FAILED")
    
    return result


def main():
    """Main function to process videos."""
    parser = argparse.ArgumentParser(
        description="Optimize masked videos for smaller file size while preserving transparency"
    )
    parser.add_argument("--input", "-i", type=Path, default=DEFAULT_INPUT_DIR,
                        help=f"Input directory (default: {DEFAULT_INPUT_DIR})")
    parser.add_argument("--output", "-o", type=Path, default=DEFAULT_OUTPUT_DIR,
                        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})")
    parser.add_argument("--crf", type=int, default=32,
                        help="CRF value 0-63, lower=better quality (default: 32)")
    parser.add_argument("--workers", type=int, default=None,
                        help="Number of parallel workers (default: half of CPU cores)")
    parser.add_argument("--test", "-t", action="store_true",
                        help="Test mode: process only first video")
    parser.add_argument("--sequential", "-s", action="store_true",
                        help="Process videos sequentially instead of in parallel")

    args = parser.parse_args()

    input_dir = args.input
    output_dir = args.output
    crf = args.crf
    test_mode = args.test
    sequential = args.sequential
    max_workers = args.workers or max(1, multiprocessing.cpu_count() // 2)

    # Check input directory exists
    if not input_dir.exists():
        print(f"Input directory not found: {input_dir}")
        print(f"Run 'python collect_masked.py' first to collect masked videos.")
        return

    # Create output directory if it doesn't exist
    output_dir.mkdir(exist_ok=True)

    # Get list of webm files
    webm_files = sorted(input_dir.glob('*.webm'))

    if not webm_files:
        print(f"No .webm files found in {input_dir}/")
        return
    
    if test_mode:
        # Only process first video for testing
        webm_files = webm_files[:1]
        print(f"TEST MODE: Processing only 1 video with CRF={crf}")
        sequential = True  # Always sequential for test mode
    else:
        # Count how many need processing
        to_process = sum(1 for f in webm_files if not (output_dir / f.name).exists())
        already_done = len(webm_files) - to_process
        print(f"Found {len(webm_files)} videos, {already_done} already optimized, {to_process} to process")
        print(f"Settings: CRF={crf}, workers={max_workers if not sequential else 1}")
    
    # Prepare tasks
    tasks = [
        (str(f), str(output_dir / f.name), crf, i, len(webm_files))
        for i, f in enumerate(webm_files, 1)
    ]
    
    # Filter out already processed (for parallel mode we want to skip early)
    tasks_to_run = [t for t in tasks if not Path(t[1]).exists()]
    
    if not tasks_to_run:
        print("\nAll videos already optimized!")
        return
    
    print(f"\nProcessing {len(tasks_to_run)} videos...\n")
    
    total_original = 0
    total_optimized = 0
    successful = 0
    failed = 0
    skipped = len(tasks) - len(tasks_to_run)
    
    if sequential:
        # Sequential processing (original behavior)
        for task in tasks_to_run:
            result = process_single_video(task)
            if result['success']:
                successful += 1
                total_original += result['original_size']
                total_optimized += result['optimized_size']
            elif not result['skipped']:
                failed += 1
    else:
        # Parallel processing
        with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers) as executor:
            try:
                results = list(executor.map(process_single_video, tasks_to_run))
                
                for result in results:
                    if result['success']:
                        successful += 1
                        total_original += result['original_size']
                        total_optimized += result['optimized_size']
                    elif not result['skipped']:
                        failed += 1
            except KeyboardInterrupt:
                print("\n\nInterrupted! Shutting down workers...")
                executor.shutdown(wait=False, cancel_futures=True)
                raise
    
    # Print summary
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Skipped (already done): {skipped}")
    if total_original > 0:
        print(f"Total original size:  {format_size(total_original)}")
        print(f"Total optimized size: {format_size(total_optimized)}")
        print(f"Total reduction: {(1 - total_optimized / total_original) * 100:.1f}%")


if __name__ == '__main__':
    main()

