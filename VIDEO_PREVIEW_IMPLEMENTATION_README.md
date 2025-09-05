# 🎬 CS2 Inspect Web - Video Weapon Preview System

## Overview

This branch implements a revolutionary video-based weapon preview system for CS2 Inspect Web, allowing users to see accurate weapon skin wear progression through animated .webm video files. The system provides real-time wear-based frame selection, enhanced visual customization, and professional-grade sticker/keychain positioning.

## 🚀 Key Features

### 1. **Animated Weapon Skin Previews**
- **Video Integration**: Support for .webm video files showing complete wear progression
- **Real-time Frame Selection**: Maps wear values (0.0-1.0) to video timestamps for accurate representation
- **Automatic Fallback**: Gracefully falls back to static images when videos aren't available
- **Performance Optimized**: Efficient video seeking and canvas rendering

### 2. **Enhanced Visual Customizer**
- **Dual Rendering System**: Video mode for animated previews, static mode for fallback
- **Large Canvas Interface**: Minimum 800×600px canvas with full container utilization
- **Zoom Functionality**: 50%-300% zoom with mouse wheel and button controls
- **Professional UI**: Clean, intuitive interface with real-time feedback

### 3. **Smart Sticker Slot System**
- **Default Slot Positions**: Predefined positions for all 5 weapon sticker slots
- **Intelligent Positioning**: Automatic fallback when coordinates are invalid
- **Visual Slot Indicators**: Shows empty slot positions to guide users
- **Enhanced Manipulation**: Larger, more visible stickers (80px vs 40px)

### 4. **Improved User Experience**
- **Compact Sidebar**: Streamlined wear control using existing WearSlider component
- **Better Coordinate System**: Consistent canvas sizing for reliable positioning
- **Enhanced Selection**: Clear visual feedback with corner handles and dashed borders
- **Responsive Design**: Adapts to different screen sizes and window resizing

## 📁 File Structure

### New Files Added
```
components/
├── VisualCustomizerModal.vue          # Main visual customizer component
types/
├── canvas.ts                          # Canvas-related type definitions
utils/
├── canvasCoordinates.ts              # Coordinate transformation utilities
├── videoCanvas.ts                    # Video canvas management system
public/img/weapons/flat/
├── awp-printstream.webm              # Example video file
├── ak-47-x-ray.webm                  # Example video file
```

### Modified Files
```
components/
├── WeaponSkinModal.vue               # Updated to integrate visual customizer
locales/
├── en.json                           # Added visual customizer translations
types/
├── index.ts                          # Extended with canvas types
```

## 🎯 Technical Implementation

### Video Canvas System
```typescript
// Video-to-wear mapping
const timestamp = (wearValue - minWear) / (maxWear - minWear) * videoDuration
video.currentTime = timestamp

// Canvas rendering
ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight)
```

### Default Sticker Slot Positions
```typescript
export const DEFAULT_STICKER_SLOT_POSITIONS = {
  0: { x: 0.25, y: 0.4 },  // Front/grip area
  1: { x: 0.45, y: 0.3 },  // Middle/body area
  2: { x: 0.65, y: 0.35 }, // Rear/stock area
  3: { x: 0.35, y: 0.6 },  // Lower area
  4: { x: 0.55, y: 0.65 }  // Lower rear area
}
```

### Canvas Size Management
```typescript
// Consistent sizing for reliable coordinates
const canvasWidth = Math.max(800, availableWidth)
const canvasHeight = Math.max(600, availableHeight)
```

## 🎨 User Interface Improvements

### Visual Customizer Modal
- **98vw × 95vh**: Maximum screen utilization
- **Zoom Controls**: +/- buttons and mouse wheel support
- **Status Display**: Real-time canvas dimensions and zoom level
- **Mode Indicators**: Clear feedback for video vs static mode

### Sticker Management
- **Slot Indicators**: Dashed circles showing empty slot positions
- **Enhanced Selection**: Corner handles and improved visual feedback
- **Better Hit Detection**: Larger interaction areas for easier manipulation
- **Smart Positioning**: Automatic placement in logical weapon areas

