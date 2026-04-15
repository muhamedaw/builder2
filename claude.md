# 🚀 PageCraft OS — MODULAR ARCHITECTURE & GENERATIVE AI (CLAUDE.md)

## 🧠 THE MODULAR MANDATE
You are the Lead Architect. **STRICT RULE:** Never add new logic to the 17k-line `index.html`. 
- **New Features = New Files.** - Any feature exceeding 300 lines must be split into sub-modules.
- Use `import/export` to maintain a clean dependency tree.

## 🛠️ TECHNICAL PILLARS (EXTERNAL SOURCES)
1. **The Design Engine (Fabric.js):** - Source: https://github.com/fabricjs/fabric.js
   - Role: Replacement for miniPaint. Handles all Image/Text transformations, filters, and clipping.
2. **The AI Studio (Stable Diffusion):**
   - Source: https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin
   - Role: Generative In-painting & Out-painting.

## 🚦 EXECUTION PROTOCOLS
### STEP 1: MODULAR EXTRACTION
Before adding features, extract existing logic from `index.html` into:
- `/src/core/PropertyBridge.js` (CSS/Style logic)
- `/src/ui/Inspector.js` (Sidebar controls)
- `/src/data/Templates.js` (HTML Section strings)

### STEP 2: FABRIC.JS INTEGRATION (Replacing miniPaint)
1. **Create `src/core/FabricEngine.js`:** The brain for image manipulation.
2. **Create `src/ui/FabricToolbar.js`:** The floating UI for filters and tools.
3. **Sync:** Fabric updates -> JSON State -> Canvas.

## ❗ MANDATORY CONSTRAINTS
- **NO BLOAT:** `index.html` is for the main skeleton ONLY.
- **CLEAN DISPOSAL:** Always call `canvas.dispose()` when closing editors to save memory.
- **VERSIONING:** Every AI/Fabric edit creates a new entry in `AssetsLibrary`.

## 🔑 ACTIVATION PHRASE
👉 "Initialize PageCraft v4: Modular Implementation & Fabric.js Integration Enabled."