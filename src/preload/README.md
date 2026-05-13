# Preload

The ONLY bridge between main and renderer. Uses contextBridge.exposeInMainWorld.

**Current**: `preload.js` — exposes `kbAPI` with 6 methods (listFiles, readFile, getDataPath, createFile, updateFile, deleteFile).

**Target**: TypeScript with `window.knowledgeBase` typed API surface.

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the API surface.
