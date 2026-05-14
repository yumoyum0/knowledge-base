// --- DOM references ---
const importBtn = document.getElementById('import-btn');
const docList = document.getElementById('doc-list');
const qaThread = document.getElementById('qa-thread');
const qaForm = document.getElementById('qa-form');
const qaInput = document.getElementById('qa-input');
const dataPathEl = document.getElementById('data-path');
const newDocBtn = document.getElementById('new-doc-btn');
const indexAllBtn = document.getElementById('index-all-btn');
const statusIndexState = document.getElementById('status-index-state');
const statusDocCount = document.getElementById('status-doc-count');

let currentDoc = null;
let editMode = false;

// --- Load document list ---
async function loadDocumentList() {
  const files = await window.kbAPI.listFiles();
  docList.innerHTML = '';

  if (files.length === 0) {
    docList.innerHTML = '<li class="doc-list-empty">No documents found.</li>';
    updateStatusBar(files.length);
    return;
  }

  files.forEach(file => {
    const li = document.createElement('li');
    li.className = 'doc-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'doc-name';
    nameSpan.textContent = file.name;
    nameSpan.addEventListener('click', () => selectDocument(file));
    li.appendChild(nameSpan);

    const delBtn = document.createElement('button');
    delBtn.className = 'doc-delete-btn';
    delBtn.innerHTML = '&times;';
    delBtn.title = 'Delete document';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteDocument(file);
    });
    li.appendChild(delBtn);

    docList.appendChild(li);
  });

  updateStatusBar(files.length);
}

// --- Select a document ---
async function selectDocument(file) {
  currentDoc = file;
  editMode = false;
  // Highlight active
  document.querySelectorAll('.doc-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.doc-name').forEach(el => {
    if (el.textContent === file.name) el.parentElement.classList.add('active');
  });

  const content = await window.kbAPI.readFile(file.path);
  renderDocumentView(file, content);
}

// --- Render document in view mode ---
function renderDocumentView(file, content) {
  qaThread.innerHTML = '';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'doc-toolbar';
  toolbar.innerHTML = '<span class="doc-toolbar-title">' + escapeHtml(file.name) + '</span>' +
    '<div class="doc-toolbar-actions">' +
    '<button class="doc-action-btn doc-index-btn" title="Index this document">Index</button>' +
    '<button class="doc-action-btn doc-edit-btn" title="Edit document">Edit</button>' +
    '<button class="doc-action-btn doc-delete-btn-danger" title="Delete document">Delete</button>' +
    '</div>';
  toolbar.querySelector('.doc-edit-btn').addEventListener('click', () => enterEditMode(file, content));
  toolbar.querySelector('.doc-delete-btn-danger').addEventListener('click', () => deleteDocument(file));
  toolbar.querySelector('.doc-index-btn').addEventListener('click', () => indexSingleDocument(file));
  qaThread.appendChild(toolbar);

  // Metadata
  if (file.size) {
    const metaDiv = document.createElement('div');
    metaDiv.className = 'qa-document-meta';
    const sizeKB = (file.size / 1024).toFixed(1);
    const importDate = file.importDate ? new Date(file.importDate).toLocaleDateString() : 'unknown';
    const indexed = file.indexed ? 'Indexed' : 'Not indexed';
    metaDiv.innerHTML = '<span>Size: ' + sizeKB + ' KB</span> &middot; ' +
      '<span>Imported: ' + importDate + '</span> &middot; ' +
      '<span class="meta-indexed">' + indexed + '</span>';
    qaThread.appendChild(metaDiv);
  }

  // Content
  if (content !== null && content.length > 0) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'qa-document-view';
    contentDiv.innerHTML = '<pre>' + escapeHtml(content) + '</pre>';
    qaThread.appendChild(contentDiv);
  } else {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'qa-document-view qa-document-empty';
    emptyDiv.textContent = '(empty document)';
    qaThread.appendChild(emptyDiv);
  }

  // Load and show chunks if available
  loadChunksForDocument(file.name);
}

