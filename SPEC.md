# 儿童创意画板 (Creative Drawing Board) - SPEC.md

## 1. Project Overview

**Project Name**: Creative Drawing Board  
**Type**: Educational Creative Game for Toddlers  
**Target Users**: Children aged 3-6 years  
**Core Functionality**: A colorful, toddler-friendly drawing app with finger/mouse painting, bubble popping mini-game, and engaging sound effects  
**Technology**: Pure HTML5 Canvas (single file, no dependencies)  
**Platform**: Web browser (PC & tablet)

---

## 2. Visual & Rendering Specification

### Scene Setup
- **Canvas**: Full-viewport responsive canvas, adapts to window resize
- **Background**: Soft pastel gradient (warm cream #FFF8E7 to light pink #FFE4EC)
- **Layout**: Toolbar at bottom, canvas fills remaining space

### Art Style
- **Theme**: Playful, rounded, child-safe aesthetic
- **Color Palette** (high saturation, Macaron tones):
  - Red: #FF6B6B
  - Orange: #FFA94D
  - Yellow: #FFE066
  - Green: #69DB7C
  - Blue: #74C0FC
  - Purple: #B197FC
  - Pink: #F783AC
  - Brown: #E5997F
  - Black: #495057
  - White: #FFFFFF
- **UI Elements**: Large rounded buttons (min 60px), thick 3px borders, drop shadows

### Typography
- **Font**: "Comic Neue", cursive, system fallback
- **Button Labels**: 18-24px, bold, white or dark depending on background

### Visual Effects
- **Button Hover**: Scale 1.1 + glow effect
- **Drawing**: Smooth anti-aliased lines
- **Bubble Pop**: Burst particle animation (small circles flying outward)
- **Clear Canvas**: Gentle fade-out transition

---

## 3. Interaction Specification

### Drawing Tools
| Tool | Description |
|------|-------------|
| Brush | Default drawing tool, smooth stroke |
| Eraser | Removes drawn content (white stroke with soft edge) |
| Clear | Resets entire canvas with fade animation |

### Color Picker
- 10 large circular color buttons in a row
- Currently selected color has a thick white ring + scale effect
- Default color: Black (#495057)

### Brush Size
- 3 preset sizes: Small (4px), Medium (12px), Large (24px)
- Visual indicator showing current size as a dot

### Bubble Mini-Game
- Activated by "Bubbles" button (top-right corner)
- Clicking/tapping anywhere spawns colorful floating bubbles
- Bubbles rise slowly with slight horizontal wobble
- Bubbles pop on click with satisfying particle burst
- Sound effect on pop
- Continuous mode: new bubbles spawn automatically every 0.5s

### Audio Feedback
- Button click: Soft "pop" sound
- Bubble pop: "P-POP!" sound
- Clear canvas: Whoosh sound
- Drawing: No sound (to avoid noise)
- All sounds: Short, cheerful, toddler-appropriate (Web Audio API synthesized tones)

---

## 4. Technical Specification

### File Structure
```
creative-drawing-board/
├── index.html          # Single file containing all HTML/CSS/JS
├── SPEC.md             # This specification
└── README.md           # Project documentation
```

### Canvas Implementation
- Use HTML5 `<canvas>` with 2D context
- Handle mouse events (mousedown, mousemove, mouseup) for drawing
- Handle touch events (touchstart, touchmove, touchend) for tablet
- RequestAnimationFrame for smooth rendering
- Store drawing state in ImageData for undo capability (optional)

### Audio Implementation
- Web Audio API with AudioContext
- Synthesized sounds using OscillatorNode (no external audio files)
- Short attack-decay envelopes for pleasant tones

### Responsive Design
- Canvas resizes on window resize
- UI scales appropriately for different screen sizes
- Minimum supported width: 320px

---

## 5. UI Layout

```
┌─────────────────────────────────────────────┐
│  [🎨 Creative Drawing Board]      [🫧 Bubbles] │  <- Header
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│              DRAWING CANVAS                 │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  [🔴][🟠][🟡][🟢][🔵][🟣][🟤][⚫][⚪]       │  <- Colors
├─────────────────────────────────────────────┤
│  Size: [●] [●●] [●●●]    [🖌️ Brush] [◻️ Erase] [🗑️ Clear] │  <- Tools
└─────────────────────────────────────────────┘
```

---

## 6. Acceptance Criteria

- [ ] Page loads without errors in modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] Drawing works smoothly with mouse on PC
- [ ] Drawing works with touch on tablet
- [ ] All 10 colors are selectable and apply to brush
- [ ] 3 brush sizes work correctly
- [ ] Eraser removes drawn content
- [ ] Clear button resets canvas
- [ ] Bubble mode spawns and pops bubbles correctly
- [ ] All sound effects play without distortion
- [ ] UI is responsive on different screen sizes
- [ ] No external network requests (fully offline capable)
- [ ] Console has no Error-level messages

---

## 7. Performance Targets

- Initial load: < 1 second
- Drawing latency: < 16ms (60fps)
- Memory usage: < 50MB
- Works on devices with 1GB RAM
