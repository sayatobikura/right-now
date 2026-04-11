import { useState } from 'react';

export default function SetupScreen({ onSave }: { onSave: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter an API key');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with sk-ant-');
      return;
    }
    onSave(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-1 rounded-2xl p-8 w-full max-w-md border border-border">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold mb-2">Right Now</h1>
          <p className="text-text-secondary text-sm">
            Enter your Claude API key to enable AI-powered task prioritization
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Claude API Key
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError('');
                }}
                placeholder="sk-ant-..."
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
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover underline"
          >
            console.anthropic.com
          </a>
          . Your key stays in your browser.
        </p>
      </div>
    </div>
  );
}