### Sidebar Optimization
- **Compact Wear Control**: Reduced from large NCard to streamlined component
- **WearSlider Integration**: Consistent UI using existing components
- **Removed Redundancy**: Eliminated duplicate status information

## 🔧 Configuration

### Video File Requirements
- **Format**: .webm (optimized for web)
- **Duration**: 140 seconds (recommended)
- **Content**: Complete wear progression from Factory New to Battle-Scarred
- **Naming**: `{weapon-name}-{skin-name}.webm` (lowercase, hyphenated)

### File Placement
```
public/img/weapons/flat/
├── awp-printstream.webm
├── ak-47-redline.webm
├── m4a4-asiimov.webm
└── ...
```

## 🚀 Usage

### Opening Visual Customizer
1. Navigate to weapon customization modal
2. Select a weapon skin
3. Click "Visual Customizer" button
4. Enhanced interface opens with video support (if available)

### Video Mode Features
- **Wear Adjustment**: Use slider to see real-time wear progression
- **Sticker Placement**: Drag stickers to desired positions
- **Zoom Control**: Use mouse wheel or buttons for precise positioning
- **Save Changes**: Apply customizations back to weapon

### Fallback Behavior
- **No Video**: Automatically uses static image
- **Loading Errors**: Graceful fallback to image mode
- **Performance**: Optimized for smooth operation

## 📊 Performance Considerations

### Video Management
- **Preloading**: Videos loaded once and cached
- **Efficient Seeking**: Optimized timestamp calculation
- **Memory Cleanup**: Proper resource management
- **Error Handling**: Robust fallback mechanisms

### Canvas Optimization
- **Consistent Sizing**: Fixed dimensions for reliable coordinates
- **Efficient Rendering**: Optimized draw calls
- **Responsive Updates**: Real-time feedback without lag
- **Resource Management**: Proper cleanup on component unmount

## 🔮 Future Enhancements

### Planned Features
- **More Video Files**: Expand video library for popular skins
- **Advanced Effects**: Lighting and environmental effects
- **Batch Processing**: Tools for video file generation
- **Performance Metrics**: Monitoring and optimization tools

### Extensibility
- **Weapon-Specific Slots**: Custom slot positions per weapon type
- **Animation Controls**: Play/pause, speed adjustment
- **Quality Settings**: Video quality options for performance
- **Export Features**: Save customized previews as images/videos

## 🐛 Known Issues & Limitations

### Current Limitations
- **Video Library**: Limited to example files (AWP Printstream, AK-47 X-Ray)
- **File Size**: Large video files may impact loading times
- **Browser Support**: Requires modern browser with video support
- **Mobile Performance**: May need optimization for mobile devices

### Workarounds
- **Fallback System**: Automatic static image fallback
- **Progressive Loading**: Videos load in background
- **Error Recovery**: Robust error handling and user feedback
- **Performance Monitoring**: Built-in performance considerations

## 📝 Development Notes

### Testing
- Test with both video and non-video weapons
- Verify fallback behavior works correctly
- Check performance with multiple simultaneous users
- Validate coordinate system accuracy

### Deployment
- Ensure video files are properly deployed
- Verify MIME types are configured correctly
- Test across different browsers and devices
- Monitor performance metrics

## 🔍 Technical Deep Dive

### VideoCanvasManager Class
```typescript
class VideoCanvasManager {
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  async updateWear(wearValue: number): Promise<void>
  async loadVideo(url: string): Promise<void>
  updateCanvasSize(size: CanvasSize): void
  destroy(): void
}
```

### Coordinate Transformation System
```typescript
// Normalized coordinates (0-1) to canvas pixels
export const coordinateTransform = {
  normalizedToCanvas: (point: Point, canvasSize: CanvasSize) => ({
    x: point.x * canvasSize.width,
    y: point.y * canvasSize.height
  }),
  canvasToNormalized: (point: Point, canvasSize: CanvasSize) => ({
    x: point.x / canvasSize.width,
    y: point.y / canvasSize.height
  })
}
```

