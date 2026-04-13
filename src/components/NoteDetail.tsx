import { useState } from 'react';
import type { Note, AIConnectionResult, ItemType, Priority } from '../types';

interface NoteDetailProps {
  note: Note;
  connections: AIConnectionResult[];
  isLoadingConnections: boolean;
  isReorganizing: boolean;
  allNotes: Note[];
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onReorganize: (note: Note) => void;
  onFindConnections: (note: Note) => void;
  onClose: () => void;
}

const TYPES: ItemType[] = ['task', 'idea', 'tip', 'note'];
const PRIORITIES: (Priority | 'none')[] = ['high', 'medium', 'low', 'none'];
const CATEGORIES = ['work', 'personal', 'ideas', 'journal', 'reference', 'learning'];

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-priority-high/15 text-priority-high',
  medium: 'bg-priority-medium/15 text-[#c9a045]',
  low: 'bg-priority-low/15 text-[#5aa67e]',
};

const TYPE_ICONS: Record<string, string> = {
  task: '\u2611', idea: '\u{1F4A1}', tip: '\u2B50', note: '\u{1F4DD}',
};

export default function NoteDetail({
  note,
  connections,
  isLoadingConnections,
  isReorganizing,
  allNotes,
  onUpdate,
  onReorganize,
  onFindConnections,
  onClose,
}: NoteDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title ?? '');
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    const updates: Partial<Note> = {};
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();
    if (trimmedTitle !== (note.title ?? '')) updates.title = trimmedTitle || null;
    if (trimmedContent && trimmedContent !== note.content) updates.content = trimmedContent;
    if (Object.keys(updates).length > 0) onUpdate(note.id, updates);
    setIsEditing(false);
  };

  const handleSaveAndReorganize = () => {
    const trimmedContent = editContent.trim();
    if (!trimmedContent) return;
    const updates: Partial<Note> = {};
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle !== (note.title ?? '')) updates.title = trimmedTitle || null;
    if (trimmedContent !== note.content) updates.content = trimmedContent;
    if (Object.keys(updates).length > 0) onUpdate(note.id, updates);
    setIsEditing(false);
    onReorganize({ ...note, content: trimmedContent });
  };

  const connectedNotes = connections
    .map((c) => {
      const n = allNotes.find((an) => an.id === c.noteId);
      return n ? { note: n, reason: c.reason } : null;
    })
    .filter(Boolean) as { note: Note; reason: string }[];

  const isDone = note.status === 'done';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-surface-1 rounded-2xl border border-border w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">{TYPE_ICONS[note.itemType ?? 'note']}</span>
            <span className="text-xs text-text-tertiary capitalize">{note.itemType ?? 'note'}</span>
            {isDone && (
              <span className="bg-success/15 text-success text-[10px] font-medium px-1.5 py-0.5 rounded">Done</span>
            )}
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-4 space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title (short name)"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-medium text-text-primary focus:outline-none focus:border-accent"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              placeholder="Description / details"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text-secondary resize-none focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleSaveAndReorganize}
                disabled={isReorganizing}
                className="bg-surface-2 hover:bg-border text-text-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                {isReorganizing && <span className="w-2.5 h-2.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                Save & Re-organize
              </button>
              <button
                onClick={() => { setEditContent(note.content); setIsEditing(false); }}
                className="text-text-secondary hover:text-text-primary text-xs px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div
              onClick={() => setIsEditing(true)}
              className="cursor-text hover:bg-surface-2/50 rounded-lg p-2 -m-2 transition-colors"
            >
              {note.title && (
                <p className="text-sm font-medium text-text-primary mb-1">{note.title}</p>
              )}
              <p className={`whitespace-pre-wrap ${note.title ? 'text-xs text-text-secondary' : 'text-sm text-text-primary'}`}>
                {note.content}
              </p>
            </div>
            <button
              onClick={() => onReorganize(note)}
              disabled={isReorganizing}
              className="mt-2 text-[11px] text-accent hover:text-accent-hover disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              {isReorganizing && <span className="w-2.5 h-2.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
              Re-organize with AI
            </button>
          </div>
        )}

        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Type */}
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">Type</label>
            <div className="flex flex-wrap gap-1">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate(note.id, { itemType: t })}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    (note.itemType ?? 'note') === t
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {TYPE_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">Priority</label>
            <div className="flex flex-wrap gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdate(note.id, { priority: p === 'none' ? null : p })}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    (p === 'none' ? !note.priority : note.priority === p)
                      ? (p === 'none' ? 'bg-accent text-white' : PRIORITY_STYLE[p])
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">Category</label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdate(note.id, { category: c })}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                    note.category === c
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">Deadline</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={note.deadline ?? ''}
                onChange={(e) => onUpdate(note.id, { deadline: e.target.value || null })}
                className="bg-surface-2 border border-border rounded px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent"
              />
              {note.deadline && (
                <button
                  onClick={() => onUpdate(note.id, { deadline: null })}
                  className="text-[10px] text-text-tertiary hover:text-danger"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </div>

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

        {/* Timestamp + deadline reason */}
        <div className="text-[10px] text-text-tertiary mb-4 space-y-0.5">
          <div>Created {new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
          {note.completedAt && <div>Completed {new Date(note.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>}
        </div>

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
