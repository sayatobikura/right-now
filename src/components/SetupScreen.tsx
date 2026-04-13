import { useState } from 'react';
import type { AIProvider } from '../types';

interface SetupScreenProps {
  onSave: (key: string, provider: AIProvider) => void;
  onGoogleSignIn?: () => void;
  isFirebaseConfigured: boolean;
  authError?: string | null;
}

const PROVIDERS: { value: AIProvider; label: string; placeholder: string; prefix: string; helpUrl: string; helpLabel: string }[] = [
  {
    value: 'claude',
    label: 'Claude (Anthropic)',
    placeholder: 'sk-ant-...',
    prefix: 'sk-ant-',
    helpUrl: 'https://console.anthropic.com/',
    helpLabel: 'console.anthropic.com',
  },
  {
    value: 'openai',
    label: 'ChatGPT (OpenAI)',
    placeholder: 'sk-...',
    prefix: 'sk-',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'platform.openai.com',
  },
];

export default function SetupScreen({ onSave, onGoogleSignIn, isFirebaseConfigured, authError }: SetupScreenProps) {
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const config = PROVIDERS.find((p) => p.value === provider)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter an API key');
      return;
    }
    if (!trimmed.startsWith(config.prefix)) {
      setError(`API key should start with ${config.prefix}`);
      return;
    }
    onSave(trimmed, provider);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-1 rounded-2xl p-8 w-full max-w-md border border-border">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold mb-2">Right Now</h1>
          <p className="text-text-secondary text-sm">
            Sign in and choose your AI provider
          </p>
        </div>

        {/* Google Sign-In */}
        {isFirebaseConfigured && onGoogleSignIn && (
          <div className="mb-6">
            <button
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-surface-1 hover:bg-surface-2 text-text-primary font-medium rounded-lg py-2.5 transition-colors border border-border"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
              Sign in with Google
            </button>
            {authError && (
              <p className="text-danger text-xs mt-1.5 text-center">{authError}</p>
            )}

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-tertiary">then enter your AI key</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider selector */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              AI Provider
            </label>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setProvider(p.value);
                    setKey('');
                    setError('');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    provider === p.value
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* API key input */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              API Key
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError('');
                }}
                placeholder={config.placeholder}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary text-xs"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
            {error && (
              <p className="text-danger text-xs mt-1.5">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent-hover text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            Get Started
          </button>
        </form>

        <p className="text-text-tertiary text-xs text-center mt-6">
          Get a key at{' '}
          <a
            href={config.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover underline"
          >
            {config.helpLabel}
          </a>
          . Your key stays in your browser.
        </p>
      </div>
    </div>
  );
}
