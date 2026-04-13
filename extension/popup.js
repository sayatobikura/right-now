// ── Storage helpers ──

const KEYS = {
  apiKey: 'rightnow_api_key',
  provider: 'rightnow_provider',
  authMode: 'rightnow_auth_mode', // 'oauth' | 'apikey'
  notes: 'rightnow_notes',
};

async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorage(data) {
  return chrome.storage.local.set(data);
}

async function getAuthConfig() {
  const data = await getStorage([KEYS.apiKey, KEYS.provider, KEYS.authMode]);
  return {
    apiKey: data[KEYS.apiKey] || null,
    provider: data[KEYS.provider] || 'claude',
    authMode: data[KEYS.authMode] || 'apikey',
  };
}

async function saveApiKeyConfig(apiKey, provider) {
  await setStorage({
    [KEYS.apiKey]: apiKey,
    [KEYS.provider]: provider,
    [KEYS.authMode]: 'apikey',
  });
}

async function saveOAuthConfig() {
  await setStorage({
    [KEYS.provider]: 'chatgpt-oauth',
    [KEYS.authMode]: 'oauth',
  });
}

async function clearAuth() {
  await chrome.storage.local.remove([KEYS.apiKey, KEYS.provider, KEYS.authMode]);
  await clearOAuthTokens();
}

async function getNotes() {
  const data = await getStorage([KEYS.notes]);
  return data[KEYS.notes] || [];
}

async function saveNotes(notes) {
  await setStorage({ [KEYS.notes]: notes });
}

// ── AI Service ──

function buildOrganizePrompt() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  return `You are a personal productivity AI. Given a capture (note, idea, task, or tip), classify it and extract structured data.

Today is ${dayName}, ${today}.

Rules:
1. "type": Classify as one of: "task" (actionable), "idea" (creative thought), "tip" (advice), "note" (informational)
2. "tags": 1-5 short lowercase tags
3. "category": one of: "work", "personal", "ideas", "journal", "reference", "learning"
4. "priority": For tasks — "high", "medium", or "low". null for non-tasks.
5. "deadline": If text mentions a date (e.g., "by Friday"), convert to YYYY-MM-DD. null if none.
6. "deadlineReason": How you derived the deadline. null if none.
7. "suggestedSchedule": For tasks, suggest when to work on it (YYYY-MM-DD). null for non-tasks.

Respond with ONLY valid JSON:
{"type":"task","tags":["tag1"],"category":"work","priority":"high","deadline":"2026-04-15","deadlineReason":"from 'by Tuesday'","suggestedSchedule":"2026-04-14"}`;
}

async function callClaude(apiKey, content) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 768,
      system: buildOrganizePrompt(),
      messages: [{ role: 'user', content: `Capture:\n${content}` }],
    }),
  });
  if (!resp.ok) throw new Error(`Claude API error (${resp.status})`);
  const data = await resp.json();
  const block = data.content?.find((b) => b.type === 'text');
  return block?.text || '';
}

