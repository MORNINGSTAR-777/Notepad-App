// ============================================================
// app.js — NoteKeeper Frontend Logic
// Handles authentication, notes CRUD, and UI state
// ============================================================

// ── Config ───────────────────────────────────────────────────
// Change this to your backend URL when deploying
const API_BASE = 'https://notepad-app-backend.onrender.com/api';

// ── App State ────────────────────────────────────────────────
let currentNotes  = [];  // Cached list of notes from the server
let pendingDeleteId = null;

// ════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in (token in localStorage)
  const token = localStorage.getItem('nk_token');
  if (token) {
    const user = JSON.parse(localStorage.getItem('nk_user') || '{}');
    enterApp(user);
  }

  // Attach Enter key to login and register forms
  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('reg-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
    updatePasswordStrength(e.target.value);
  });
  document.getElementById('reg-password').addEventListener('input', (e) => {
    updatePasswordStrength(e.target.value);
  });
});

// ════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════

/** Get the stored JWT token */
function getToken() {
  return localStorage.getItem('nk_token');
}

/** Format a date string into a human-readable form */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/** Show a brief toast notification */
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

/** Show an inline error message inside a form */
function showFormError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

/** Clear a form error */
function clearFormError(id) {
  document.getElementById(id).classList.add('hidden');
}

/** Toggle loading state on a button */
function setLoading(btn, loading) {
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  if (text && loader) {
    text.classList.toggle('hidden', loading);
    loader.classList.toggle('hidden', !loading);
  }
  btn.disabled = loading;
}

// ════════════════════════════════════════════════════════════
// AUTH PAGE — TAB SWITCHING
// ════════════════════════════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(f => f.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`${tab}-form`).classList.add('active');
  clearFormError('login-error');
  clearFormError('register-error');
  document.getElementById('register-success').classList.add('hidden');
}

/** Show/hide password field */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

/** Password strength meter */
function updatePasswordStrength(val) {
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  let strength = 0;
  if (val.length >= 6)  strength++;
  if (val.length >= 10) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;

  const levels = [
    { pct: '0%',   bg: 'transparent', text: '' },
    { pct: '25%',  bg: '#ff4b4b',     text: 'Weak' },
    { pct: '50%',  bg: '#ff9a3c',     text: 'Fair' },
    { pct: '75%',  bg: '#ffdd57',     text: 'Good' },
    { pct: '100%', bg: '#4bffa5',     text: 'Strong' },
  ];
  const lvl = levels[Math.min(strength, 4)];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.bg;
  label.textContent     = lvl.text;
  label.style.color     = lvl.bg;
}

// ════════════════════════════════════════════════════════════
// AUTH — REGISTER
// ════════════════════════════════════════════════════════════
async function handleRegister() {
  clearFormError('register-error');
  document.getElementById('register-success').classList.add('hidden');

  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn      = document.querySelector('#register-form .btn-primary');

  // Client-side validation
  if (!username || !email || !password) {
    return showFormError('register-error', 'All fields are required.');
  }
  if (password.length < 6) {
    return showFormError('register-error', 'Password must be at least 6 characters.');
  }

  setLoading(btn, true);

  try {
    const res  = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showFormError('register-error', data.message || 'Registration failed.');
      return;
    }

    // Save token and user, then go into the app
    localStorage.setItem('nk_token', data.token);
    localStorage.setItem('nk_user', JSON.stringify(data.user));
    enterApp(data.user);

  } catch (err) {
    showFormError('register-error', 'Network error. Is the server running?');
  } finally {
    setLoading(btn, false);
  }
}

// ════════════════════════════════════════════════════════════
// AUTH — LOGIN
// ════════════════════════════════════════════════════════════
async function handleLogin() {
  clearFormError('login-error');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.querySelector('#login-form .btn-primary');

  if (!email || !password) {
    return showFormError('login-error', 'Email and password are required.');
  }

  setLoading(btn, true);

  try {
    const res  = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showFormError('login-error', data.message || 'Login failed.');
      return;
    }

    localStorage.setItem('nk_token', data.token);
    localStorage.setItem('nk_user', JSON.stringify(data.user));
    enterApp(data.user);

  } catch (err) {
    showFormError('login-error', 'Network error. Is the server running?');
  } finally {
    setLoading(btn, false);
  }
}

