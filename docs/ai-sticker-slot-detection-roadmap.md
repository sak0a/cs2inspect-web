# 🎯 AI-Powered Sticker Slot Detection System - Strategic Implementation Plan

## 🎨 Vision & Concept

### Core Idea
Create an AI-powered system that automatically detects precise sticker slot positions on weapon images using high-contrast template images and computer vision techniques. This will replace manual coordinate mapping with intelligent, accurate slot detection.

### Strategic Approach
1. **Template Creation**: Generate high-contrast weapon images with clearly marked sticker slots
2. **AI Detection**: Use computer vision to identify slot positions in template images
3. **Coordinate Mapping**: Map detected positions to actual weapon images
4. **Dynamic Integration**: Integrate with existing visual customizer system
5. **Validation & Refinement**: Test accuracy and refine detection algorithms

## 📋 Implementation Phases

### Phase 1: Research & Template Creation (Week 1-2)
**Status**: 🔄 Planning

#### 1.1 Reference Data Collection
- [ ] Capture screenshots from cs2inspects.com sticker customizer
- [ ] Document weapon image dimensions and sticker placement examples
- [ ] Analyze existing sticker coordinate patterns
- [ ] Create reference dataset for popular weapons (AK-47, AWP, M4A4, etc.)

#### 1.2 Template Image Generation
- [ ] Create high-contrast weapon silhouettes (black/white or colored)
- [ ] Mark sticker slots with distinct colors/shapes
- [ ] Ensure consistent slot marking system across all weapons
- [ ] Generate templates for different weapon orientations/views

#### 1.3 Coordinate System Analysis
- [ ] Study relationship between template coordinates and actual weapon images
- [ ] Document scaling factors and transformation matrices
- [ ] Analyze how sticker size relates to weapon image dimensions
- [ ] Create coordinate conversion algorithms

### Phase 2: AI Detection System Development (Week 3-4)
**Status**: 🔄 Planning

#### 2.1 Computer Vision Setup
- [ ] Choose appropriate CV library (OpenCV, TensorFlow.js, or Python backend)
- [ ] Implement template matching algorithms
- [ ] Create slot detection functions using contour detection
- [ ] Develop color-based slot identification system

#### 2.2 Detection Algorithm Implementation
- [ ] Implement high-contrast slot detection
- [ ] Create position extraction algorithms
- [ ] Develop confidence scoring for detected slots
- [ ] Add error handling for failed detections

#### 2.3 Coordinate Transformation System
- [ ] Build template-to-actual image coordinate mapping
- [ ] Implement scaling and rotation transformations
- [ ] Create validation system for detected coordinates
- [ ] Develop fallback mechanisms for detection failures

### Phase 3: Integration & Testing (Week 5-6)
**Status**: 🔄 Planning

#### 3.1 Backend Integration
- [ ] Create API endpoints for slot detection
- [ ] Implement caching system for detected coordinates
- [ ] Add database storage for validated slot positions
- [ ] Create batch processing for multiple weapons

#### 3.2 Frontend Integration
- [ ] Modify VisualCustomizerModal to use AI-detected slots
- [ ] Update coordinate transformation utilities
- [ ] Implement dynamic slot loading system
- [ ] Add visual feedback for detection confidence

#### 3.3 Validation & Quality Assurance
- [ ] Test detection accuracy across different weapons
- [ ] Validate coordinate precision with manual measurements
- [ ] Implement automated testing for slot detection
- [ ] Create quality metrics and monitoring

### Phase 4: Production Deployment (Week 7-8)
**Status**: 🔄 Planning

#### 4.1 Performance Optimization
- [ ] Optimize detection algorithms for speed
- [ ] Implement client-side caching
- [ ] Add progressive loading for slot data
- [ ] Monitor and optimize API response times

#### 4.2 Scalability & Maintenance
- [ ] Create automated template generation pipeline
- [ ] Implement version control for slot coordinates
- [ ] Add monitoring and alerting for detection failures
- [ ] Create documentation for adding new weapons

## 🔧 Technical Architecture

