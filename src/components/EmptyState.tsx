export default function EmptyState() {
  return (
    <div className="text-center py-16">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="mx-auto mb-4 text-text-tertiary"
      >
        <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M22 20h20M22 28h20M22 36h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 className="text-lg font-medium text-text-primary mb-1">No notes yet</h3>
      <p className="text-sm text-text-tertiary">
        Start capturing your thoughts — AI will organize them for you
      </p>
    </div>
  );
}
