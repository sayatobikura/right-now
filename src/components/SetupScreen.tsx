import { useState } from 'react';
import type { AIProvider } from '../types';

interface SetupScreenProps {
  onSave: (key: string, provider: AIProvider) => void;
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

export default function SetupScreen({ onSave }: SetupScreenProps) {
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
            Choose your AI provider and enter your API key
          </p>
        </div>

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
