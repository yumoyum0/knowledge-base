// --- DOM references ---
const docList = document.getElementById('doc-list');
const qaThread = document.getElementById('qa-thread');
const qaForm = document.getElementById('qa-form');
const qaInput = document.getElementById('qa-input');
const dataPathEl = document.getElementById('data-path');

let currentDoc = null;

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
    li.textContent = file.name;
    li.addEventListener('click', () => selectDocument(file));
    docList.appendChild(li);
  });
}

// --- Select a document ---
async function selectDocument(file) {
  currentDoc = file;
  // Highlight active
  document.querySelectorAll('.doc-item').forEach(el => el.classList.remove('active'));
  const items = document.querySelectorAll('.doc-item');
  items.forEach(el => {
    if (el.textContent === file.name) el.classList.add('active');
  });

  // Clear Q&A thread and show document name
  qaThread.innerHTML = `
    <div class="qa-message qa-system">
      <strong>Loaded: ${escapeHtml(file.name)}</strong>
    </div>
  `;

  // Read and display file content
  const content = await window.kbAPI.readFile(file.path);
  if (content !== null) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'qa-message qa-document-content';
    contentDiv.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
    qaThread.appendChild(contentDiv);
  }
}

// --- Handle Q&A submission ---
qaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = qaInput.value.trim();
  if (!question) return;

  // Remove placeholder if present
  const placeholder = qaThread.querySelector('.qa-placeholder');
  if (placeholder) placeholder.remove();

  // Add user question
  const userMsg = document.createElement('div');
  userMsg.className = 'qa-message qa-user';
  userMsg.innerHTML = `<strong>Q:</strong> ${escapeHtml(question)}`;
  qaThread.appendChild(userMsg);

  // Echo response for now (placeholder until kb-003)
  const responseMsg = document.createElement('div');
  responseMsg.className = 'qa-message qa-response';
  if (currentDoc) {
    responseMsg.innerHTML = `<strong>A:</strong> (Response for "${escapeHtml(currentDoc.name)}" will be implemented in kb-003.)`;
  } else {
    responseMsg.innerHTML = `<strong>A:</strong> No document selected. Please select a document first.`;
  }
  qaThread.appendChild(responseMsg);

  // Scroll to bottom
  qaThread.scrollTop = qaThread.scrollHeight;

  qaInput.value = '';
});

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
}

init();
