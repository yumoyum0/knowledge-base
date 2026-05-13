// --- DOM references ---
const docList = document.getElementById('doc-list');
const qaThread = document.getElementById('qa-thread');
const qaForm = document.getElementById('qa-form');
const qaInput = document.getElementById('qa-input');
const dataPathEl = document.getElementById('data-path');
const newDocBtn = document.getElementById('new-doc-btn');

let currentDoc = null;
let editMode = false;

// --- Load document list ---
async function loadDocumentList() {
  const files = await window.kbAPI.listFiles();
  docList.innerHTML = '';

  if (files.length === 0) {
    docList.innerHTML = '<li class="doc-list-empty">No documents found.</li>';
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
  toolbar.innerHTML = `
    <span class="doc-toolbar-title">${escapeHtml(file.name)}</span>
    <div class="doc-toolbar-actions">
      <button class="doc-action-btn doc-edit-btn" title="Edit document">Edit</button>
      <button class="doc-action-btn doc-delete-btn-danger" title="Delete document">Delete</button>
    </div>
  `;
  toolbar.querySelector('.doc-edit-btn').addEventListener('click', () => enterEditMode(file, content));
  toolbar.querySelector('.doc-delete-btn-danger').addEventListener('click', () => deleteDocument(file));
  qaThread.appendChild(toolbar);

  // Content
  if (content !== null && content.length > 0) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'qa-document-view';
    contentDiv.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
    qaThread.appendChild(contentDiv);
  } else {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'qa-document-view qa-document-empty';
    emptyDiv.textContent = '(empty document)';
    qaThread.appendChild(emptyDiv);
  }
}

// --- Enter edit mode ---
function enterEditMode(file, content) {
  editMode = true;
  qaThread.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'doc-toolbar';
  toolbar.innerHTML = `
    <span class="doc-toolbar-title">Editing: ${escapeHtml(file.name)}</span>
    <div class="doc-toolbar-actions">
      <button class="doc-action-btn doc-save-btn">Save</button>
      <button class="doc-action-btn doc-cancel-btn">Cancel</button>
    </div>
  `;
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
    alert(`Failed to save: ${result.error}`);
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
    alert(`Failed to create: ${result.error}`);
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
  const confirmed = confirm(`Delete "${file.name}"? This cannot be undone.`);
  if (!confirmed) return;
  const result = await window.kbAPI.deleteFile(file.path);
  if (result.error) {
    alert(`Failed to delete: ${result.error}`);
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
  userMsg.innerHTML = `<strong>Q:</strong> ${escapeHtml(question)}`;
  qaThread.appendChild(userMsg);

  // Generate response
  let answer;
  if (currentDoc) {
    const content = await window.kbAPI.readFile(currentDoc.path);
    if (content) {
      answer = searchDocument(question, content);
    } else {
      answer = `Could not read "${escapeHtml(currentDoc.name)}".`;
    }
  } else {
    answer = 'No document selected. Please select a document from the sidebar first.';
  }

  const responseMsg = document.createElement('div');
  responseMsg.className = 'qa-message qa-response';
  responseMsg.innerHTML = `<strong>A:</strong> ${answer}`;
  qaThread.appendChild(responseMsg);

  // Scroll to bottom
  qaThread.scrollTop = qaThread.scrollHeight;

  qaInput.value = '';
});

// --- Search document for question keywords ---
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
    return `<span class="qa-snippet-line">Line ${l.index + 1}:</span> ${escapeHtml(l.text)}`;
  });
  return `Found ${matchingLines.length} matching line(s) in "${escapeHtml(currentDoc.name)}":<br><br>${snippets.join('<br>')}`;
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
  dataPathEl.textContent = `Data: ${dataPath}`;
  await loadDocumentList();

  // Wire the New Document button (inside init for guaranteed DOM readiness)
  if (newDocBtn) {
    newDocBtn.addEventListener('click', createNewDocument);
  }
}

init();
