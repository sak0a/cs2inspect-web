# Sticker Slots: How to Add/Calibrate per Weapon

This guide explains how to add default sticker slot positions (slot 0–4) for new weapons (AK-47, USP-S, MP9, …) and how to calibrate the optional “External normalized” offset display to match other sites.

The Visual Customizer uses:
- Default slot positions as normalized coordinates (0–1) inside the drawn weapon image/video area
- Offsets that you edit in the UI either as pixels or as “External normalized” values

The code that holds the slot positions and normalization helpers: `utils/canvasCoordinates.ts`.

---

## 1) Collect pixel positions for the weapon’s slots

You need the pixel (x, y) of each slot as it appears inside the drawn weapon image area (not the full canvas). The drawn image area changes with layout but your normalized values will remain correct.

Tips:
- Open the Visual Customizer and enable the “Show Coordinate Grid” debug overlay.
- Hover over the intended slot center and note the pixel coordinates in the overlay.
- Repeat for all slots you want to define.

If you already have measured pixel coordinates (e.g., from Photoshop), make sure they are relative to the image area actually drawn in the canvas.

---

## 2) Convert pixel positions to normalized (0–1)

Let:
- `W_img` = drawn image width (background draw rect width)
- `H_img` = drawn image height (background draw rect height)

Then for each slot pixel position `(x_px, y_px)`:

```
x_norm = x_px / W_img
y_norm = y_px / H_img
```

Example (AWP; you provided positions that correspond to a 1328×384 image area):
- Slot 0: (1145, 220) -> (x=1145/1328 ≈ 0.862, y=220/384 ≈ 0.573)
- Slot 1: (610, 165)  -> (0.459, 0.430)
- Slot 2: (825, 200)  -> (0.621, 0.521)
- Slot 3: (740, 100)  -> (0.557, 0.260)
- Slot 4: (915, 185)  -> (0.689, 0.482)

---

## 3) Add the normalized slot positions to the code

Edit `utils/canvasCoordinates.ts`: add an entry for your weapon name in `WEAPON_STICKER_SLOT_POSITIONS`.

Weapon name format: lower-case, spaces to dashes, non-alphanumeric removed (e.g., `AK-47` → `ak-47`, `USP-S` → `usp-s`).

Example for AWP (already added):

```
'awp': {
  0: { x: 0.862, y: 0.573 },
  1: { x: 0.459, y: 0.430 },
  2: { x: 0.621, y: 0.521 },
  3: { x: 0.557, y: 0.260 },
  4: { x: 0.689, y: 0.482 }
}
```

Add similar blocks for other weapons using your computed normalized values.

---

## 4) (Optional) Set per-weapon External Normalization refs

The Settings panel can show/edit offsets either as:
- Pixels (inside the drawn image area), or
- External normalized values (to match other websites’ readouts)

To make our “External normalized” view match another site, configure per-weapon denominators: `extXRef` and `extYRef`.

Where they live: in `utils/canvasCoordinates.ts`:
- `EXTERNAL_NORMALIZATION_REFS` holds the per-weapon default denominators
- `getExternalNormalizationRefs(weaponName)` returns `{ x, y }` for a weapon

How it’s used (conceptually):
```
ext_x ~= (dx_canvas / W_img) * (REF_WIDTH / extXRef)
ext_y ~= (dy_canvas / H_img) * (REF_HEIGHT / extYRef)
```
- `dx_canvas`, `dy_canvas` are pixel offsets within the drawn image
- `REF_WIDTH`, `REF_HEIGHT` are the weapon’s internal reference pixels (e.g., AWP uses 1328×384 internally)
- `extXRef`, `extYRef` are the denominators tuned to match the other site

### Calibrating extXRef/extYRef
1) Move a sticker by a known number of pixels in our UI; note `dx_px`, `dy_px`.
2) Put the sticker in the same spot on the other site and note their displayed normalized offsets `x_ext`, `y_ext`.
3) Adjust denominators until our readout matches. You can start with an estimate:
   - If our current readout is `y_ext_ours` but theirs is `y_ext_target`, then:
     `new_extYRef ≈ current_extYRef * (y_ext_ours / y_ext_target)` (increase to reduce our value)

Add your calibrated numbers to `EXTERNAL_NORMALIZATION_REFS` for the weapon.

Example (AWP defaults we set from your samples):
```
awp: { x: 1363, y: 1725 }
```
- X matched well out of the box (e.g., -569 px → ~-0.4178)
- Y needed a larger denominator to reduce our normalized value to be closer to theirs

You can further refine these by tweaking in the UI (Normalized mode) and then copying the numbers into the mapping.

---

## 5) Offsets: how they are stored and applied

- Default slot positions are always used first
- Offsets are added on top of defaults
- In data we persist `offset_x`/`offset_y` (in weapon reference pixels), with `x=y=0` so default slot + offsets are used
- Internally we convert between pixels, normalized-in-image, and external normalized for display/editing only

---

## 6) Checklist to add a new weapon

- [ ] Get slot pixel positions inside the drawn image area
- [ ] Convert to normalized by dividing by the image width/height
- [ ] Add normalized slots under the cleaned weapon name in `WEAPON_STICKER_SLOT_POSITIONS`
- [ ] (Optional) Calibrate `EXTERNAL_NORMALIZATION_REFS[weapon] = { x, y }` to match other site’s normalized offsets
- [ ] Test in the Visual Customizer:
  - Select weapon, add stickers, check default placement
  - Toggle Pixels vs Normalized (ext) and verify expected values
  - Drag and use arrow keys to confirm step consistency

---

## Notes
- If Y normalized looks consistently too large vs. the other site, increase `extYRef` for that weapon.
- Weapon images/videos are aspect-fit in the canvas; we always compute within the actual drawn image rectangle to keep positions correct at any viewport size.
- Weapon name cleaning is important to hit the per-weapon maps (lowercase, dashes, alnum-only).

