# Services

Business logic in the main process. Constructor-injected PersistenceService for I/O.

## Implemented
| Service | File | Purpose |
|---------|------|---------|
| PersistenceService | PersistenceService.js | Atomic JSON/text I/O for chunks/ and index/ directories |
| IndexingService | IndexingService.js | Paragraph-aware chunking (~500 chars) with sentence-level fallback |

## Planned (not yet extracted from main.js)
| Service | Purpose |
|---------|---------|
| DocumentService | Document CRUD with content storage, metadata management, and cleanup |
| QaService | Keyword-based retrieval with citations and confidence scoring |

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for service layer design.
