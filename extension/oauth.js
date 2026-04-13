// OpenAI OAuth — PKCE flow for ChatGPT subscribers
// Uses the same public client as Codex CLI, with localhost redirect

const OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OAUTH_AUTH_URL = 'https://auth.openai.com/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const OAUTH_SCOPE = 'openid profile email offline_access';
const OAUTH_RESOURCE = 'https://api.openai.com/v1';
const OAUTH_REDIRECT_URI = 'http://localhost:19284/auth/callback';

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

// ── OAuth flow (tab-based) ──

async function startOAuthLogin() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));

  // Clear any previous callback data
  await chrome.storage.local.remove(['oauth_callback']);

  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: OAUTH_SCOPE,
    resource: OAUTH_RESOURCE,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    id_token_add_organizations: 'true',
    codex_cli_simplified_flow: 'true',
  });

  // Open auth page in a new tab
  await chrome.tabs.create({ url: `${OAUTH_AUTH_URL}?${params}` });

  // Poll for the callback result (background.js writes it when redirect happens)
  const code = await waitForCallback(state, 120_000);

  // Exchange code for tokens
  return exchangeCode(code, codeVerifier);
}

function waitForCallback(expectedState, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = async () => {
      const data = await chrome.storage.local.get(['oauth_callback']);
      const cb = data.oauth_callback;

      if (cb && cb.timestamp > start - 1000) {
        await chrome.storage.local.remove(['oauth_callback']);

        if (cb.error) {
          reject(new Error(cb.errorDescription || cb.error));
          return;
        }
        if (cb.state !== expectedState) {
          reject(new Error('State mismatch'));
          return;
        }
        if (!cb.code) {
          reject(new Error('No auth code received'));
          return;
        }
        resolve(cb.code);
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('Login timed out. Please try again.'));
        return;
      }

      setTimeout(check, 500);
    };

    check();
  });
}

async function exchangeCode(code, codeVerifier) {
  const resp = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: OAUTH_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: OAUTH_REDIRECT_URI,
      resource: OAUTH_RESOURCE,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return saveOAuthTokens(data.access_token, data.refresh_token, data.expires_in);
}

async function refreshAccessToken(refreshToken) {
  const resp = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: OAUTH_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!resp.ok) throw new Error(`Token refresh failed (${resp.status})`);

  const data = await resp.json();
  return saveOAuthTokens(data.access_token, data.refresh_token || refreshToken, data.expires_in);
}

async function getValidToken() {
  const tokens = await getOAuthTokens();
  if (!tokens.accessToken) return null;

  // Refresh if expiring within 60 seconds
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

const ORGANIZE_PROMPT_TEXT = `You are a note organization assistant. Given a note's content, suggest relevant tags and a category.

Rules:
- Tags: 1-5 short lowercase tags (e.g., "meeting", "idea", "shopping")
- Category: exactly one of: "work", "personal", "ideas", "journal", "reference", "learning"

Respond with ONLY valid JSON:
{ "tags": ["tag1", "tag2"], "category": "work" }`;

async function callChatGPTOAuth(content) {
  const tokens = await getValidToken();
  if (!tokens) throw new Error('Not logged in. Please sign in with ChatGPT.');

  const resp = await fetch('https://chatgpt.com/backend-api/codex', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.accessToken}`,
      ...(tokens.accountId ? { 'chatgpt-account-id': tokens.accountId } : {}),
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      store: false,
      instructions: ORGANIZE_PROMPT_TEXT,
      input: [{ role: 'user', content: `Note content:\n${content}` }],
      stream: false,
    }),
  });

  if (resp.status === 401) {
    await clearOAuthTokens();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!resp.ok) throw new Error(`ChatGPT API error (${resp.status})`);

  const data = await resp.json();
  const textOutput = data.output?.find((o) => o.type === 'message')?.content?.find((c) => c.type === 'output_text');
  return textOutput?.text || '';
}
