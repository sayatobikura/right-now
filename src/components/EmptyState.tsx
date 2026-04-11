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
        <rect x="16" y="8" width="32" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M24 22h16M24 30h16M24 38h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="48" cy="48" r="12" fill="var(--surface-1)" stroke="currentColor" strokeWidth="2" />
        <path d="M48 42v12M42 48h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 className="text-lg font-medium text-text-primary mb-1">Nothing on your plate</h3>
      <p className="text-sm text-text-tertiary">
        Add your first task above and let AI help you focus
      </p>
    </div>
  );
}
