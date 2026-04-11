import { useState } from 'react';
import type { Note, AIConnectionResult } from '../types';

interface NoteDetailProps {
  note: Note;
  connections: AIConnectionResult[];
  isLoadingConnections: boolean;
  allNotes: Note[];
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onFindConnections: (note: Note) => void;
  onClose: () => void;
}

export default function NoteDetail({
  note,
  connections,
  isLoadingConnections,
  allNotes,
  onUpdate,
  onFindConnections,
  onClose,
}: NoteDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== note.content) {
      onUpdate(note.id, { content: trimmed });
    }
    setIsEditing(false);
  };

  const connectedNotes = connections
    .map((c) => {
      const n = allNotes.find((an) => an.id === c.noteId);
      return n ? { note: n, reason: c.reason } : null;
    })
    .filter(Boolean) as { note: Note; reason: string }[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-1 rounded-2xl border border-border w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {note.category && (
              <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-medium">
                {note.category}
              </span>
            )}
            <span className="text-xs text-text-tertiary">
              {new Date(note.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditContent(note.content);
                  setIsEditing(false);
                }}
                className="text-text-secondary hover:text-text-primary text-xs px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-sm text-text-primary whitespace-pre-wrap mb-4 cursor-text hover:bg-surface-2/50 rounded-lg p-2 -m-2 transition-colors"
          >
            {note.content}
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {note.tags.map((tag) => (
              <span key={tag} className="bg-surface-2 text-text-tertiary text-xs px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Connections */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-text-secondary">Related Notes</h4>
            <button
              onClick={() => onFindConnections(note)}
              disabled={isLoadingConnections}
              className="text-xs text-accent hover:text-accent-hover disabled:opacity-40 transition-colors"
            >
              {isLoadingConnections ? 'Finding...' : 'Find connections'}
            </button>
          </div>

          {connectedNotes.length > 0 ? (
            <div className="space-y-2">
              {connectedNotes.map(({ note: cn, reason }) => (
                <div key={cn.id} className="bg-surface-2 rounded-lg p-3">
                  <p className="text-xs text-text-primary line-clamp-2">{cn.content}</p>
                  <p className="text-[10px] text-text-tertiary italic mt-1">{reason}</p>
                </div>
              ))}
            </div>
          ) : (
            !isLoadingConnections && (
              <p className="text-xs text-text-tertiary">
                Click "Find connections" to discover related notes
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
