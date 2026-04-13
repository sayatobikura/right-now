// OpenAI OAuth — PKCE flow for ChatGPT subscribers
// Uses the same public client as Codex CLI

const OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OAUTH_AUTH_URL = 'https://auth.openai.com/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const OAUTH_SCOPE = 'openai.chat.completions openai.responses openai.responses.stream';
const OAUTH_AUDIENCE = 'https://api.openai.com/v1';

const OAUTH_KEYS = {
  accessToken: 'oauth_access_token',
  refreshToken: 'oauth_refresh_token',
  expiresAt: 'oauth_expires_at',
  accountId: 'oauth_account_id',
};

// ── PKCE helpers ──

function generateRandomBytes(length) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

function base64UrlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier() {
  return base64UrlEncode(generateRandomBytes(32));
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

// ── JWT decode (extract account ID) ──

function decodeJwtAccountId(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
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
  await chrome.storage.local.remove(Object.values(OAUTH_KEYS));
}

// ── OAuth flow ──

async function startOAuthLogin() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = base64UrlEncode(generateRandomBytes(16));
  const redirectUrl = chrome.identity.getRedirectURL();

  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: redirectUrl,
    response_type: 'code',
    scope: OAUTH_SCOPE,
    audience: OAUTH_AUDIENCE,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
  });

  const authUrl = `${OAUTH_AUTH_URL}?${params.toString()}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!responseUrl) {
          reject(new Error('No response from auth flow'));
          return;
        }

        const url = new URL(responseUrl);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');

        if (returnedState !== state) {
          reject(new Error('State mismatch — possible CSRF'));
          return;
        }
        if (!code) {
          const err = url.searchParams.get('error_description') || url.searchParams.get('error') || 'No auth code';
          reject(new Error(err));
          return;
        }

        try {
          const tokens = await exchangeCode(code, codeVerifier, redirectUrl);
          resolve(tokens);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

async function exchangeCode(code, codeVerifier, redirectUri) {
  const resp = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: OAUTH_CLIENT_ID,
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
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

  if (!resp.ok) {
    throw new Error(`Token refresh failed (${resp.status})`);
  }

  const data = await resp.json();
  return saveOAuthTokens(
    data.access_token,
    data.refresh_token || refreshToken,
    data.expires_in
  );
}

async function getValidToken() {
  const tokens = await getOAuthTokens();
  if (!tokens.accessToken) return null;

  // Refresh if expiring within 60 seconds
  if (Date.now() > tokens.expiresAt - 60000) {
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

// ── ChatGPT API call (using OAuth token) ──

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
  // The codex endpoint returns in responses format
  const textOutput = data.output?.find((o) => o.type === 'message')?.content?.find((c) => c.type === 'output_text');
  return textOutput?.text || '';
}

// Expose the ORGANIZE_PROMPT for ChatGPT OAuth calls
const ORGANIZE_PROMPT_TEXT = `You are a note organization assistant. Given a note's content, suggest relevant tags and a category.

Rules:
- Tags: 1-5 short lowercase tags (e.g., "meeting", "idea", "shopping")
- Category: exactly one of: "work", "personal", "ideas", "journal", "reference", "learning"

Respond with ONLY valid JSON:
{ "tags": ["tag1", "tag2"], "category": "work" }`;
