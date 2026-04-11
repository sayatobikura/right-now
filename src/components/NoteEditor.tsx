import { useState, useRef, useEffect } from 'react';

interface NoteEditorProps {
  onAdd: (content: string) => void;
}

export default function NoteEditor({ onAdd }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setContent('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setContent('');
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-surface-1 rounded-xl border border-border px-4 py-3 text-left text-text-tertiary text-sm hover:border-accent transition-colors"
      >
        Take a note...
      </button>
    );
  }

  return (
    <div className="bg-surface-1 rounded-xl border border-accent p-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind?"
        rows={3}
        className="w-full bg-transparent text-text-primary placeholder:text-text-tertiary text-sm resize-none focus:outline-none"
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-text-tertiary">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to save
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsExpanded(false);
              setContent('');
            }}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
