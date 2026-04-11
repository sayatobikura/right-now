interface TagFilterProps {
  tags: string[];
  categories: string[];
  selectedTag: string | null;
  selectedCategory: string | null;
  onTagSelect: (tag: string | null) => void;
  onCategorySelect: (category: string | null) => void;
}

export default function TagFilter({
  tags,
  categories,
  selectedTag,
  selectedCategory,
  onTagSelect,
  onCategorySelect,
}: TagFilterProps) {
  if (tags.length === 0 && categories.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCategorySelect(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-accent text-white'
                : 'bg-surface-1 text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategorySelect(selectedCategory === cat ? null : cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-surface-1 text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedTag === tag
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
