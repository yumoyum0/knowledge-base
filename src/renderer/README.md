# Renderer

Browser-side UI. Communicates exclusively through `kbAPI` (current) / `window.knowledgeBase` (target).

**Current**: vanilla JS + HTML + CSS:
- `renderer.js` — document list, Q&A, edit mode, CRUD wiring
- `index.html` — app shell (sidebar + main panel)
- `styles.css` — all visual styling

**Target**: React 18 + Vite + TypeScript — App.tsx, DocumentList, DocumentDetail, ImportPanel, QuestionPanel, StatusBar.

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) and [docs/PRODUCT.md](../docs/PRODUCT.md) for UI specs.
