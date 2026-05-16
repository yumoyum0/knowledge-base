/*
 * test.js 鈥?Baseline verification suite (no framework, assert()-based)
 *
 * Test Map (13 blocks, 170+ assertions):
 * 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? * 鈹?Block    鈹?What it covers              鈹?Assertions 鈹?How                           鈹? * 鈹溾攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹尖攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹尖攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹尖攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? * 鈹?Test 1   鈹?data/ directory exists      鈹?         1 鈹?fs.existsSync + isDirectory  鈹? * 鈹?Test 2   鈹?File listing logic          鈹?         3 鈹?Mirrors main.js IPC logic    鈹? * 鈹?Test 3   鈹?File reading                鈹?         3 鈹?readFileSync on welcome.md   鈹? * 鈹?Test 4   鈹?HTML structure              鈹?         7 鈹?String search on index.html  鈹? * 鈹?Test 5   鈹?Renderer functions          鈹?         5 鈹?String search on renderer.js 鈹? * 鈹?Test 5b  鈹?Q&A submission flow         鈹?         7 鈹?Wire checks + thread safety  鈹? * 鈹?Test 5c  鈹?Document management (CRUD)  鈹?        12 鈹?Function presence + API calls鈹? * 鈹?Test 6   鈹?Preload API surface         鈹?        14 鈹?String search on preload.js  鈹? * 鈹?Test 7   鈹?Main process IPC handlers   鈹?        16 鈹?String search on main.js     鈹? * 鈹?Test 8   鈹?searchDocument logic        鈹?         8 鈹?Inline reimplementation      鈹? * 鈹?Test 9   鈹?CRUD functional             鈹?         7 鈹?Real fs ops + path-traversal 鈹? * 鈹?Test 10  鈹?Document import (kb-005)    鈹?        12 鈹?IPC, preload, renderer, HTML 鈹? * 鈹?Test 11  鈹?Text indexing (kb-006)      鈹?        20 鈹?Chunking logic + IPC + UI    鈹? * 鈹?Test 12  鈹?Grounded Q&A (kb-007)       鈹?        26 鈹?QaService + IPC + UI         鈹? * 鈹?Test 13  鈹?Architectural rule check    鈹?         7 鈹?check-arch.mjs + renderer    鈹? * 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹粹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹粹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹粹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log('  PASS: ' + label);
    passed++;
  } else {
    console.error('  FAIL: ' + label);
    failed++;
  }
}

// --- Test 1: data/ directory exists ---
console.log('\n--- Test 1: data/ directory ---');
const dataDir = path.join(__dirname, 'data');
assert(fs.existsSync(dataDir) && fs.statSync(dataDir).isDirectory(), 'data/ directory exists');

// --- Test 2: file listing (mirrors main.js IPC logic) ---
console.log('\n--- Test 2: file listing ---');
const entries = fs.readdirSync(dataDir, { withFileTypes: true });
const files = entries
  .filter(e => e.isFile() && (e.name.endsWith('.txt') || e.name.endsWith('.md')))
  .map(e => ({ name: e.name, path: path.join(dataDir, e.name) }));

assert(files.length >= 1, 'at least one document found in data/');
const welcomeFile = files.find(f => f.name === 'welcome.md');
assert(!!welcomeFile, 'welcome.md found in listing');
assert(welcomeFile && welcomeFile.path === path.join(dataDir, 'welcome.md'), 'file path is correct absolute path');

// --- Test 3: file reading (mirrors main.js IPC logic) ---
console.log('\n--- Test 3: file reading ---');
if (welcomeFile) {
  const content = fs.readFileSync(welcomeFile.path, 'utf-8');
  assert(typeof content === 'string', 'readFileSync returns a string');
  assert(content.length > 0, 'file content is non-empty');
  assert(content.includes('Welcome to Knowledge Base'), 'content contains expected heading');
}

// --- Test 4: HTML structure ---
console.log('\n--- Test 4: HTML structure ---');
const html = fs.readFileSync(path.join(__dirname, 'src', 'renderer', 'index.html'), 'utf-8');
assert(html.includes('id="doc-list"'), 'HTML has doc-list element');
assert(html.includes('id="qa-thread"'), 'HTML has qa-thread element');
assert(html.includes('id="qa-form"'), 'HTML has qa-form element');
assert(html.includes('id="sidebar"'), 'HTML has sidebar element');
assert(html.includes('id="main-panel"'), 'HTML has main-panel element');
assert(html.includes('id="new-doc-btn"'), 'HTML has new-doc-btn element');
assert(html.includes('id="status-bar"'), 'HTML has status-bar element');

// --- Test 5: renderer.js has required functions ---
console.log('\n--- Test 5: renderer.js functions ---');
const renderer = fs.readFileSync(path.join(__dirname, 'src', 'renderer', 'renderer.js'), 'utf-8');
assert(renderer.includes('function loadDocumentList'), 'renderer.js defines loadDocumentList');
assert(renderer.includes('function selectDocument'), 'renderer.js defines selectDocument');
assert(renderer.includes('function escapeHtml'), 'renderer.js defines escapeHtml');
assert(renderer.includes('window.kbAPI.listFiles'), 'renderer.js calls kbAPI.listFiles');
assert(renderer.includes('window.kbAPI.readFile'), 'renderer.js calls kbAPI.readFile');

// --- Test 5b: kb-003 renderer.js Q&A functions ---
console.log('\n--- Test 5b: renderer.js Q&A submission ---');
assert(renderer.includes("qaForm.addEventListener('submit'"), 'renderer.js wires submit handler to qaForm');
assert(renderer.includes('function searchDocument'), 'renderer.js defines searchDocument');
assert(renderer.includes('qa-message qa-user'), 'renderer.js creates user message element');
assert(renderer.includes('qa-message qa-response'), 'renderer.js creates response message element');
assert(renderer.includes('qaThread.scrollTop = qaThread.scrollHeight'), 'renderer.js scrolls to bottom after each message');
assert(renderer.includes("qaInput.value = ''"), 'renderer.js clears input after submission');
const submitHandlerCode = renderer.slice(
  renderer.indexOf("qaForm.addEventListener('submit'"),
  renderer.indexOf('// --- Utility ---')
);
assert(!submitHandlerCode.includes('qaThread.innerHTML'), 'submit handler does not clear qaThread (thread persists)');

// --- Test 5c: kb-004 renderer.js document management ---
console.log('\n--- Test 5c: renderer.js document management ---');
assert(renderer.includes('function createNewDocument'), 'renderer.js defines createNewDocument');
assert(renderer.includes('function deleteDocument'), 'renderer.js defines deleteDocument');
assert(renderer.includes('function enterEditMode'), 'renderer.js defines enterEditMode');
assert(renderer.includes('function saveEdit'), 'renderer.js defines saveEdit');
assert(renderer.includes('function cancelEdit'), 'renderer.js defines cancelEdit');
assert(renderer.includes('function renderDocumentView'), 'renderer.js defines renderDocumentView');
assert(renderer.includes("newDocBtn.addEventListener('click'"), 'renderer.js wires new-doc-btn click inside init()');
const initFnStart = renderer.indexOf('async function init()');
const initFnEnd = renderer.indexOf('\n}\n\ninit();', initFnStart);
const initFnBody = renderer.slice(initFnStart, initFnEnd > 0 ? initFnEnd : renderer.length);
assert(initFnBody.includes("newDocBtn.addEventListener('click'"), 'newDocBtn listener is inside init() function body');
assert(renderer.includes('editMode'), 'renderer.js uses editMode flag');
assert(renderer.includes('|| editMode'), 'Q&A submit handler guarded by editMode');
assert(renderer.includes('window.kbAPI.createFile'), 'renderer.js calls kbAPI.createFile');
assert(renderer.includes('window.kbAPI.updateFile'), 'renderer.js calls kbAPI.updateFile');
assert(renderer.includes('window.kbAPI.deleteFile'), 'renderer.js calls kbAPI.deleteFile');

// --- Test 6: preload.js exposes correct API ---
console.log('\n--- Test 6: preload API surface ---');
const preload = fs.readFileSync(path.join(__dirname, 'src', 'preload', 'preload.js'), 'utf-8');
assert(preload.includes("'data:list-files'"), 'preload exposes data:list-files');
assert(preload.includes("'data:read-file'"), 'preload exposes data:read-file');
assert(preload.includes('listFiles'), 'preload exposes listFiles method');
assert(preload.includes('readFile'), 'preload exposes readFile method');
assert(preload.includes("'data:create-file'"), 'preload exposes data:create-file');
assert(preload.includes("'data:update-file'"), 'preload exposes data:update-file');
assert(preload.includes("'data:delete-file'"), 'preload exposes data:delete-file');
assert(preload.includes('createFile'), 'preload exposes createFile method');
assert(preload.includes('updateFile'), 'preload exposes updateFile method');
assert(preload.includes('deleteFile'), 'preload exposes deleteFile method');
assert(preload.includes("'indexing:start-single'"), 'preload exposes indexing:start-single');
assert(preload.includes("'indexing:start-all'"), 'preload exposes indexing:start-all');
assert(preload.includes("'indexing:get-status'"), 'preload exposes indexing:get-status');
assert(preload.includes("'indexing:get-chunks'"), 'preload exposes indexing:get-chunks');

// --- Test 7: main.js IPC handlers ---
console.log('\n--- Test 7: main.js IPC handlers ---');
const mainJs = fs.readFileSync(path.join(__dirname, 'src', 'main', 'main.js'), 'utf-8');
assert(mainJs.includes("ipcMain.handle('data:list-files'"), 'main.js registers data:list-files handler');
assert(mainJs.includes("ipcMain.handle('data:read-file'"), 'main.js registers data:read-file handler');
assert(mainJs.includes('dataDir'), 'main.js defines dataDir path');
assert(mainJs.includes("endsWith('.txt')"), 'main.js filters .txt files');
assert(mainJs.includes("endsWith('.md')"), 'main.js filters .md files');
assert(mainJs.includes("ipcMain.handle('data:create-file'"), 'main.js registers data:create-file handler');
assert(mainJs.includes("ipcMain.handle('data:update-file'"), 'main.js registers data:update-file handler');
assert(mainJs.includes("ipcMain.handle('data:delete-file'"), 'main.js registers data:delete-file handler');
assert(mainJs.includes('path.basename'), 'main.js uses path.basename for safe filenames');
assert(mainJs.includes('startsWith(dataDir)'), 'main.js validates file paths stay within dataDir');
assert(mainJs.includes('fs.writeFileSync'), 'main.js writes files for create/update');
assert(mainJs.includes('fs.unlinkSync'), 'main.js deletes files with unlinkSync');
assert(mainJs.includes("ipcMain.handle('indexing:start-single'"), 'main.js registers indexing:start-single handler');
assert(mainJs.includes("ipcMain.handle('indexing:start-all'"), 'main.js registers indexing:start-all handler');
assert(mainJs.includes("ipcMain.handle('indexing:get-status'"), 'main.js registers indexing:get-status handler');
assert(mainJs.includes("ipcMain.handle('indexing:get-chunks'"), 'main.js registers indexing:get-chunks handler');

// --- Test 8: searchDocument logic (kb-003 core behavior) ---
console.log('\n--- Test 8: searchDocument behavior ---');
function searchDocumentLogic(question, content) {
  const questionWords = question.toLowerCase().match(/\b\w+\b/g) || [];
  const lines = content.split('\n');
  const matchingLines = [];
  lines.forEach((line, idx) => {
    const lowerLine = line.toLowerCase();
    for (const word of questionWords) {
      if (word.length > 2 && lowerLine.includes(word)) {
        matchingLines.push({ index: idx, text: line.trim() });
        break;
      }
    }
  });
  return { matchingLines, questionWords };
}

const sampleContent = '## Welcome to Knowledge Base\n\nThis is your knowledge base.\nAdd .txt and .md files.\n\n- The sidebar lists all your documents.\n- Click a document to view its content.\n- Use the Q&A panel to ask questions.';

let result;

result = searchDocumentLogic('knowledge base', sampleContent);
assert(result.matchingLines.length > 0, 'searchDocument finds lines with "knowledge"');
assert(result.questionWords.includes('knowledge'), 'question word "knowledge" extracted');
assert(result.questionWords.includes('base'), 'question word "base" extracted');

result = searchDocumentLogic('sidebar documents', sampleContent);
assert(result.matchingLines.length > 0, 'searchDocument finds lines with "sidebar" or "documents"');

result = searchDocumentLogic('xyzzy nothing', sampleContent);
assert(result.matchingLines.length === 0, 'searchDocument returns empty for no matches');

result = searchDocumentLogic('is a to', sampleContent);
const shortWords = result.questionWords.filter(w => w.length <= 2);
assert(shortWords.length === 3, 'short words extracted from question');
assert(result.matchingLines.length === 0, 'short words produce no matches');

const manyMatchContent = 'apple banana\ncherry date\nelderberry fig\ngrape honeydew\nkiwi lemon';
result = searchDocumentLogic('apple cherry elderberry grape kiwi', manyMatchContent);
assert(result.matchingLines.length >= 4, 'searchDocument finds multiple matching lines');

// --- Test 9: kb-004 functional CRUD (mirrors main.js IPC logic) ---
console.log('\n--- Test 9: CRUD operations ---');
const testFileName = '__test_kb004.md';
const testFilePath = path.join(dataDir, testFileName);

if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
assert(!fs.existsSync(testFilePath), 'test file does not exist before create');

fs.writeFileSync(testFilePath, '# Test Content\n\nHello, world!', 'utf-8');
assert(fs.existsSync(testFilePath), 'file created on disk');

const createdContent = fs.readFileSync(testFilePath, 'utf-8');
assert(createdContent.includes('Hello, world!'), 'created file contains expected content');

fs.writeFileSync(testFilePath, '# Updated Content\n\nGoodbye!', 'utf-8');
const updatedContent = fs.readFileSync(testFilePath, 'utf-8');
assert(updatedContent.includes('Goodbye!'), 'updated file contains new content');
assert(!updatedContent.includes('Hello, world!'), 'updated file no longer contains old content');

fs.unlinkSync(testFilePath);
assert(!fs.existsSync(testFilePath), 'file deleted from disk');

const outsidePath = path.join(__dirname, '..', 'outside.md');
assert(!path.resolve(outsidePath).startsWith(dataDir), 'path outside dataDir is correctly detected');

// --- Test 10: kb-005 document import ---
console.log('\n--- Test 10: document import (kb-005) ---');
assert(mainJs.includes("ipcMain.handle('data:import-file'"), 'main.js registers data:import-file handler');
assert(mainJs.includes('dialog.showOpenDialog'), 'main.js uses dialog.showOpenDialog for file picker');
assert(mainJs.includes('MAX_FILE_SIZE'), 'main.js enforces max file size limit');
assert(mainJs.includes('documents-meta.json'), 'main.js writes document metadata');
assert(mainJs.includes('loadMeta'), 'main.js defines loadMeta helper');
assert(mainJs.includes('saveMeta'), 'main.js defines saveMeta helper');
assert(preload.includes('importFile'), 'preload exposes importFile method');
assert(renderer.includes('function importDocument'), 'renderer.js defines importDocument');
assert(renderer.includes("importBtn.addEventListener('click', importDocument)"), 'renderer.js wires import-btn click');
assert(html.includes('id="import-btn"'), 'HTML has import-btn element');
assert(mainJs.includes('importDate'), 'main.js list-files includes importDate from metadata');
assert(mainJs.includes('meta[e.name]'), 'main.js list-files checks metadata per file');

// --- Test 11: kb-006 text indexing ---
console.log('\n--- Test 11: text indexing (kb-006) ---');

// 11a: Service files exist
const svcDir = path.join(__dirname, 'src', 'services');
assert(fs.existsSync(path.join(svcDir, 'IndexingService.js')), 'IndexingService.js exists');
assert(fs.existsSync(path.join(svcDir, 'PersistenceService.js')), 'PersistenceService.js exists');

// 11b: PersistenceService manages chunk and index dirs
const PersistenceService = require(path.join(svcDir, 'PersistenceService'));
const testDataDir = path.join(__dirname, 'data');
const ps = new PersistenceService(testDataDir);
assert(fs.existsSync(path.join(testDataDir, 'chunks')), 'chunks/ directory created');
assert(fs.existsSync(path.join(testDataDir, 'index')), 'index/ directory created');

// 11c: Index metadata read/write (non-destructive: save and restore original state)
const originalMeta = ps.readIndexMeta();
assert(typeof originalMeta.globalStatus === 'string', 'index meta has globalStatus field');
assert(typeof originalMeta.documents === 'object', 'index meta has documents field');

const testMeta = { globalStatus: 'testing', lastIndexed: new Date().toISOString(), documents: { 'test.md': { status: 'indexed', chunkCount: 1 } } };
ps.writeIndexMeta(testMeta);
const readBack = ps.readIndexMeta();
assert(readBack.globalStatus === 'testing', 'index meta write/read round-trips');
assert(readBack.documents['test.md'].chunkCount === 1, 'index meta preserves nested document data');

// Restore original state
ps.writeIndexMeta(originalMeta);

// 11d: IndexingService chunking
const IndexingService = require(path.join(svcDir, 'IndexingService'));
const idxSvc = new IndexingService(ps);

// Test chunking 鈥?single short paragraph
const shortText = 'This is a short paragraph.';
const shortChunks = idxSvc._chunkText(shortText, 'test.md');
assert(shortChunks.length === 1, 'short text produces 1 chunk');
assert(shortChunks[0].charCount === shortText.length, 'chunk charCount matches input length');
assert(shortChunks[0].wordCount === 5, 'chunk wordCount is correct');
assert(shortChunks[0].id === 'test.md#0', 'chunk id uses docName#index pattern');
assert(shortChunks[0].docName === 'test.md', 'chunk has docName field');
assert(shortChunks[0].index === 0, 'chunk has index field');

// Test chunking 鈥?multi-paragraph splitting at boundaries
const multiParaText = 'Paragraph one with some content.\n\nParagraph two with more content.\n\nParagraph three here.';
const paraChunks = idxSvc._chunkText(multiParaText, 'multi.md');
assert(paraChunks.length === 1, 'short paragraphs combine into one chunk under 500 chars');

// Test chunking 鈥?long text that must split at paragraph boundaries
let longText = '';
for (let i = 0; i < 20; i++) {
  longText += 'Paragraph ' + i + ' with content that goes on for a while to fill up space in the chunk.\n\n';
}
const longChunks = idxSvc._chunkText(longText, 'long.md');
assert(longChunks.length >= 2, 'long text splits into multiple chunks at paragraph boundaries');

// Verify chunk metadata present across all chunks
for (const chunk of longChunks) {
  assert(typeof chunk.charCount === 'number' && chunk.charCount > 0, 'chunk has positive charCount');
  assert(typeof chunk.wordCount === 'number' && chunk.wordCount > 0, 'chunk has positive wordCount');
  assert(chunk.charCount <= 600, 'chunk size is reasonable (under ~600 chars, target ~500)');
}

// Test chunking 鈥?very long single paragraph forced to split at sentences
let longSinglePara = '';
for (let i = 0; i < 30; i++) {
  longSinglePara += 'This is sentence number ' + i + ' which has enough words to build up size. ';
}
const sentenceChunks = idxSvc._chunkText(longSinglePara, 'sentence.md');
assert(sentenceChunks.length >= 2, 'long single paragraph splits into multiple chunks');

// 11e: Full indexDocument flow
idxSvc.indexDocument('test.md', shortText);
const storedChunks = idxSvc.getChunks('test.md');
assert(storedChunks !== null && storedChunks.length === 1, 'indexed chunks are persisted and retrievable');

const status = idxSvc.getStatus();
assert(status.documents['test.md'] !== undefined, 'index meta records indexed document');
assert(status.documents['test.md'].status === 'indexed', 'document status is indexed');
assert(status.documents['test.md'].chunkCount === 1, 'index meta records chunk count');

// Cleanup: remove test index data
idxSvc.removeDocument('test.md');
const statusAfter = idxSvc.getStatus();
assert(statusAfter.documents['test.md'] === undefined, 'removeDocument clears index entry');
const chunksAfter = idxSvc.getChunks('test.md');
assert(chunksAfter === null || chunksAfter.length === 0, 'removeDocument deletes chunk file');

// 11f: Renderer has indexing functions
assert(renderer.includes('function indexSingleDocument'), 'renderer.js defines indexSingleDocument');
assert(renderer.includes('function indexAllDocuments'), 'renderer.js defines indexAllDocuments');
assert(renderer.includes('function loadChunksForDocument'), 'renderer.js defines loadChunksForDocument');
assert(renderer.includes('function updateStatusBar'), 'renderer.js defines updateStatusBar');

// 11g: Renderer calls indexing API
assert(renderer.includes('window.kbAPI.indexSingle'), 'renderer.js calls kbAPI.indexSingle');
assert(renderer.includes('window.kbAPI.indexAll'), 'renderer.js calls kbAPI.indexAll');
assert(renderer.includes('window.kbAPI.getIndexStatus'), 'renderer.js calls kbAPI.getIndexStatus');
assert(renderer.includes('window.kbAPI.getChunks'), 'renderer.js calls kbAPI.getChunks');

// 11h: HTML has indexing UI elements
assert(html.includes('id="index-all-btn"'), 'HTML has index-all-btn element');
assert(html.includes('id="status-index-state"'), 'HTML has status-index-state element');
assert(html.includes('id="status-doc-count"'), 'HTML has status-doc-count element');

// 11i: Main.js initializes services
assert(mainJs.includes("require('../services/PersistenceService')"), 'main.js requires PersistenceService');
assert(mainJs.includes("require('../services/IndexingService')"), 'main.js requires IndexingService');
assert(mainJs.includes('indexingService.removeDocument'), 'main.js removes index data on delete');


// --- Test 12: grounded Q&A with citations (kb-007) ---
console.log('\n--- Test 12: grounded Q&A with citations (kb-007) ---');

// 12a: QaService exists and can be required
let QaService;
try {
  QaService = require('./src/services/QaService');
  assert(true, 'QaService.js can be required');
} catch {
  assert(false, 'QaService.js can be required');
}

if (QaService) {
  const PersistenceService = require('./src/services/PersistenceService');
  const IndexingService = require('./src/services/IndexingService');
  const ps = new PersistenceService(dataDir);
  const is = new IndexingService(ps);

  // Index a test document
  is.indexDocument('qa-test', 'The sky is blue. The ocean is deep. Knowledge bases organize information.');
  const qa = new QaService(ps, is);

  // 12b: ask() returns { answer, citations, confidence } shape
  const r = qa.ask('sky');
  assert(typeof r.answer === 'string', 'ask() returns answer string');
  assert(Array.isArray(r.citations), 'ask() returns citations array');
  assert(typeof r.confidence === 'number', 'ask() returns confidence number');

  // 12c: Citation includes docName, chunkIndex, excerpt
  if (r.citations.length > 0) {
    const c = r.citations[0];
    assert(typeof c.docName === 'string', 'citation has docName field');
    assert(typeof c.chunkIndex === 'number', 'citation has chunkIndex field');
    assert(typeof c.excerpt === 'string', 'citation has excerpt field');
  }

  // 12d: Confidence is 0.85 with citations, 0.30 without
  const rMatch = qa.ask('knowledge');
  assert(rMatch.confidence === 0.85, 'confidence is 0.85 when citations found');
  const rNoMatch = qa.ask('zzzxyz123');
  assert(rNoMatch.confidence === 0.30, 'confidence is 0.30 when no citations found');

  // 12e: getHistory() returns entries with correct shape
  const history = qa.getHistory();
  assert(Array.isArray(history), 'getHistory() returns an array');
  if (history.length > 0) {
    const h = history[0];
    assert(typeof h.question === 'string', 'history entry has question');
    assert(typeof h.answer === 'string', 'history entry has answer');
    assert(Array.isArray(h.citations), 'history entry has citations array');
    assert(typeof h.confidence === 'number', 'history entry has confidence');
    assert(typeof h.timestamp === 'string', 'history entry has timestamp');
  }

  // 12f: History persists across reconstruction
  const qa2 = new QaService(ps, is);
  const history2 = qa2.getHistory();
  assert(history2.length === history.length, 'history survives reconstruction');

  // Cleanup test index data
  is.removeDocument('qa-test');

  // Delete qa-history.json created by tests
  const historyPath = require('path').join(dataDir, 'qa-history.json');
  try { if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath); } catch { /* ignore */ }
}