### Wear-to-Timestamp Mapping
```typescript
// Maps weapon wear to video timestamp
const calculateTimestamp = (wearValue: number, minWear: number, maxWear: number, videoDuration: number) => {
  const normalizedWear = (wearValue - minWear) / (maxWear - minWear)
  return Math.max(0, Math.min(videoDuration, normalizedWear * videoDuration))
}
```

## 🎮 User Interaction Flow

### 1. Modal Opening
```
User clicks "Visual Customizer"
→ Check for video file existence
→ Initialize appropriate rendering mode
→ Load existing stickers/keychains
→ Apply default positions if needed
→ Render initial canvas state
```

### 2. Wear Adjustment
```
User moves wear slider
→ Calculate new timestamp
→ Seek video to timestamp
→ Update canvas rendering
→ Emit wear change to parent
→ Update weapon data
```

### 3. Sticker Manipulation
```
User clicks sticker
→ Select element
→ Show selection indicators
→ Enable drag mode
→ Update position in real-time
→ Convert to normalized coordinates
→ Save to element data
```

## 📋 Implementation Checklist

### ✅ Completed Features
- [x] Video canvas rendering system
- [x] Wear-based frame selection
- [x] Default sticker slot positioning
- [x] Enhanced visual customizer UI
- [x] Zoom functionality
- [x] Coordinate system improvements
- [x] Sidebar optimization
- [x] Error handling and fallbacks
- [x] Responsive design
- [x] Performance optimization

### 🔄 In Progress
- [ ] Expanded video library
- [ ] Mobile optimization
- [ ] Performance monitoring
- [ ] User testing feedback integration

### 📅 Future Roadmap
- [ ] Weapon-specific slot customization
- [ ] Advanced animation controls
- [ ] Export functionality
- [ ] Batch video processing tools
- [ ] Quality settings
- [ ] Analytics integration

## 🧪 Testing Guidelines

### Manual Testing Scenarios
1. **Video Mode Testing**
   - Open AWP Printstream (has video)
   - Adjust wear slider and verify frame changes
   - Test zoom functionality
   - Verify sticker placement and manipulation

2. **Fallback Testing**
   - Open weapon without video file
   - Verify static image rendering
   - Confirm all features work in static mode
   - Test error recovery

3. **Coordinate System Testing**
   - Place stickers in all 5 slots
   - Verify positions are logical and accessible
   - Test drag and drop functionality
   - Confirm coordinates persist correctly

4. **Performance Testing**
   - Test with multiple stickers
   - Verify smooth video seeking
   - Check memory usage over time
   - Test on different devices/browsers

### Automated Testing
```typescript
// Example test cases
describe('VideoCanvasManager', () => {
  it('should calculate correct timestamps for wear values')
  it('should handle video loading errors gracefully')
  it('should update canvas size correctly')
  it('should clean up resources on destroy')
})

describe('Coordinate System', () => {
  it('should convert normalized coordinates to canvas pixels')
  it('should handle edge cases and invalid coordinates')
  it('should provide correct default slot positions')
})
```

## 🔧 Configuration Options

### Environment Variables
```env
# Video settings
VIDEO_QUALITY=high
VIDEO_PRELOAD=true
VIDEO_FALLBACK_TIMEOUT=5000

# Canvas settings
CANVAS_MIN_WIDTH=800
CANVAS_MIN_HEIGHT=600
CANVAS_MAX_ZOOM=3.0
CANVAS_MIN_ZOOM=0.5
```

### Component Props
```typescript
interface VisualCustomizerProps {
  visible: boolean
  weaponSkin: WeaponSkin
  stickers: (any | null)[]
  keychain: any | null
  weaponWear: number
  minWear: number
  maxWear: number
}
```

---

**Branch**: `feature/video-weapon-previews`
**Status**: Ready for testing and review
**Next Steps**: Expand video library, performance optimization, user testing
**Documentation**: Complete implementation guide with technical specifications
