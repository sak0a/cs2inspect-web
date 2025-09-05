/**
 * Video-based canvas utilities for weapon skin wear progression
 */

import type { Point, Size } from '~/types/canvas'

export interface VideoCanvasOptions {
  /** Video element for the weapon skin */
  video: HTMLVideoElement
  /** Canvas context for rendering */
  ctx: CanvasRenderingContext2D
  /** Canvas dimensions */
  canvasSize: Size
  /** Current wear value (0.0 - 1.0) */
  wearValue: number
  /** Minimum wear value for this skin */
  minWear: number
  /** Maximum wear value for this skin */
  maxWear: number
  /** Video duration in seconds (default: 140) */
  videoDuration?: number
}

export interface VideoMetadata {
  /** Video duration in seconds */
  duration: number
  /** Video width */
  width: number
  /** Video height */
  height: number
  /** Whether video is ready to play */
  isReady: boolean
}

/**
 * Video canvas manager for weapon skin wear progression
 */
export class VideoCanvasManager {
  private video: HTMLVideoElement
  private ctx: CanvasRenderingContext2D
  private canvasSize: Size
  private videoDuration: number
  private minWear: number
  private maxWear: number
  private isVideoReady: boolean = false
  private currentWear: number = 0
  private renderCallback?: () => void

  constructor(options: VideoCanvasOptions) {
    this.video = options.video
    this.ctx = options.ctx
    this.canvasSize = options.canvasSize
    this.videoDuration = options.videoDuration || 140
    this.minWear = options.minWear
    this.maxWear = options.maxWear
    this.currentWear = options.wearValue

    this.setupVideo()
  }

  /**
   * Setup video element with event listeners
   */
  private setupVideo(): void {
    this.video.addEventListener('loadedmetadata', () => {
      this.videoDuration = this.video.duration
      this.isVideoReady = true
      this.seekToWear(this.currentWear)
    })

    this.video.addEventListener('loadeddata', () => {
      this.isVideoReady = true
      this.seekToWear(this.currentWear)
    })

    this.video.addEventListener('seeked', () => {
      if (this.renderCallback) {
        this.renderCallback()
      }
    })

    this.video.addEventListener('error', (e) => {
      console.error('Video loading error:', e)
      this.isVideoReady = false
    })

    // Disable video controls and autoplay
    this.video.controls = false
    this.video.autoplay = false
    this.video.muted = true
    this.video.loop = false
  }

  /**
   * Load video from URL
   */
  async loadVideo(videoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        this.video.removeEventListener('loadeddata', handleLoad)
        this.video.removeEventListener('error', handleError)
        resolve()
      }

      const handleError = (e: Event) => {
        this.video.removeEventListener('loadeddata', handleLoad)
        this.video.removeEventListener('error', handleError)
        reject(new Error('Failed to load video'))
      }

      this.video.addEventListener('loadeddata', handleLoad)
      this.video.addEventListener('error', handleError)
      
      this.video.src = videoUrl
      this.video.load()
    })
  }

  /**
   * Calculate timestamp based on wear value
   */
  private calculateTimestamp(wearValue: number): number {
    // Normalize wear value to the available range
    const normalizedWear = (wearValue - this.minWear) / (this.maxWear - this.minWear)
    
    // Clamp to 0-1 range
    const clampedWear = Math.max(0, Math.min(1, normalizedWear))
    
    // Calculate timestamp (0 to videoDuration seconds)
    return clampedWear * this.videoDuration
  }

  /**
   * Seek video to specific wear value
   */
  async seekToWear(wearValue: number): Promise<void> {
    if (!this.isVideoReady) {
      this.currentWear = wearValue
      return
    }

    const timestamp = this.calculateTimestamp(wearValue)
    this.currentWear = wearValue

    return new Promise((resolve) => {
      const handleSeeked = () => {
        this.video.removeEventListener('seeked', handleSeeked)
        resolve()
      }

      this.video.addEventListener('seeked', handleSeeked)
      this.video.currentTime = timestamp
    })
  }

  /**
   * Render current video frame to canvas
   */
  renderFrame(): void {
    if (!this.isVideoReady || !this.video.videoWidth || !this.video.videoHeight) {
      this.renderFallback()
      return
    }

    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height)
      
      // Calculate aspect ratio and positioning
      const videoAspect = this.video.videoWidth / this.video.videoHeight
      const canvasAspect = this.canvasSize.width / this.canvasSize.height
      
      let drawWidth = this.canvasSize.width
      let drawHeight = this.canvasSize.height
      let drawX = 0
      let drawY = 0

      if (videoAspect > canvasAspect) {
        // Video is wider than canvas
        drawHeight = this.canvasSize.width / videoAspect
        drawY = (this.canvasSize.height - drawHeight) / 2
      } else {
        // Video is taller than canvas
        drawWidth = this.canvasSize.height * videoAspect
        drawX = (this.canvasSize.width - drawWidth) / 2
      }

      // Draw video frame to canvas
      this.ctx.drawImage(
        this.video,
        drawX, drawY,
        drawWidth, drawHeight
      )
    } catch (error) {
      console.error('Error rendering video frame:', error)
      this.renderFallback()
    }
  }

  /**
   * Render fallback background when video is not available
   */
  private renderFallback(): void {
    this.ctx.fillStyle = '#2a2a2a'
    this.ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height)
    
    this.ctx.fillStyle = '#666'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      'Loading weapon preview...',
      this.canvasSize.width / 2,
      this.canvasSize.height / 2
    )
  }

  /**
   * Update wear value and seek to new position
   */
  async updateWear(wearValue: number): Promise<void> {
    await this.seekToWear(wearValue)
    this.renderFrame()
  }

  /**
   * Update canvas size
   */
  updateCanvasSize(newSize: Size): void {
    this.canvasSize = newSize
    this.renderFrame()
  }

  /**
   * Update wear range (min/max values)
   */
  updateWearRange(minWear: number, maxWear: number): void {
    this.minWear = minWear
    this.maxWear = maxWear
    this.seekToWear(this.currentWear)
  }

  /**
   * Set render callback for when video frame changes
   */
  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback
  }

  /**
   * Get video metadata
   */
  getMetadata(): VideoMetadata {
    return {
      duration: this.videoDuration,
      width: this.video.videoWidth || 0,
      height: this.video.videoHeight || 0,
      isReady: this.isVideoReady
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.video.removeEventListener('loadedmetadata', () => {})
    this.video.removeEventListener('loadeddata', () => {})
    this.video.removeEventListener('seeked', () => {})
    this.video.removeEventListener('error', () => {})
    this.video.src = ''
    this.video.load()
  }
}

/**
 * Generate video URL for weapon skin
 */
export function generateVideoUrl(weaponName: string, skinName: string): string {
  const cleanWeaponName = weaponName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const cleanSkinName = skinName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  return `/img/weapons/flat/${cleanWeaponName}-${cleanSkinName}.webm`
}

/**
 * Check if video file exists
 */
export async function checkVideoExists(videoUrl: string): Promise<boolean> {
  try {
    const response = await fetch(videoUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}