// 12g: main.js requires QaService
assert(mainJs.includes('require("../services/QaService")'), 'main.js requires QaService');

// 12h: main.js registers qa:ask handler
assert(mainJs.includes('ipcMain.handle("qa:ask"'), 'main.js registers qa:ask handler');

// 12i: main.js registers qa:get-history handler
assert(mainJs.includes('ipcMain.handle("qa:get-history"'), 'main.js registers qa:get-history handler');

// 12j: preload exposes ask method
assert(preload.includes("'qa:ask'"), 'preload exposes qa:ask channel');
assert(preload.includes('ask:'), 'preload exposes ask method');

// 12k: preload exposes getHistory method
assert(preload.includes("'qa:get-history'"), 'preload exposes qa:get-history channel');
assert(preload.includes('getHistory:'), 'preload exposes getHistory method');

// 12l: renderer calls kbAPI.ask
assert(renderer.includes('window.kbAPI.ask'), 'renderer calls kbAPI.ask');

// 12m: renderer creates citation DOM elements
assert(renderer.includes('qa-citation'), 'renderer creates citation DOM elements');

// 12n: renderer creates confidence score element
assert(renderer.includes('qa-confidence'), 'renderer creates confidence score element');


// --- Test 13: kb-008 cross-session persistence ---
console.log('\n--- Test 13: cross-session persistence (kb-008) ---');

