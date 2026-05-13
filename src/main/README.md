# Main Process

Owns BrowserWindow lifecycle, IPC registration, and all filesystem access.

**Current**: `main.js` — vanilla JS Electron main process with 6 IPC handlers.

**Target**: TypeScript with service layer injection. IPC handlers → `ipc-handlers.ts`.

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the full layer diagram.