### Data Flow Architecture
```
High-Contrast Template → AI Detection → Coordinate Extraction → 
Transformation Matrix → Actual Weapon Coordinates → 
Visual Customizer Integration → User Interface
```

### Technology Stack Recommendations

#### Option A: Client-Side Processing (Recommended)
- **Library**: TensorFlow.js or OpenCV.js
- **Advantages**: No server load, instant processing, offline capability
- **Challenges**: Browser performance limitations, larger bundle size

#### Option B: Server-Side Processing
- **Library**: Python OpenCV + FastAPI
- **Advantages**: More powerful processing, smaller client bundle
- **Challenges**: Server load, network latency, additional infrastructure

#### Option C: Hybrid Approach
- **Strategy**: Pre-process templates server-side, cache results client-side
- **Advantages**: Best of both worlds, optimal performance
- **Implementation**: Background processing with cached coordinate delivery

### File Structure Plan
```
ai-slot-detection/
├── templates/
│   ├── weapon-templates/
│   │   ├── ak-47-template.png
│   │   ├── awp-template.png
│   │   └── m4a4-template.png
│   └── slot-markers/
│       ├── slot-definitions.json
│       └── marker-styles.json
├── detection/
│   ├── cv-detection.ts
│   ├── coordinate-mapper.ts
│   └── validation.ts
├── api/
│   ├── slot-detection.ts
│   └── coordinate-cache.ts
└── integration/
    ├── visual-customizer-ai.ts
    └── slot-loader.ts
```

## 📊 Data Structures & Formats

### Template Definition Format
```json
{
  "weaponId": "ak-47",
  "templateImage": "ak-47-template.png",
  "imageDimensions": { "width": 1024, "height": 512 },
  "slots": [
    {
      "slotId": 0,
      "markerColor": "#FF0000",
      "detectedPosition": { "x": 256, "y": 128 },
      "confidence": 0.95,
      "boundingBox": { "x": 250, "y": 122, "width": 12, "height": 12 }
    }
  ],
  "transformationMatrix": {
    "scale": { "x": 1.0, "y": 1.0 },
    "offset": { "x": 0, "y": 0 },
    "rotation": 0
  }
}
```

### Coordinate Mapping Format
```json
{
  "weaponId": "ak-47",
  "skinId": "redline",
  "imageSize": { "width": 800, "height": 600 },
  "slots": [
    {
      "slotIndex": 0,
      "normalizedPosition": { "x": 0.25, "y": 0.4 },
      "pixelPosition": { "x": 200, "y": 240 },
      "confidence": 0.95,
      "validationStatus": "verified"
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z",
  "version": "1.0"
}
```

## 🎯 Success Metrics & Validation

### Accuracy Targets
- **Slot Detection Accuracy**: >95% for primary weapons
- **Coordinate Precision**: <5px deviation from manual measurements
- **Processing Speed**: <100ms for slot detection per weapon
- **User Satisfaction**: >90% approval in user testing

### Validation Methods
1. **Manual Verification**: Compare AI-detected positions with expert manual placement
2. **Cross-Reference Validation**: Compare with cs2inspects.com coordinates
3. **User Testing**: A/B test AI vs manual positioning with real users
4. **Automated Testing**: Regression tests for coordinate consistency

## 🚨 Risk Assessment & Mitigation

### Technical Risks
1. **Detection Accuracy**: AI may fail on complex weapon designs
   - *Mitigation*: Fallback to manual coordinates, confidence thresholds
2. **Performance Impact**: CV processing may slow down interface
   - *Mitigation*: Caching, background processing, progressive loading
3. **Template Maintenance**: New weapons require template creation
   - *Mitigation*: Automated template generation pipeline

### Implementation Risks
1. **Complexity Overhead**: System may become too complex
   - *Mitigation*: Phased implementation, maintain manual fallback
2. **Resource Requirements**: AI processing requires significant development time
   - *Mitigation*: Start with limited weapon set, expand gradually

## 🔄 Iterative Improvement Plan