// ════════════════════════════════════════════════════════════
// APP ENTRY / EXIT
// ════════════════════════════════════════════════════════════

/** Switch from auth page to main app */
function enterApp(user) {
  document.getElementById('auth-page').classList.remove('active');
  document.getElementById('app-page').classList.add('active');
  document.getElementById('username-display').textContent = user.username || 'User';
  loadNotes(); // Fetch notes right away
}

/** Sign out and return to auth page */
function handleLogout() {
  localStorage.removeItem('nk_token');
  localStorage.removeItem('nk_user');
  currentNotes = [];
  // Reset forms
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  // Switch pages
  document.getElementById('app-page').classList.remove('active');
  document.getElementById('auth-page').classList.add('active');
  // Go back to the "new note" view for next login
  switchView('new', document.querySelector('.nav-item[data-view="new"]'));
}

// ════════════════════════════════════════════════════════════
// NAVIGATION — VIEW SWITCHING
// ════════════════════════════════════════════════════════════
function switchView(name, clickedBtn) {
  // Deactivate all views and nav items
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById(`view-${name}`).classList.add('active');
  if (clickedBtn) clickedBtn.classList.add('active');

  // Load data relevant to the view
  if (name === 'view')   { loadNotes(); renderViewAllNotes(); }
  if (name === 'files')  { loadNotes().then(renderFilesList); }
  if (name === 'delete') { loadNotes().then(renderDeleteList); }
}

// ════════════════════════════════════════════════════════════
// NOTES — API CALLS
// ════════════════════════════════════════════════════════════

/** Fetch all notes from the server and cache them */
async function loadNotes() {
  try {
    const res  = await fetch(`${API_BASE}/notes`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.status === 401) { handleLogout(); return; }
    const data = await res.json();
    currentNotes = Array.isArray(data) ? data : [];
    updateNotesBadge();
    return currentNotes;
  } catch (err) {
    showToast('Failed to load notes', 'error');
    return [];
  }
}

/** Update the note count badge in the sidebar */
function updateNotesBadge() {
  document.getElementById('notes-count-badge').textContent = currentNotes.length;
}

// ════════════════════════════════════════════════════════════
// NOTE EDITOR (New Note view)
// ════════════════════════════════════════════════════════════

/** Update the character counter below the textarea */
function updateCharCount() {
  const len = document.getElementById('note-content').value.length;
  document.getElementById('char-count').textContent = `${len} char${len !== 1 ? 's' : ''}`;
}

/** Clear the editor fields */
function clearEditor() {
  document.getElementById('note-title').value   = '';
  document.getElementById('note-content').value = '';
  updateCharCount();
}

