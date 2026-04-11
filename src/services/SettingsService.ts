const API_KEY_KEY = 'rightnow_api_key';

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key);
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_KEY);
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return key !== null && key.length > 0;
}

export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