### Version 1.0: Proof of Concept
- Support for 5 popular weapons (AK-47, AWP, M4A4, Glock, USP-S)
- Basic template matching with manual template creation
- Simple coordinate mapping with fallback to current system

### Version 2.0: Enhanced Detection
- Support for 20+ weapons
- Improved detection algorithms with machine learning
- Automated template generation tools
- Advanced coordinate validation

### Version 3.0: Full Production
- Complete weapon library support
- Real-time detection optimization
- Advanced AI models for complex scenarios
- Integration with weapon skin variations

## 📚 Research & Reference Materials

### Technical References
- OpenCV Template Matching Documentation
- TensorFlow.js Object Detection Tutorials
- Computer Vision Coordinate Transformation Algorithms
- CS2 Weapon Coordinate Systems Analysis

### Competitive Analysis
- cs2inspects.com sticker placement system
- Steam Workshop sticker positioning tools
- Third-party CS2 customization applications
- Community-developed coordinate mapping tools

## 🛠️ Detailed Implementation Specifications

### Template Creation Guidelines

#### High-Contrast Template Requirements
```
Template Specifications:
- Format: PNG with transparency support
- Resolution: Match source weapon images (typically 1024x512 or 800x600)
- Background: Pure black (#000000) or transparent
- Weapon Silhouette: Pure white (#FFFFFF)
- Slot Markers: Distinct colors per slot
  - Slot 0: Red (#FF0000)
  - Slot 1: Green (#00FF00)
  - Slot 2: Blue (#0000FF)
  - Slot 3: Yellow (#FFFF00)
  - Slot 4: Magenta (#FF00FF)
- Marker Size: 12x12 pixels minimum for reliable detection
- Marker Shape: Solid circles or squares for consistent detection
```

#### Template Naming Convention
```
Format: {weapon-class}-{weapon-name}-template.png
Examples:
- rifle-ak47-template.png
- sniper-awp-template.png
- pistol-glock18-template.png
- smg-mp7-template.png
```

### Computer Vision Detection Algorithms

#### Template Matching Approach
```typescript
interface SlotDetectionConfig {
  templatePath: string
  slotColors: string[]
  confidenceThreshold: number
  maxSlots: number
  detectionMethod: 'color-based' | 'contour-based' | 'template-matching'
}

interface DetectedSlot {
  slotIndex: number
  position: { x: number, y: number }
  confidence: number
  boundingBox: { x: number, y: number, width: number, height: number }
  markerColor: string
}
```

#### Color-Based Detection Algorithm
```python
# Python OpenCV implementation example
def detect_slot_positions(template_image_path):
    image = cv2.imread(template_image_path)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    slot_colors = {
        0: ([0, 255, 255], [10, 255, 255]),    # Red
        1: ([50, 255, 255], [70, 255, 255]),   # Green
        2: ([100, 255, 255], [120, 255, 255]), # Blue
        3: ([20, 255, 255], [30, 255, 255]),   # Yellow
        4: ([140, 255, 255], [160, 255, 255])  # Magenta
    }

    detected_slots = []
    for slot_id, (lower, upper) in slot_colors.items():
        mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            M = cv2.moments(largest_contour)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                detected_slots.append({
                    'slot_id': slot_id,
                    'position': {'x': cx, 'y': cy},
                    'confidence': calculate_confidence(largest_contour)
                })

    return detected_slots
```

### Coordinate Transformation Mathematics

#### Template-to-Actual Mapping
```typescript
interface TransformationMatrix {
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
  rotation: number
}

function transformCoordinates(
  templatePos: Point,
  templateSize: Size,
  actualSize: Size,
  transform: TransformationMatrix
): Point {
  // Normalize template coordinates (0-1)
  const normalizedX = templatePos.x / templateSize.width
  const normalizedY = templatePos.y / templateSize.height

  // Apply transformation
  const transformedX = (normalizedX * transform.scaleX) + transform.offsetX
  const transformedY = (normalizedY * transform.scaleY) + transform.offsetY

  // Convert to actual image coordinates
  return {
    x: transformedX * actualSize.width,
    y: transformedY * actualSize.height
  }
}
```