// 13a: PersistenceService has content I/O methods
const PersistenceService2 = require(path.join(__dirname, 'src', 'services', 'PersistenceService'));
const testDataDir2 = path.join(__dirname, 'data');
const ps2 = new PersistenceService2(testDataDir2);
assert(typeof ps2.readContent === 'function', 'PersistenceService has readContent method');
assert(typeof ps2.writeContent === 'function', 'PersistenceService has writeContent method');
assert(typeof ps2.deleteContent === 'function', 'PersistenceService has deleteContent method');

// 13b: PersistenceService has QA history I/O methods
assert(typeof ps2.readQaHistory === 'function', 'PersistenceService has readQaHistory method');
assert(typeof ps2.writeQaHistory === 'function', 'PersistenceService has writeQaHistory method');

// 13c: content/ directory is created by PersistenceService
assert(fs.existsSync(path.join(testDataDir2, 'content')), 'content/ directory exists');

// 13d: Content write/read round-trip
ps2.writeContent('__test_persistence.txt', 'Hello from kb-008 test');
const contentBack = ps2.readContent('__test_persistence.txt');
assert(contentBack === 'Hello from kb-008 test', 'content write/read round-trips');
ps2.deleteContent('__test_persistence.txt');
assert(ps2.readContent('__test_persistence.txt') === null, 'content delete removes file');

