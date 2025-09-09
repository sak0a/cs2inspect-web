# Visual Customizer Sticker Positioning - README

## 🎯 **What You Wanted**

- **Slot 0**: x:1145 y:220
- **Slot 1**: x:610 y:165
- **Slot 2**: x:825 y:200
- **Slot 3**: x:740 y:100
- **Slot 4**: x:915 y:185 

### **Default Slot Positions for AWP:**
- **Slot 0**: x:1145 y:220 (normalized: 0.862, 0.275)
- **Slot 1**: x:610 y:165 (normalized: 0.459, 0.206)  
- **Slot 2**: x:825 y:200 (normalized: 0.621, 0.25)
- **Slot 3**: x:740 y:100 (normalized: 0.557, 0.125)
- **Slot 4**: x:915 y:185 (normalized: 0.689, 0.231)

### **Expected Behavior:**
1. **ALWAYS** place stickers at their default slot positions first
2. **THEN** apply `offset_x`/`offset_y` on top of that position
3. Stickers without offsets should appear at exact slot coordinates
4. Canvas size: 1328px width × 800px height

---

## ❌ **Current Problems**

### **Issue 1: All Stickers in Top-Left Corner**
- Stickers with `offset_x: 0, offset_y: 0` appear at (0,0) instead of slot positions
- Database likely has `x: 0, y: 0` for unpositioned stickers
- Logic is incorrectly using these as valid coordinates

### **Issue 2: Coordinate System Confusion**
- Multiple coordinate formats: `x`/`y`, `offset_x`/`offset_y`
- Unclear which takes priority
- Normalization (0-1) vs pixel coordinates mixing

### **Issue 3: Default Position Logic**
- Default slot positions not being applied correctly
- Conditions for when to use defaults are wrong

---

## 🔧 **Technical Info**

### **Current File Structure:**
- **Main Logic**: `utils/canvasCoordinates.ts` → `stickerToCanvasElement()`
- **Slot Positions**: `WEAPON_STICKER_SLOT_POSITIONS['awp']`
- **Component**: `components/VisualCustomizerModal.vue` → `convertExistingCustomizations()`

### **Coordinate Systems:**
- **Canvas**: 1328px × 800px
- **Normalized**: 0.0 - 1.0 (for storage)
- **Database**: Mixed formats (`x`/`y` and `offset_x`/`offset_y`)

### **Current Logic Flow:**
```javascript
1. Start with default slot position
2. Apply offset_x/offset_y if they exist  
3. Override with x/y if they're not (0,0)
```

---

## 🎯 **What Needs to be Fixed**

### **Priority 1: Ignore Database x/y for Default Positioning**
- Stickers should ALWAYS start at slot positions
- Only use `offset_x`/`offset_y` for movement from slot
- Ignore `x: 0, y: 0` completely

### **Priority 2: Proper Offset Scaling**
- Current offset scaling: `* 0.001` (probably wrong)
- Need to determine correct scaling factor
- Test with known offset values

### **Priority 3: Debug Tools**
- ✅ Coordinate overlay implemented
- ✅ Mouse position tracking working
- Use these to verify positioning

---

## 🛠️ **Debug Tools Available**

### **Coordinate Overlay:**
- Toggle in Settings → Debug Tools
- Shows grid lines every 100px
- Real-time mouse position display
- Use to verify sticker positions

### **Console Logging:**
- Shows which coordinate source is used
- Logs default positions vs offsets
- Check browser console for positioning info

---

## 📝 **Next Steps**

1. **Test Current Positions**: Use coordinate overlay to see where stickers actually appear
2. **Verify Slot Coordinates**: Confirm the 5 slot positions are correct for AWP
3. **Fix Offset Logic**: Determine proper scaling for `offset_x`/`offset_y`
4. **Test Other Weapons**: Extend to other weapon types once AWP works

---

## 🎮 **Example Sticker Data**
```json
{
  "slot": 0,
  "sticker_id": 7889,
  "wear": 0,
  "offset_x": 0,
  "offset_y": 0
}
```
**Expected Result**: Should appear at x:1145 y:220 (Slot 0 position)

**Current Result**: Appears at x:0 y:0 (top-left corner) ❌

---

## 🔍 **Debugging Steps**

### **Step 1: Enable Coordinate Overlay**
1. Open Visual Customizer
2. Go to Settings → Debug Tools
3. Check "Show Coordinate Grid (X/Y positions)"
4. Hover over canvas to see exact coordinates

### **Step 2: Check Console Logs**
- Open browser developer tools
- Look for messages starting with 🎯, 📍
- Verify which coordinate source is being used

### **Step 3: Test Slot Positions**
- Load AWP with stickers
- Use coordinate overlay to verify positions
- Compare actual vs expected coordinates

---

## 🚨 **Known Issues**

1. **Stickers appear at (0,0)** instead of slot positions
2. **Offset scaling** may be incorrect
3. **Legacy x/y coordinates** interfering with slot positioning
4. **Weapon detection** may not be working properly

---

## 💡 **Potential Solutions**

### **Option 1: Ignore Legacy Coordinates**
```javascript
// Always use slot position + offset, ignore x/y completely
const defaultPos = getDefaultStickerPosition(slotIndex, weaponName)
let x = defaultPos.x + (offset_x * SCALE_FACTOR)
let y = defaultPos.y + (offset_y * SCALE_FACTOR)
```

### **Option 2: Better Condition Checking**
```javascript
// Only use x/y if they represent actual manual positioning
if (sticker.x > 0.01 || sticker.y > 0.01) {
  // Use manual coordinates
} else {
  // Use slot + offset
}
```

### **Option 3: Separate Coordinate Systems**
- Use slot positions for initial placement
- Use offsets for fine-tuning
- Completely separate from legacy x/y system