#### Validation & Confidence Scoring
```typescript
function calculateSlotConfidence(detectedSlot: DetectedSlot): number {
  const factors = {
    colorMatch: 0.3,      // How well the color matches expected
    shapeMatch: 0.3,      // How circular/square the detected area is
    sizeMatch: 0.2,       // How close to expected marker size
    positionLogic: 0.2    // How logical the position is relative to other slots
  }

  let confidence = 0
  confidence += factors.colorMatch * calculateColorMatchScore(detectedSlot)
  confidence += factors.shapeMatch * calculateShapeMatchScore(detectedSlot)
  confidence += factors.sizeMatch * calculateSizeMatchScore(detectedSlot)
  confidence += factors.positionLogic * calculatePositionLogicScore(detectedSlot)

  return Math.min(1.0, Math.max(0.0, confidence))
}
```

### API Integration Specifications

#### Slot Detection Endpoint
```typescript
// API Route: /api/ai/detect-slots
interface SlotDetectionRequest {
  weaponId: string
  skinId?: string
  templateVersion?: string
  forceRedetection?: boolean
}

interface SlotDetectionResponse {
  success: boolean
  weaponId: string
  slots: DetectedSlot[]
  confidence: number
  processingTime: number
  cacheHit: boolean
  fallbackUsed: boolean
  error?: string
}
```

#### Caching Strategy
```typescript
interface SlotCache {
  weaponId: string
  slots: DetectedSlot[]
  confidence: number
  timestamp: number
  version: string
  validationStatus: 'pending' | 'verified' | 'rejected'
}

// Cache TTL: 7 days for verified slots, 1 day for pending
// Cache invalidation: When template version changes
```

### Integration with Existing Visual Customizer

#### Modified VisualCustomizerModal Integration
```typescript
// Enhanced slot loading with AI detection
const loadSlotPositions = async (weaponId: string) => {
  try {
    // Try AI detection first
    const aiSlots = await detectSlotsWithAI(weaponId)
    if (aiSlots.confidence > 0.8) {
      return aiSlots.slots
    }

    // Fallback to manual coordinates
    console.warn(`AI detection confidence low (${aiSlots.confidence}), using fallback`)
    return getDefaultSlotPositions(weaponId)
  } catch (error) {
    console.error('AI slot detection failed:', error)
    return getDefaultSlotPositions(weaponId)
  }
}
```

#### Progressive Enhancement Strategy
```typescript
// Phase 1: AI as enhancement, manual as primary
const slotPositions = await loadSlotPositions(weaponId) || getDefaultSlotPositions(weaponId)

// Phase 2: AI as primary, manual as fallback
const slotPositions = await loadSlotPositions(weaponId) ?? getDefaultSlotPositions(weaponId)

// Phase 3: AI only, with error handling
const slotPositions = await loadSlotPositions(weaponId)
if (!slotPositions) throw new Error('Slot detection failed')
```

## 🧪 Testing & Validation Framework

### Automated Testing Suite
```typescript
describe('AI Slot Detection', () => {
  test('should detect all 5 slots for AK-47', async () => {
    const result = await detectSlots('ak-47')
    expect(result.slots).toHaveLength(5)
    expect(result.confidence).toBeGreaterThan(0.9)
  })

  test('should handle missing template gracefully', async () => {
    const result = await detectSlots('non-existent-weapon')
    expect(result.fallbackUsed).toBe(true)
    expect(result.slots).toBeDefined()
  })

  test('should maintain coordinate consistency', async () => {
    const result1 = await detectSlots('awp')
    const result2 = await detectSlots('awp')
    expect(result1.slots).toEqual(result2.slots)
  })
})
```

### Manual Validation Process
1. **Expert Review**: CS2 experts validate AI-detected positions
2. **User Testing**: A/B test AI vs manual positioning
3. **Accuracy Measurement**: Compare with known good coordinates
4. **Edge Case Testing**: Test with unusual weapon skins and orientations

## 📈 Performance Monitoring & Optimization