// --- Load and display chunks ---
async function loadChunksForDocument(docName) {
  const chunks = await window.kbAPI.getChunks(docName);
  if (!chunks || chunks.length === 0) return;

  const chunksContainer = document.createElement('div');
  chunksContainer.className = 'chunks-container';

  const header = document.createElement('div');
  header.className = 'chunks-header';
  header.innerHTML = '<strong>Chunks</strong> (' + chunks.length + ' total)';
  chunksContainer.appendChild(header);

  chunks.forEach(chunk => {
    const chunkDiv = document.createElement('div');
    chunkDiv.className = 'chunk-item';
    chunkDiv.innerHTML =
      '<div class="chunk-meta">Chunk #' + (chunk.index + 1) +
      ' &middot; ' + chunk.charCount + ' chars &middot; ' + chunk.wordCount + ' words</div>' +
      '<div class="chunk-text">' + escapeHtml(chunk.text) + '</div>';
    chunksContainer.appendChild(chunkDiv);
  });

  qaThread.appendChild(chunksContainer);
}

// --- Index a single document ---
async function indexSingleDocument(file) {
  const result = await window.kbAPI.indexSingle(file.path, file.name);
  if (result.error) {
    alert('Indexing failed: ' + result.error);
    return;
  }
  // Refresh document view
  const content = await window.kbAPI.readFile(file.path);
  file.indexed = true;
  renderDocumentView(file, content);
  updateStatusBar();
}

// --- Index all documents ---
async function indexAllDocuments() {
  indexAllBtn.disabled = true;
  indexAllBtn.textContent = 'Indexing...';
  const result = await window.kbAPI.indexAll();
  indexAllBtn.disabled = false;
  indexAllBtn.textContent = 'Index All';

  if (result.error) {
    alert('Indexing failed: ' + result.error);
    return;
  }

  // Refresh document list and current view
  await loadDocumentList();
  if (currentDoc) {
    const files = await window.kbAPI.listFiles();
    const refreshed = files.find(f => f.name === currentDoc.name);
    if (refreshed) {
      await selectDocument(refreshed);
    }
  }
  updateStatusBar();
}

// --- Enter edit mode ---
function enterEditMode(file, content) {
  editMode = true;
  qaThread.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'doc-toolbar';
  toolbar.innerHTML = '<span class="doc-toolbar-title">Editing: ' + escapeHtml(file.name) + '</span>' +
    '<div class="doc-toolbar-actions">' +
    '<button class="doc-action-btn doc-save-btn">Save</button>' +
    '<button class="doc-action-btn doc-cancel-btn">Cancel</button>' +
    '</div>';
  toolbar.querySelector('.doc-save-btn').addEventListener('click', () => saveEdit(file));
  toolbar.querySelector('.doc-cancel-btn').addEventListener('click', () => cancelEdit(file, content));
  qaThread.appendChild(toolbar);

  const textarea = document.createElement('textarea');
  textarea.id = 'doc-editor';
  textarea.className = 'doc-editor';
  textarea.value = content || '';
  qaThread.appendChild(textarea);
  textarea.focus();
}

// --- Save edited content ---
async function saveEdit(file) {
  const textarea = document.getElementById('doc-editor');
  if (!textarea) return;
  const newContent = textarea.value;
  const result = await window.kbAPI.updateFile(file.path, newContent);
  if (result.error) {
    alert('Failed to save: ' + result.error);
    return;
  }
  editMode = false;
  renderDocumentView(file, newContent);
}

// --- Cancel edit ---
function cancelEdit(file, originalContent) {
  editMode = false;
  renderDocumentView(file, originalContent);
}

// --- Import document via file picker ---
async function importDocument() {
  const result = await window.kbAPI.importFile();
  if (!result) return; // user cancelled
  if (result.error) {
    alert('Import failed: ' + result.error);
    return;
  }
  await loadDocumentList();
  // Auto-select the imported file
  const files = await window.kbAPI.listFiles();
  const imported = files.find(f => f.name === result.name);
  if (imported) {
    await selectDocument(imported);
  }
}

// --- Create new document ---
async function createNewDocument() {
  const name = prompt('Enter a filename (.txt or .md):');
  if (!name) return;
  if (!name.endsWith('.txt') && !name.endsWith('.md')) {
    alert('Filename must end with .txt or .md');
    return;
  }
  const result = await window.kbAPI.createFile(name, '');
  if (result.error) {
    alert('Failed to create: ' + result.error);
    return;
  }
  await loadDocumentList();
  const files = await window.kbAPI.listFiles();
  const newFile = files.find(f => f.name === result.name);
  if (newFile) {
    await selectDocument(newFile);
    enterEditMode(newFile, '');
  }
}

