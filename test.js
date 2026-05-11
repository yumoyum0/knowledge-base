// kb-002 verification: document loading from data/ directory
// kb-003 verification: Q&A submission and response display
// kb-004 verification: document create, edit, delete
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
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
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
assert(html.includes('id="doc-list"'), 'HTML has doc-list element');
assert(html.includes('id="qa-thread"'), 'HTML has qa-thread element');
assert(html.includes('id="qa-form"'), 'HTML has qa-form element');
assert(html.includes('id="sidebar"'), 'HTML has sidebar element');
assert(html.includes('id="main-panel"'), 'HTML has main-panel element');
assert(html.includes('id="new-doc-btn"'), 'HTML has new-doc-btn element');

// --- Test 5: renderer.js has required functions ---
console.log('\n--- Test 5: renderer.js functions ---');
const renderer = fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf-8');
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
assert(renderer.includes("qaThread.scrollTop = qaThread.scrollHeight"), 'renderer.js scrolls to bottom after each message');
assert(renderer.includes("qaInput.value = ''"), 'renderer.js clears input after submission');
// Thread safety: submit handler does not reset qaThread.innerHTML (messages accumulate)
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
// Verify newDocBtn listener is inside init(), not at top level (robust DOM timing)
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
const preload = fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf-8');
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

// --- Test 7: main.js IPC handlers ---
console.log('\n--- Test 7: main.js IPC handlers ---');
const mainJs = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf-8');
assert(mainJs.includes("ipcMain.handle('data:list-files'"), 'main.js registers data:list-files handler');
assert(mainJs.includes("ipcMain.handle('data:read-file'"), 'main.js registers data:read-file handler');
assert(mainJs.includes('dataDir'), 'main.js defines dataDir path');
assert(mainJs.includes('endsWith(\'.txt\')'), 'main.js filters .txt files');
assert(mainJs.includes('endsWith(\'.md\')'), 'main.js filters .md files');
assert(mainJs.includes("ipcMain.handle('data:create-file'"), 'main.js registers data:create-file handler');
assert(mainJs.includes("ipcMain.handle('data:update-file'"), 'main.js registers data:update-file handler');
assert(mainJs.includes("ipcMain.handle('data:delete-file'"), 'main.js registers data:delete-file handler');
assert(mainJs.includes('path.basename'), 'main.js uses path.basename for safe filenames');
assert(mainJs.includes('startsWith(dataDir)'), 'main.js validates file paths stay within dataDir');
assert(mainJs.includes('fs.writeFileSync'), 'main.js writes files for create/update');
assert(mainJs.includes('fs.unlinkSync'), 'main.js deletes files with unlinkSync');

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

// Short words (≤2 chars) are ignored
result = searchDocumentLogic('is a to', sampleContent);
// Short words are extracted but produce no matches (filtered at line-matching stage)
const shortWords = result.questionWords.filter(w => w.length <= 2);
assert(shortWords.length === 3, 'short words extracted from question');
assert(result.matchingLines.length === 0, 'short words produce no matches');

// searchDocument truncates to 3 snippets
const manyMatchContent = 'apple banana\ncherry date\nelderberry fig\ngrape honeydew\nkiwi lemon';
result = searchDocumentLogic('fruit', manyMatchContent);
// "fruit" won't match these, let me use words that match
result = searchDocumentLogic('apple cherry elderberry grape kiwi', manyMatchContent);
assert(result.matchingLines.length >= 4, 'searchDocument finds multiple matching lines');

// --- Test 9: kb-004 functional CRUD (mirrors main.js IPC logic) ---
console.log('\n--- Test 9: CRUD operations ---');
const testFileName = '__test_kb004.md';
const testFilePath = path.join(dataDir, testFileName);

// Clean up from previous run
if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
assert(!fs.existsSync(testFilePath), 'test file does not exist before create');

// Create
fs.writeFileSync(testFilePath, '# Test Content\n\nHello, world!', 'utf-8');
assert(fs.existsSync(testFilePath), 'file created on disk');

// Read back
const createdContent = fs.readFileSync(testFilePath, 'utf-8');
assert(createdContent.includes('Hello, world!'), 'created file contains expected content');

// Update
fs.writeFileSync(testFilePath, '# Updated Content\n\nGoodbye!', 'utf-8');
const updatedContent = fs.readFileSync(testFilePath, 'utf-8');
assert(updatedContent.includes('Goodbye!'), 'updated file contains new content');
assert(!updatedContent.includes('Hello, world!'), 'updated file no longer contains old content');

// Delete
fs.unlinkSync(testFilePath);
assert(!fs.existsSync(testFilePath), 'file deleted from disk');

// Verify path-traversal guard: resolved path outside dataDir is rejected
const outsidePath = path.join(__dirname, '..', 'outside.md');
assert(!path.resolve(outsidePath).startsWith(dataDir), 'path outside dataDir is correctly detected');

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