async function callOpenAIKey(apiKey, content) {
  let resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 768,
      messages: [
        { role: 'system', content: buildOrganizePrompt() },
        { role: 'user', content: `Capture:\n${content}` },
      ],
    }),
  });
  if (resp.status === 429) {
    await new Promise((r) => setTimeout(r, 3000));
    resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 768,
        messages: [
          { role: 'system', content: buildOrganizePrompt() },
          { role: 'user', content: `Capture:\n${content}` },
        ],
      }),
    });
  }
  if (!resp.ok) throw new Error(`OpenAI API error (${resp.status})`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function organizeNote(authMode, apiKey, provider, content) {
  try {
    let text;
    if (authMode === 'oauth') {
      text = await callChatGPTOAuth(content);
    } else if (provider === 'openai') {
      text = await callOpenAIKey(apiKey, content);
    } else {
      text = await callClaude(apiKey, content);
    }
    if (!text) return null;
    const cleaned = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('AI error:', err);
    return { error: err.message };
  }
}

// ── Time helpers ──

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Render: Setup ──

const app = document.getElementById('app');

function renderSetup(savedProvider) {
  let provider = savedProvider || 'claude';
  const prefixes = { claude: 'sk-ant-', openai: 'sk-' };
  const placeholders = { claude: 'sk-ant-...', openai: 'sk-...' };
  let oauthLoading = false;
  let oauthError = '';

  function draw() {
    app.innerHTML = `
      <div class="setup">
        <h2>⚡ Right Now</h2>
        <p>Sign in with ChatGPT or use an API key</p>

        <button class="btn-oauth" id="oauth-btn" ${oauthLoading ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.046 6.046 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3.005l-2.607 1.5-2.602-1.5z" fill="currentColor"/>
          </svg>
          ${oauthLoading ? 'Signing in...' : 'Sign in with ChatGPT'}
        </button>
        ${oauthError ? `<div style="color:var(--danger);font-size:11px;margin-bottom:8px;">${escHtml(oauthError)}</div>` : ''}

        <div class="divider"><span>or use API key</span></div>

        <div class="setup-providers">
          <button data-p="claude" class="${provider === 'claude' ? 'active' : ''}">Claude</button>
          <button data-p="openai" class="${provider === 'openai' ? 'active' : ''}">OpenAI</button>
        </div>
        <input type="password" id="key-input" placeholder="${placeholders[provider]}" />
        <div id="setup-error" style="color:var(--danger);font-size:11px;margin-bottom:8px;display:none;"></div>
        <button class="btn btn-primary" style="width:100%" id="save-btn">Get Started</button>
      </div>
    `;

    // OAuth button — opens auth tab, popup will close
    document.getElementById('oauth-btn').addEventListener('click', async () => {
      oauthLoading = true;
      oauthError = '';
      draw();
      try {
        await startOAuthLogin();
        // Popup closes here when the auth tab opens.
        // Flow resumes in init() when user reopens popup.
      } catch (err) {
        oauthLoading = false;
        oauthError = err.message;
        draw();
      }
    });

    // Provider tabs
    app.querySelectorAll('[data-p]').forEach((btn) => {
      btn.addEventListener('click', () => {
        provider = btn.dataset.p;
        draw();
      });
    });

    // API key save
    document.getElementById('save-btn').addEventListener('click', async () => {
      const key = document.getElementById('key-input').value.trim();
      const errEl = document.getElementById('setup-error');
      if (!key) {
        errEl.textContent = 'Please enter an API key';
        errEl.style.display = 'block';
        return;
      }
      if (!key.startsWith(prefixes[provider])) {
        errEl.textContent = `Key should start with ${prefixes[provider]}`;
        errEl.style.display = 'block';
        return;
      }
      await saveApiKeyConfig(key, provider);
      renderMain('apikey', key, provider);
    });
  }

  draw();
}

// ── Helpers for Today view ──

const PRIORITY_COLORS = {
  high: 'background:rgba(232,116,97,0.15);color:#d05a48;',
  medium: 'background:rgba(240,198,116,0.15);color:#c9a045;',
  low: 'background:rgba(124,201,160,0.15);color:#5aa67e;',
};
const TYPE_ICONS = { task: '☑', idea: '💡', tip: '⭐', note: '📝' };

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

function getTodayItems(notes) {
  const today = getTodayStr();
  return notes.filter(n => {
    const s = n.status || 'active';
    if (s === 'done' || s === 'archived') return false;
    if (n.deadline && n.deadline <= today) return true;
    if (n.scheduledDate && n.scheduledDate <= today) return true;
    if (n.itemType === 'task' && n.priority === 'high' && s === 'active') return true;
    return false;
  }).sort((a, b) => {
    const today = getTodayStr();
    const aOD = a.deadline && a.deadline < today;
    const bOD = b.deadline && b.deadline < today;
    if (aOD && !bOD) return -1;
    if (!aOD && bOD) return 1;
    const pw = { high: 3, medium: 2, low: 1 };
    return (pw[b.priority] || 0) - (pw[a.priority] || 0);
  });
}

function deadlineBadge(deadline) {
  if (!deadline) return '';
  const today = getTodayStr();
  if (deadline < today) {
    const days = Math.ceil((Date.now() - new Date(deadline).getTime()) / 86400000);
    return `<span class="badge badge-overdue">${days}d overdue</span>`;
  }
  if (deadline === today) return '<span class="badge badge-warning">Due today</span>';
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return `<span class="badge badge-default">in ${days}d</span>`;
}

function priorityBadge(priority) {
  if (!priority) return '';
  return `<span class="badge" style="${PRIORITY_COLORS[priority]}">${priority}</span>`;
}

// ── Render: Main ──

const ALL_TYPES = ['task', 'idea', 'tip', 'note'];
const ALL_PRIORITIES = ['high', 'medium', 'low', 'none'];
const ALL_CATEGORIES = ['work', 'personal', 'ideas', 'journal', 'reference', 'learning'];

async function renderMain(authMode, apiKey, provider) {
  const notes = await getNotes();
  let currentTab = 'today';
  let editingNote = null; // note being edited

  // ── Detail/Edit view ──
  function drawDetail(n, status) {
    const pills = (list, current, field) => list.map(v => {
      const active = (field === 'priority' && v === 'none') ? !n[field] : n[field] === v;
      const style = active ? 'background:var(--accent);color:white;' : 'background:var(--surface-2);color:var(--text-secondary);';
      return `<button class="pill" data-field="${field}" data-value="${v}" style="${style}">${v}</button>`;
    }).join('');

    let statusHtml = '';
    if (status === 'reorganizing') statusHtml = '<div class="status organizing"><div class="spinner"></div> Re-organizing...</div>';
    else if (status === 'saved') statusHtml = '<div class="status success">Updated!</div>';

    app.innerHTML = `
      <div class="header">
        <button id="back-btn" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:13px;">← Back</button>
        <span class="provider">${TYPE_ICONS[n.itemType || 'note']} ${n.itemType || 'note'}</span>
      </div>
      <div style="padding:12px 16px;">
        <textarea id="edit-content" rows="4" style="width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text-primary);font-size:13px;font-family:inherit;resize:none;outline:none;">${escHtml(n.content)}</textarea>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="btn btn-primary" id="save-edit">Save</button>
          <button class="btn" id="save-reorg" style="background:var(--surface-2);color:var(--text-primary);">Save & Re-organize</button>
        </div>
        ${statusHtml}
        <div style="margin-top:12px;">
          <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:4px;">Type</div>
          <div class="pill-group">${pills(ALL_TYPES, n.itemType, 'itemType')}</div>
        </div>
        <div style="margin-top:8px;">
          <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:4px;">Priority</div>
          <div class="pill-group">${pills(ALL_PRIORITIES, n.priority, 'priority')}</div>
        </div>
        <div style="margin-top:8px;">
          <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:4px;">Category</div>
          <div class="pill-group">${pills(ALL_CATEGORIES, n.category, 'category')}</div>
        </div>
        <div style="margin-top:8px;">
          <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:4px;">Deadline</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <input type="date" id="edit-deadline" value="${n.deadline || ''}" style="background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:11px;color:var(--text-primary);outline:none;" />
            ${n.deadline ? '<button id="clear-deadline" style="font-size:10px;color:var(--text-tertiary);background:none;border:none;cursor:pointer;">clear</button>' : ''}
          </div>
        </div>
        <div style="margin-top:8px;">
          ${n.tags?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${n.tags.map(t => `<span class="note-tag">#${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    `;

    // Back
    document.getElementById('back-btn').addEventListener('click', () => { editingNote = null; draw(null); });

    // Save content only
    document.getElementById('save-edit').addEventListener('click', async () => {
      const content = document.getElementById('edit-content').value.trim();
      if (content) { n.content = content; n.updatedAt = new Date().toISOString(); await saveNotes(notes); drawDetail(n, 'saved'); setTimeout(() => drawDetail(n, null), 1500); }
    });

    // Save & re-organize
    document.getElementById('save-reorg').addEventListener('click', async () => {
      const content = document.getElementById('edit-content').value.trim();
      if (!content) return;
      n.content = content; n.updatedAt = new Date().toISOString();
      await saveNotes(notes);
      drawDetail(n, 'reorganizing');
      const result = await organizeNote(authMode, apiKey, provider, content);
      if (result && !result.error) {
        n.tags = result.tags || [];
        n.category = result.category || null;
        if (result.type) n.itemType = result.type;
        if (result.priority !== undefined) n.priority = result.priority;
        if (result.deadline !== undefined) n.deadline = result.deadline;
        if (result.suggestedSchedule) n.scheduledDate = result.suggestedSchedule;
        if (result.type === 'task' || result.deadline) n.status = 'active';
        n.updatedAt = new Date().toISOString();
        await saveNotes(notes);
        drawDetail(n, 'saved');
        setTimeout(() => drawDetail(n, null), 1500);
      } else {
        drawDetail(n, null);
      }
    });

    // Pill buttons (type, priority, category)
    app.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', async () => {
        const field = btn.dataset.field;
        let value = btn.dataset.value;
        if (field === 'priority' && value === 'none') value = null;
        n[field] = value;
        n.updatedAt = new Date().toISOString();
        await saveNotes(notes);
        drawDetail(n, null);
      });
    });

    // Deadline
    const deadlineInput = document.getElementById('edit-deadline');
    if (deadlineInput) {
      deadlineInput.addEventListener('change', async (e) => {
        n.deadline = e.target.value || null;
        n.updatedAt = new Date().toISOString();
        await saveNotes(notes);
        drawDetail(n, null);
      });
    }
    const clearBtn = document.getElementById('clear-deadline');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        n.deadline = null;
        n.updatedAt = new Date().toISOString();
        await saveNotes(notes);
        drawDetail(n, null);
      });
    }
  }

  // ── List view ──
  function draw(status) {
    // If editing a note, show detail view
    if (editingNote) { drawDetail(editingNote, status); return; }

    const providerLabel = authMode === 'oauth' ? 'ChatGPT' : provider === 'claude' ? 'Claude' : 'OpenAI';
    const todayItems = getTodayItems(notes);
    const overdueCount = notes.filter(n => n.deadline && n.deadline < getTodayStr() && (n.status || 'active') !== 'done').length;

    let statusHtml = '';
    if (status === 'organizing') {
      statusHtml = '<div class="status organizing"><div class="spinner"></div> AI classifying...</div>';
    } else if (status?.startsWith('error:')) {
      statusHtml = `<div class="status error">${escHtml(status.slice(6))}</div>`;
    } else if (status === 'saved') {
      statusHtml = '<div class="status success">Saved & classified!</div>';
    }

    // Build note item HTML with click-to-edit
    function noteItemHtml(n, showDelete, deleteIdx) {
      return `
        <div class="note-item" data-edit-id="${n.id}" style="cursor:pointer;">
          ${n.itemType === 'task' ? `<button class="check ${n.status === 'done' ? 'checked' : ''}" data-complete="${n.id}"></button>` : `<span class="type-icon">${TYPE_ICONS[n.itemType || 'note']}</span>`}
          <div class="item-body">
            <div class="note-content ${n.status === 'done' ? 'done' : ''}">${escHtml(n.content)}</div>
            <div class="note-meta">
              ${priorityBadge(n.priority)}
              ${deadlineBadge(n.deadline)}
              ${n.category ? `<span class="note-category">${n.category}</span>` : ''}
              ${n.tags?.map(t => `<span class="note-tag">#${t}</span>`).join('') || ''}
              <span class="note-time">${timeAgo(n.createdAt)}</span>
              ${showDelete ? `<button class="note-delete" data-idx="${deleteIdx}" title="Delete">&times;</button>` : ''}
            </div>
          </div>
        </div>`;
    }

    let contentHtml = '';
    if (currentTab === 'today') {
      if (todayItems.length === 0) {
        contentHtml = '<div class="empty">✨ All clear today</div>';
      } else {
        contentHtml = `<div class="section-label">Today's Focus${overdueCount > 0 ? ` <span class="badge badge-overdue">${overdueCount} overdue</span>` : ''}</div>`;
        contentHtml += todayItems.map(n => noteItemHtml(n, false, 0)).join('');
      }
    } else {
      const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
      if (sorted.length === 0) {
        contentHtml = '<div class="empty">No notes yet. Start capturing!</div>';
      } else {
        contentHtml = `<div class="section-label">All Notes (${notes.length})</div>`;
        contentHtml += sorted.map((n, i) => noteItemHtml(n, true, i)).join('');
      }
    }

    app.innerHTML = `
      <div class="header">
        <h1>⚡ Right Now</h1>
        <span class="provider" id="change-key">${providerLabel} ▾</span>
      </div>
      <div class="tab-bar">
        <button class="tab ${currentTab === 'today' ? 'active' : ''}" data-tab="today">Today${overdueCount > 0 ? ` <span class="tab-badge-red">${overdueCount}</span>` : ''}</button>
        <button class="tab ${currentTab === 'notes' ? 'active' : ''}" data-tab="notes">Notes</button>
      </div>
      <div class="editor">
        <textarea id="note-input" placeholder="What's on your mind?" rows="2"></textarea>
        <div class="editor-actions">
          <span class="editor-hint">Ctrl+Enter to save</span>
          <button class="btn btn-primary" id="save-note" disabled>Save</button>
        </div>
      </div>
      ${statusHtml}
      ${contentHtml}
    `;

    // Bind events
    const textarea = document.getElementById('note-input');
    const saveBtn = document.getElementById('save-note');
    textarea.addEventListener('input', () => { saveBtn.disabled = !textarea.value.trim(); });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && textarea.value.trim()) { e.preventDefault(); handleSave(); }
    });
    saveBtn.addEventListener('click', handleSave);

    document.getElementById('change-key').addEventListener('click', async () => {
      await clearAuth();
      renderSetup(provider !== 'chatgpt-oauth' ? provider : 'claude');
    });

    // Tab switching
    app.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => { currentTab = btn.dataset.tab; draw(null); });
    });

    // Click to edit
    app.querySelectorAll('[data-edit-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-complete]') || e.target.closest('.note-delete')) return;
        const id = el.dataset.editId;
        const n = notes.find(x => x.id === id);
        if (n) { editingNote = n; drawDetail(n, null); }
      });
    });

    // Complete buttons
    app.querySelectorAll('[data-complete]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.complete;
        const n = notes.find(x => x.id === id);
        if (n && n.status !== 'done') {
          n.status = 'done'; n.completedAt = new Date().toISOString(); n.updatedAt = new Date().toISOString();
          await saveNotes(notes); draw(null);
        }
      });
    });

    // Delete buttons
    app.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const noteId = sorted[idx]?.id;
        if (!noteId) return;
        const i = notes.findIndex(n => n.id === noteId);
        if (i >= 0) { notes.splice(i, 1); await saveNotes(notes); draw(null); }
      });
    });

    textarea.focus();
  }

  async function handleSave() {
    const textarea = document.getElementById('note-input');
    const content = textarea.value.trim();
    if (!content) return;

    const now = new Date().toISOString();
    const note = {
      id: crypto.randomUUID(),
      content,
      tags: [],
      category: null,
      itemType: 'note',
      priority: null,
      deadline: null,
      status: 'inbox',
      scheduledDate: null,
      completedAt: null,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };

    notes.unshift(note);
    await saveNotes(notes);
    draw('organizing');

    const result = await organizeNote(authMode, apiKey, provider, content);
    if (result && !result.error) {
      note.tags = result.tags || [];
      note.category = result.category || null;
      if (result.type) note.itemType = result.type;
      if (result.priority) note.priority = result.priority;
      if (result.deadline) note.deadline = result.deadline;
      if (result.suggestedSchedule) note.scheduledDate = result.suggestedSchedule;
      if (result.type === 'task' || result.deadline) note.status = 'active';
      note.updatedAt = new Date().toISOString();
      await saveNotes(notes);
      draw('saved');
      setTimeout(() => draw(null), 2000);
    } else if (result?.error) {
      draw(`error:${result.error}`);
      setTimeout(() => draw(null), 4000);
    } else {
      draw(null);
    }
  }

  draw(null);
}

// ── Init ──

(async () => {
  // 1. Check if there's a pending OAuth flow to resume
  const oauthResult = await resumeOAuthIfPending();
  if (oauthResult) {
    if (oauthResult.success) {
      // OAuth completed! Save config and go to main
      await saveOAuthConfig();
      renderMain('oauth', null, 'chatgpt-oauth');
      return;
    }
    if (oauthResult.waiting) {
      // User reopened popup but hasn't finished login yet
      // Show setup with a "waiting" message
      renderSetup();
      return;
    }
    if (oauthResult.error) {
      // OAuth failed — show setup with error
      renderSetup();
      return;
    }
  }

  // 2. Check existing auth
  const { apiKey, provider, authMode } = await getAuthConfig();

  if (authMode === 'oauth') {
    const tokens = await getValidToken();
    if (tokens) {
      renderMain('oauth', null, 'chatgpt-oauth');
      return;
    }
  }

  if (apiKey) {
    renderMain('apikey', apiKey, provider);
  } else {
    renderSetup();
  }
})();