// 13e: QA history write/read round-trip
ps2.writeQaHistory([{ id: 1, question: 'test?', answer: 'ok', citations: [], confidence: 0.85, timestamp: new Date().toISOString() }]);
const historyBack = ps2.readQaHistory();
assert(historyBack.length === 1, 'qa-history write/read round-trips');
assert(historyBack[0].question === 'test?', 'qa-history preserves question field');
ps2.writeQaHistory([]); // cleanup

// 13f: Atomic write pattern used in PersistenceService
const psCode = fs.readFileSync(path.join(__dirname, 'src', 'services', 'PersistenceService.js'), 'utf-8');
assert(psCode.includes('.tmp') && psCode.includes('renameSync'), 'PersistenceService uses atomic writes (tmp + rename)');

// 13g: main.js uses app.getPath('userData') for data directory
const mainJsCode = fs.readFileSync(path.join(__dirname, 'src', 'main', 'main.js'), 'utf-8');
assert(mainJsCode.includes("app.getPath('userData')"), 'main.js uses app.getPath for user data directory');
assert(mainJsCode.includes('knowledge-base-data'), 'main.js stores data in knowledge-base-data directory');

// 13h: main.js wires content/ I/O for import, create, update, delete
assert(mainJsCode.includes('persistence.writeContent'), 'main.js calls persistence.writeContent');
assert(mainJsCode.includes('persistence.readContent'), 'main.js calls persistence.readContent');
assert(mainJsCode.includes('persistence.deleteContent'), 'main.js calls persistence.deleteContent');

