// ── Storage helpers ──

const KEYS = {
  apiKey: 'rightnow_api_key',
  provider: 'rightnow_provider',
  notes: 'rightnow_notes',
};

async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorage(data) {
  return chrome.storage.local.set(data);
}

async function getApiKey() {
  const data = await getStorage([KEYS.apiKey, KEYS.provider]);
  return {
    apiKey: data[KEYS.apiKey] || null,
    provider: data[KEYS.provider] || 'claude',
  };
}

async function saveApiKey(apiKey, provider) {
  await setStorage({ [KEYS.apiKey]: apiKey, [KEYS.provider]: provider });
}

async function getNotes() {
  const data = await getStorage([KEYS.notes]);
  return data[KEYS.notes] || [];
}

async function saveNotes(notes) {
  await setStorage({ [KEYS.notes]: notes });
}

// ── AI Service ──

const ORGANIZE_PROMPT = `You are a note organization assistant. Given a note's content, suggest relevant tags and a category.

Rules:
- Tags: 1-5 short lowercase tags (e.g., "meeting", "idea", "shopping")
- Category: exactly one of: "work", "personal", "ideas", "journal", "reference", "learning"

Respond with ONLY valid JSON:
{ "tags": ["tag1", "tag2"], "category": "work" }`;

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
      max_tokens: 256,
      system: ORGANIZE_PROMPT,
      messages: [{ role: 'user', content: `Note content:\n${content}` }],
    }),
  });
  if (!resp.ok) throw new Error(`Claude API error (${resp.status})`);
  const data = await resp.json();
  const block = data.content?.find((b) => b.type === 'text');
  return block?.text || '';
}

async function callOpenAI(apiKey, content) {
  let resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 256,
      messages: [
        { role: 'system', content: ORGANIZE_PROMPT },
        { role: 'user', content: `Note content:\n${content}` },
      ],
    }),
  });
  // Retry once on rate limit
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
        max_tokens: 256,
        messages: [
          { role: 'system', content: ORGANIZE_PROMPT },
          { role: 'user', content: `Note content:\n${content}` },
        ],
      }),
    });
  }
  if (!resp.ok) throw new Error(`OpenAI API error (${resp.status})`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function organizeNote(apiKey, provider, content) {
  try {
    const text = provider === 'openai'
      ? await callOpenAI(apiKey, content)
      : await callClaude(apiKey, content);
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

// ── Render ──

const app = document.getElementById('app');

function renderSetup(savedProvider) {
  let provider = savedProvider || 'claude';
  const prefixes = { claude: 'sk-ant-', openai: 'sk-' };
  const placeholders = { claude: 'sk-ant-...', openai: 'sk-...' };
  const helpUrls = {
    claude: 'https://console.anthropic.com/',
    openai: 'https://platform.openai.com/api-keys',
  };

  function draw() {
    app.innerHTML = `
      <div class="setup">
        <h2>⚡ Right Now</h2>
        <p>Choose your AI provider and enter your API key</p>
        <div class="setup-providers">
          <button data-p="claude" class="${provider === 'claude' ? 'active' : ''}">Claude</button>
          <button data-p="openai" class="${provider === 'openai' ? 'active' : ''}">ChatGPT</button>
        </div>
        <input type="password" id="key-input" placeholder="${placeholders[provider]}" />
        <div id="setup-error" style="color:var(--danger);font-size:11px;margin-bottom:8px;display:none;"></div>
        <button class="btn btn-primary" style="width:100%" id="save-btn">Get Started</button>
        <p class="help">Get a key at <a href="${helpUrls[provider]}" target="_blank">${helpUrls[provider].replace('https://', '')}</a></p>
      </div>
    `;

    app.querySelectorAll('[data-p]').forEach((btn) => {
      btn.addEventListener('click', () => {
        provider = btn.dataset.p;
        draw();
      });
    });

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
      await saveApiKey(key, provider);
      renderMain(key, provider);
    });
  }

  draw();
}

async function renderMain(apiKey, provider) {
  const notes = await getNotes();

  function draw(status) {
    const noteItems = notes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map((n, i) => `
        <div class="note-item">
          <div class="note-content">${escHtml(n.content)}</div>
          <div class="note-meta">
            ${n.category ? `<span class="note-category">${n.category}</span>` : ''}
            ${n.tags?.map((t) => `<span class="note-tag">#${t}</span>`).join('') || ''}
            <span class="note-time">${timeAgo(n.createdAt)}</span>
            <button class="note-delete" data-idx="${i}" title="Delete">&times;</button>
          </div>
        </div>
      `)
      .join('');

    let statusHtml = '';
    if (status === 'organizing') {
      statusHtml = '<div class="status organizing"><div class="spinner"></div> AI organizing...</div>';
    } else if (status?.startsWith('error:')) {
      statusHtml = `<div class="status error">${escHtml(status.slice(6))}</div>`;
    } else if (status === 'saved') {
      statusHtml = '<div class="status success">Note saved & organized!</div>';
    }

    app.innerHTML = `
      <div class="header">
        <h1>⚡ Right Now</h1>
        <span class="provider" id="change-key">${provider === 'claude' ? 'Claude' : 'ChatGPT'} ▾</span>
      </div>
      <div class="editor">
        <textarea id="note-input" placeholder="What's on your mind?" rows="3"></textarea>
        <div class="editor-actions">
          <span class="editor-hint">Ctrl+Enter to save</span>
          <button class="btn btn-primary" id="save-note" disabled>Save</button>
        </div>
      </div>
      ${statusHtml}
      ${notes.length > 0
        ? `<div class="notes-header">Recent (${notes.length})</div>${noteItems}`
        : '<div class="empty">No notes yet. Start capturing!</div>'
      }
    `;

    // Bind events
    const textarea = document.getElementById('note-input');
    const saveBtn = document.getElementById('save-note');

    textarea.addEventListener('input', () => {
      saveBtn.disabled = !textarea.value.trim();
    });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && textarea.value.trim()) {
        e.preventDefault();
        handleSave();
      }
    });
    saveBtn.addEventListener('click', handleSave);

    document.getElementById('change-key').addEventListener('click', () => {
      renderSetup(provider);
    });

    // Delete buttons
    app.querySelectorAll('.note-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const noteId = sorted[idx]?.id;
        if (!noteId) return;
        const i = notes.findIndex((n) => n.id === noteId);
        if (i >= 0) {
          notes.splice(i, 1);
          await saveNotes(notes);
          draw(null);
        }
      });
    });

    // Focus textarea
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
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };

    notes.unshift(note);
    await saveNotes(notes);
    draw('organizing');

    // AI organize
    const result = await organizeNote(apiKey, provider, content);
    if (result && !result.error) {
      note.tags = result.tags || [];
      note.category = result.category || null;
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

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ──

(async () => {
  const { apiKey, provider } = await getApiKey();
  if (apiKey) {
    renderMain(apiKey, provider);
  } else {
    renderSetup();
  }
})();
