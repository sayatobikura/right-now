// Background service worker
// Listens for OAuth callback redirects to localhost and relays the auth code

const OAUTH_REDIRECT_BASE = 'http://localhost:19284/auth/callback';

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;
  if (!changeInfo.url.startsWith(OAUTH_REDIRECT_BASE)) return;

  const url = new URL(changeInfo.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDesc = url.searchParams.get('error_description');

  // Store the result so the popup can pick it up
  chrome.storage.local.set({
    oauth_callback: { code, state, error, errorDescription: errorDesc, timestamp: Date.now() },
  });

  // Close the OAuth tab
  chrome.tabs.remove(tabId);
});