// 13i: Renderer loads Q&A history on startup
assert(renderer.includes('function loadQaHistory'), 'renderer.js defines loadQaHistory');
assert(renderer.includes('function renderQaEntry'), 'renderer.js defines renderQaEntry helper');
assert(renderer.includes('window.kbAPI.getHistory'), 'renderer.js calls kbAPI.getHistory for history load');

// 13j: Renderer has activity timestamp
assert(renderer.includes('function updateActivityTimestamp'), 'renderer.js defines updateActivityTimestamp');
assert(html.includes('id="status-activity"'), 'HTML has status-activity element');
// --- Test 14: Architectural rule check ---
console.log('\n--- Test 14: Architectural rule check ---');

// 14a: check-arch.mjs exists
const archCheckPath = path.join(__dirname, 'scripts', 'check-arch.mjs');
assert(fs.existsSync(archCheckPath), 'check-arch.mjs script exists');

// 14b: check-arch.mjs scans renderer for forbidden Node.js imports
const archContent = fs.readFileSync(archCheckPath, 'utf-8');
assert(archContent.includes('FORBIDDEN_BUILTINS'), 'check-arch.mjs defines forbidden built-ins list');
assert(archContent.includes('renderer'), 'check-arch.mjs targets renderer layer');

// 14c: renderer.js does NOT contain direct Node.js requires
assert(!renderer.includes("require('fs')") && !renderer.includes('require("fs")'),
  'renderer.js does not require fs directly');
assert(!renderer.includes("require('path')") && !renderer.includes('require("path")'),
  'renderer.js does not require path directly');
assert(!renderer.includes("require('electron')") && !renderer.includes('require("electron")'),
  'renderer.js does not require electron directly');

// 14d: index.html does NOT contain Node.js script tags
const mainJsContent = fs.readFileSync(path.join(__dirname, 'src', 'main', 'main.js'), 'utf-8');
assert(mainJsContent.includes('contextIsolation: true'), 'main.js enforces contextIsolation: true');
assert(mainJsContent.includes('nodeIntegration: false'), 'main.js enforces nodeIntegration: false');

// --- Summary ---
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);