/** Save a new note */
async function handleSaveNote() {
  const title   = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const btn     = document.querySelector('.btn-save');

  if (!title)   return showToast('Please enter a title', 'error');
  if (!content) return showToast('Please enter some content', 'error');

  setLoading(btn, true);

  try {
    const res  = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title, content })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Failed to save note', 'error');
      return;
    }

    showToast('Note saved! ◆', 'success');
    clearEditor();
    // Update local cache with new note at the top
    currentNotes.unshift(data.note);
    updateNotesBadge();

  } catch (err) {
    showToast('Network error saving note', 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ════════════════════════════════════════════════════════════
// VIEW ALL NOTES
// ════════════════════════════════════════════════════════════
function renderViewAllNotes() {
  const container = document.getElementById('notes-list-view');
  const notes     = currentNotes;

  if (!notes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-icon">◇</p>
        <p>No notes yet. Hit <strong>New Note</strong> to get started!</p>
      </div>`;
    return;
  }

  container.innerHTML = notes.map(note => `
    <div class="note-card" data-id="${note._id}">
      <div class="note-card-title">${escHtml(note.title)}</div>
      <div class="note-card-preview">${escHtml(note.content)}</div>
      <div class="note-card-date">${formatDate(note.createdAt)}</div>
    </div>
  `).join('');
}

/** Filter shown notes by the search query */
function filterNotes() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = currentNotes.filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.content.toLowerCase().includes(query)
  );

  const container = document.getElementById('notes-list-view');

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-icon">◇</p>
        <p>No notes match your search.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(note => `
    <div class="note-card" data-id="${note._id}">
      <div class="note-card-title">${escHtml(note.title)}</div>
      <div class="note-card-preview">${escHtml(note.content)}</div>
      <div class="note-card-date">${formatDate(note.createdAt)}</div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════════
// FILES — Open a specific note
// ════════════════════════════════════════════════════════════
function renderFilesList() {
  const list  = document.getElementById('files-list');
  const notes = currentNotes;
  closeReader(); // reset the reader panel

  if (!notes.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p class="empty-icon">◇</p>
        <p>No notes to open.</p>
      </div>`;
    return;
  }

  list.innerHTML = notes.map(note => `
    <div class="file-item" onclick="openNote('${note._id}')">
      <span class="file-icon">⬡</span>
      <div class="file-info">
        <div class="file-title">${escHtml(note.title)}</div>
        <div class="file-meta">${formatDate(note.createdAt)} · ${note.content.length} chars</div>
      </div>
      <span class="file-arrow">›</span>
    </div>
  `).join('');
}

/** Open a note in the reader panel */
async function openNote(id) {
  const filesList = document.getElementById('files-list');
  const reader    = document.getElementById('note-reader');

  try {
    // Try local cache first, then fetch from server
    let note = currentNotes.find(n => n._id === id);

    if (!note) {
      const res  = await fetch(`${API_BASE}/notes/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      note = await res.json();
    }

    document.getElementById('reader-title').textContent   = note.title;
    document.getElementById('reader-content').textContent = note.content;
    document.getElementById('reader-date').textContent    = formatDate(note.createdAt);

    filesList.classList.add('hidden');
    reader.classList.remove('hidden');

  } catch (err) {
    showToast('Failed to open note', 'error');
  }
}

function closeReader() {
  document.getElementById('files-list').classList.remove('hidden');
  document.getElementById('note-reader').classList.add('hidden');
}

// ════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════
function renderDeleteList() {
  const list  = document.getElementById('delete-list');
  const notes = currentNotes;

  if (!notes.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p class="empty-icon">◇</p>
        <p>No notes to delete.</p>
      </div>`;
    return;
  }

  list.innerHTML = notes.map(note => `
    <div class="delete-item" id="ditem-${note._id}">
      <div class="delete-info">
        <div class="delete-title">${escHtml(note.title)}</div>
        <div class="delete-meta">${formatDate(note.createdAt)}</div>
      </div>
      <button class="btn-delete" onclick="confirmDelete('${note._id}', '${escAttr(note.title)}')">
        ⊗ DELETE
      </button>
    </div>
  `).join('');
}

/** Show the confirmation modal before deleting */
function confirmDelete(id, title) {
  pendingDeleteId = id;
  document.getElementById('modal-msg').textContent =
    `"${title}" will be permanently removed. This cannot be undone.`;
  document.getElementById('confirm-modal').classList.remove('hidden');

  // Wire up the confirm button
  document.getElementById('btn-confirm-delete').onclick = () => executeDelete(id);
}

function closeModal() {
  pendingDeleteId = null;
  document.getElementById('confirm-modal').classList.add('hidden');
}

async function executeDelete(id) {
  closeModal();

  try {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.message || 'Delete failed', 'error');
      return;
    }

    // Remove from local cache
    currentNotes = currentNotes.filter(n => n._id !== id);
    updateNotesBadge();
    showToast('Note deleted.', 'success');

    // Remove the item from the DOM without re-rendering
    const el = document.getElementById(`ditem-${id}`);
    if (el) el.remove();

    // Show empty state if no notes left
    if (!currentNotes.length) {
      document.getElementById('delete-list').innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">◇</p>
          <p>No notes to delete.</p>
        </div>`;
    }

  } catch (err) {
    showToast('Network error during delete', 'error');
  }
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

/** Escape HTML special characters to prevent XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape string for use in HTML attributes */
function escAttr(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Close modal if user clicks the backdrop
document.getElementById('confirm-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('confirm-modal')) closeModal();
});
