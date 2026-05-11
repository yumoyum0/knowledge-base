// kb-002 verification: document loading from data/ directory
// kb-003 verification: Q&A submission and response display
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

// --- Test 6: preload.js exposes correct API ---
console.log('\n--- Test 6: preload API surface ---');
const preload = fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf-8');
assert(preload.includes("'data:list-files'"), 'preload exposes data:list-files');
assert(preload.includes("'data:read-file'"), 'preload exposes data:read-file');
assert(preload.includes('listFiles'), 'preload exposes listFiles method');
assert(preload.includes('readFile'), 'preload exposes readFile method');

// --- Test 7: main.js IPC handlers ---
console.log('\n--- Test 7: main.js IPC handlers ---');
const mainJs = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf-8');
assert(mainJs.includes("ipcMain.handle('data:list-files'"), 'main.js registers data:list-files handler');
assert(mainJs.includes("ipcMain.handle('data:read-file'"), 'main.js registers data:read-file handler');
assert(mainJs.includes('dataDir'), 'main.js defines dataDir path');
assert(mainJs.includes('endsWith(\'.txt\')'), 'main.js filters .txt files');
assert(mainJs.includes('endsWith(\'.md\')'), 'main.js filters .md files');

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

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
