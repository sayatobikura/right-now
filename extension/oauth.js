// OpenAI OAuth — PKCE flow for ChatGPT subscribers
// Matches Quill's implementation exactly (src-tauri/src/ai/oauth.rs)

const OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OAUTH_AUTH_URL = 'https://auth.openai.com/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const OAUTH_SCOPE = 'openid profile email offline_access';
const OAUTH_REDIRECT_URI = 'http://localhost:1455/auth/callback';

const OAUTH_KEYS = {
  accessToken: 'oauth_access_token',
  refreshToken: 'oauth_refresh_token',
  expiresAt: 'oauth_expires_at',
  accountId: 'oauth_account_id',
};

// ── PKCE helpers ──

function base64UrlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier() {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

async function generateCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

// ── JWT decode ──

function decodeJwtAccountId(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload['https://api.openai.com/auth']?.['chatgpt_account_id'] || null;
  } catch {
    return null;
  }
}

// ── Token storage ──

async function getOAuthTokens() {
  const data = await chrome.storage.local.get(Object.values(OAUTH_KEYS));
  return {
    accessToken: data[OAUTH_KEYS.accessToken] || null,
    refreshToken: data[OAUTH_KEYS.refreshToken] || null,
    expiresAt: data[OAUTH_KEYS.expiresAt] || 0,
    accountId: data[OAUTH_KEYS.accountId] || null,
  };
}

async function saveOAuthTokens(accessToken, refreshToken, expiresIn) {
  const expiresAt = Date.now() + (expiresIn || 3600) * 1000;
  const accountId = decodeJwtAccountId(accessToken);
  await chrome.storage.local.set({
    [OAUTH_KEYS.accessToken]: accessToken,
    [OAUTH_KEYS.refreshToken]: refreshToken,
    [OAUTH_KEYS.expiresAt]: expiresAt,
    [OAUTH_KEYS.accountId]: accountId,
  });
  return { accessToken, refreshToken, expiresAt, accountId };
}

async function clearOAuthTokens() {
  await chrome.storage.local.remove([...Object.values(OAUTH_KEYS), 'oauth_callback']);
}

// ── OAuth flow (tab-based, matching Quill's build_auth_url exactly) ──

// Start OAuth: save state to storage and open auth tab.
// The popup will close when the tab opens — that's fine.
// When the user reopens the popup, resumeOAuthIfPending() picks up.
async function startOAuthLogin() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const stateBytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(stateBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Persist PKCE verifier + state so we can resume after popup reopens
  await chrome.storage.local.set({
    oauth_pending: { codeVerifier, state, startedAt: Date.now() },
  });
  await chrome.storage.local.remove(['oauth_callback']);

  const params = new URLSearchParams();
  params.set('response_type', 'code');
  params.set('client_id', OAUTH_CLIENT_ID);
  params.set('redirect_uri', OAUTH_REDIRECT_URI);
  params.set('scope', OAUTH_SCOPE);
  params.set('state', state);
  params.set('code_challenge', codeChallenge);
  params.set('code_challenge_method', 'S256');
  params.set('id_token_add_organizations', 'true');
  params.set('codex_cli_simplified_flow', 'true');
  params.set('originator', 'quill');

  await chrome.tabs.create({ url: `${OAUTH_AUTH_URL}?${params}` });
  // Popup will close here — flow continues in resumeOAuthIfPending()
}

// Called when popup opens. Checks if there's a pending OAuth flow
// with a callback ready from background.js.
async function resumeOAuthIfPending() {
  const data = await chrome.storage.local.get(['oauth_pending', 'oauth_callback']);
  const pending = data.oauth_pending;
  const cb = data.oauth_callback;

  if (!pending) return null; // No pending OAuth flow

  // Check if callback hasn't arrived yet (user might reopen popup before finishing login)
  if (!cb) {
    // Check if it's been too long (2 minutes)
    if (Date.now() - pending.startedAt > 120_000) {
      await chrome.storage.local.remove(['oauth_pending']);
      return { error: 'Login timed out. Please try again.' };
    }
    return { waiting: true }; // Still waiting for user to complete login
  }

  // Callback arrived — clean up and process
  await chrome.storage.local.remove(['oauth_pending', 'oauth_callback']);

  if (cb.error) {
    return { error: cb.errorDescription || cb.error };
  }
  if (cb.state !== pending.state) {
    return { error: 'State mismatch. Please try again.' };
  }
  if (!cb.code) {
    return { error: 'No auth code received.' };
  }

  try {
    const tokens = await exchangeCode(cb.code, pending.codeVerifier);
    return { success: true, tokens };
  } catch (err) {
    return { error: err.message };
  }
}

// Token exchange — Quill uses form-encoded POST (not JSON)
async function exchangeCode(code, codeVerifier) {
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', OAUTH_CLIENT_ID);
  body.set('code', code);
  body.set('code_verifier', codeVerifier);
  body.set('redirect_uri', OAUTH_REDIRECT_URI);

  const resp = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return saveOAuthTokens(data.access_token, data.refresh_token, data.expires_in);
}

// Token refresh — also form-encoded
async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('client_id', OAUTH_CLIENT_ID);
  body.set('refresh_token', refreshToken);

  const resp = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) throw new Error(`Token refresh failed (${resp.status})`);

  const data = await resp.json();
  return saveOAuthTokens(data.access_token, data.refresh_token || refreshToken, data.expires_in);
}

async function getValidToken() {
  const tokens = await getOAuthTokens();
  if (!tokens.accessToken) return null;

  if (Date.now() > tokens.expiresAt - 60_000) {
    if (!tokens.refreshToken) return null;
    try {
      return await refreshAccessToken(tokens.refreshToken);
    } catch {
      await clearOAuthTokens();
      return null;
    }
  }

  return tokens;
}

// ── ChatGPT API call via OAuth ──
// Uses /responses endpoint (same as Quill's openai_responses.rs)

const ORGANIZE_PROMPT_TEXT = `You are a note organization assistant. Given a note's content, suggest relevant tags and a category.

Rules:
- Tags: 1-5 short lowercase tags (e.g., "meeting", "idea", "shopping")
- Category: exactly one of: "work", "personal", "ideas", "journal", "reference", "learning"

Respond with ONLY valid JSON:
{ "tags": ["tag1", "tag2"], "category": "work" }`;

async function callChatGPTOAuth(content) {
  const tokens = await getValidToken();
  if (!tokens) throw new Error('Not logged in. Please sign in with ChatGPT.');

  const resp = await fetch('https://chatgpt.com/backend-api/codex/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.accessToken}`,
      ...(tokens.accountId ? { 'chatgpt-account-id': tokens.accountId } : {}),
    },
    body: JSON.stringify({
      model: 'gpt-5.3-codex',
      instructions: ORGANIZE_PROMPT_TEXT,
      input: [{ role: 'user', content: `Note content:\n${content}` }],
      stream: true,
      store: false,
    }),
  });

  if (resp.status === 401) {
    await clearOAuthTokens();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    throw new Error(`ChatGPT API error (${resp.status}): ${errBody.slice(0, 200)}`);
  }

  // Parse SSE stream to extract the full response text
  const text = await resp.text();
  let result = '';
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    try {
      const parsed = JSON.parse(line.slice(6));
      if (parsed.type === 'response.output_text.delta' && parsed.delta) {
        result += parsed.delta;
      }
    } catch {
      // skip non-JSON lines
    }
  }
  return result;
}