// --- Delete document ---
async function deleteDocument(file) {
  const confirmed = confirm('Delete "' + file.name + '"? This cannot be undone.');
  if (!confirmed) return;
  const result = await window.kbAPI.deleteFile(file.path);
  if (result.error) {
    alert('Failed to delete: ' + result.error);
    return;
  }
  if (currentDoc && currentDoc.path === file.path) {
    currentDoc = null;
    qaThread.innerHTML = '<div class="qa-placeholder"><p>Select a document from the sidebar, then ask a question about it.</p></div>';
  }
  await loadDocumentList();
}

// --- Handle Q&A submission ---
qaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = qaInput.value.trim();
  if (!question || editMode) return;

  // Remove placeholder if present
  const placeholder = qaThread.querySelector('.qa-placeholder');
  if (placeholder) placeholder.remove();

  // Add user question
  const userMsg = document.createElement('div');
  userMsg.className = 'qa-message qa-user';
  userMsg.innerHTML = '<strong>Q:</strong> ' + escapeHtml(question);
  qaThread.appendChild(userMsg);

  // Generate response via QaService
  const responseMsg = document.createElement('div');
  responseMsg.className = 'qa-message qa-response';

  try {
    const result = await window.kbAPI.ask(question);

    // Answer text
    let html = '<strong>A:</strong> ' + escapeHtml(result.answer).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    // Citations
    if (result.citations && result.citations.length > 0) {
      html += '<div class="qa-citation-list">';
      result.citations.forEach(c => {
        html += '<div class="qa-citation">' +
          '<span class="qa-citation-doc">' + escapeHtml(c.docName) + ' (chunk ' + (c.chunkIndex + 1) + ')</span>' +
          '<span class="qa-citation-excerpt">' + escapeHtml(c.excerpt) + '</span>' +
          '</div>';
      });
      html += '</div>';
    }

    // Confidence badge
    const pct = Math.round(result.confidence * 100);
    const confClass = result.confidence >= 0.85 ? 'qa-confidence-high' : 'qa-confidence-low';
    const confLabel = result.confidence >= 0.85 ? 'High confidence' : 'Low confidence';
    html += '<div class="qa-confidence ' + confClass + '">' + confLabel + ' (' + pct + '%)</div>';

    responseMsg.innerHTML = html;
  } catch {
    responseMsg.innerHTML = '<strong>A:</strong> Failed to process question.';
  }
  qaThread.appendChild(responseMsg);

  // Scroll to bottom
  qaThread.scrollTop = qaThread.scrollHeight;

  qaInput.value = '';
});

// --- Search document for question keywords ---
// eslint-disable-next-line no-unused-vars
function searchDocument(question, content) {
  const questionWords = question.toLowerCase().match(/\b\w+\b/g) || [];
  const lines = content.split('\n');

  // Find lines that contain any question word
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

  if (matchingLines.length === 0) {
    return 'No relevant information found in the loaded document. Try rephrasing your question.';
  }

  // Show up to 3 most relevant lines
  const snippets = matchingLines.slice(0, 3).map(l => {
    return '<span class="qa-snippet-line">Line ' + (l.index + 1) + ':</span> ' + escapeHtml(l.text);
  });
  return 'Found ' + matchingLines.length + ' matching line(s) in "' + escapeHtml(currentDoc.name) + '":<br><br>' + snippets.join('<br>');
}

// --- Status bar ---
async function updateStatusBar(docCount) {
  // Update index status
  try {
    const status = await window.kbAPI.getIndexStatus();
    if (status && status.globalStatus) {
      statusIndexState.textContent = 'Index: ' + status.globalStatus;
      statusIndexState.className = 'status-item status-' + status.globalStatus;
    }
  } catch {
    statusIndexState.textContent = 'Index: unknown';
    statusIndexState.className = 'status-item';
  }

  // Update document count
  const count = docCount !== undefined ? docCount : (await window.kbAPI.listFiles()).length;
  statusDocCount.textContent = 'Docs: ' + count;
}

// --- Utility ---
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Init ---
async function init() {
  const dataPath = await window.kbAPI.getDataPath();
  dataPathEl.textContent = 'Data: ' + dataPath;
  await loadDocumentList();

  if (newDocBtn) {
    newDocBtn.addEventListener('click', createNewDocument);
  }
  if (importBtn) {
    importBtn.addEventListener('click', importDocument);
  }
  if (indexAllBtn) {
    indexAllBtn.addEventListener('click', indexAllDocuments);
  }

  updateStatusBar();
}

init();