### Key Performance Indicators
```typescript
interface PerformanceMetrics {
  detectionTime: number        // Time to detect slots (target: <100ms)
  accuracy: number            // Percentage of correctly detected slots
  cacheHitRate: number        // Percentage of cached results used
  fallbackRate: number        // Percentage of fallback usage
  userSatisfaction: number    // User rating of slot accuracy
}
```

### Optimization Strategies
1. **Template Optimization**: Reduce template file sizes while maintaining quality
2. **Algorithm Optimization**: Use faster detection algorithms for real-time processing
3. **Caching Strategy**: Aggressive caching of detection results
4. **Progressive Loading**: Load slot data in background while showing UI

## 🎯 AI Agent Implementation Prompt

### Context & Project Understanding
You are working on CS2 Inspect Web, a weapon skin customization platform. The project currently has a video-based weapon preview system with manual sticker slot positioning. Your task is to implement an AI-powered sticker slot detection system that automatically identifies precise sticker positions on weapon images.

### Current System Architecture
- **Frontend**: Vue.js/Nuxt.js with TypeScript
- **Visual Customizer**: `components/VisualCustomizerModal.vue` with canvas-based rendering
- **Coordinate System**: `utils/canvasCoordinates.ts` with normalized coordinates (0-1)
- **Current Slot Positions**: Manual default positions in `DEFAULT_STICKER_SLOT_POSITIONS`
- **Video System**: `utils/videoCanvas.ts` for animated weapon previews

### Your Mission
Implement Phase 1 of the AI Sticker Slot Detection System as outlined in this roadmap:

1. **Create Template System**: Build high-contrast weapon templates with color-coded slot markers
2. **Implement Detection**: Use computer vision to detect slot positions from templates
3. **Coordinate Mapping**: Transform template coordinates to actual weapon image coordinates
4. **Integration**: Seamlessly integrate with existing visual customizer system
5. **Fallback Strategy**: Maintain current manual system as backup

### Technical Requirements
- **Detection Library**: Choose between TensorFlow.js (client-side) or Python OpenCV (server-side)
- **Template Format**: PNG images with specific color markers for each slot (Red=#FF0000, Green=#00FF00, etc.)
- **API Design**: RESTful endpoints for slot detection with caching
- **Performance**: <100ms detection time, >95% accuracy target
- **Fallback**: Graceful degradation to current manual coordinates

### File Structure to Create
```
ai-slot-detection/
├── templates/weapon-templates/     # High-contrast weapon templates
├── detection/cv-detection.ts       # Core detection algorithms
├── api/slot-detection.ts          # API endpoints
└── integration/slot-loader.ts     # Integration with visual customizer
```

### Success Criteria
- [ ] Successfully detect 5 sticker slots on AK-47 and AWP templates
- [ ] Achieve >90% coordinate accuracy compared to manual positioning
- [ ] Integrate seamlessly with existing `VisualCustomizerModal.vue`
- [ ] Implement robust fallback to current system
- [ ] Create comprehensive testing suite

### Constraints & Guidelines
- **Maintain Compatibility**: Don't break existing functionality
- **Progressive Enhancement**: AI as enhancement, not replacement initially
- **Error Handling**: Robust error handling with meaningful fallbacks
- **Performance**: Optimize for real-time user experience
- **Documentation**: Update this roadmap with implementation progress

### Phase 1 Deliverables
1. **Template Creation Tool**: Script to generate high-contrast weapon templates
2. **Detection Algorithm**: Core CV algorithm for slot position detection
3. **API Integration**: Backend endpoints for slot detection with caching
4. **Frontend Integration**: Modified visual customizer to use AI-detected slots
5. **Testing Suite**: Automated tests for detection accuracy and performance

### Implementation Priority
Start with the most popular weapons (AK-47, AWP, M4A4) and expand gradually. Focus on accuracy over speed initially, then optimize for performance.

---

**Status**: 📋 Ready for AI Agent Implementation
**Phase**: 1 - Research & Template Creation
**Timeline**: 2-3 weeks for Phase 1 completion
**Next Update**: Progress tracking in this document
