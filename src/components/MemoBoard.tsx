import { useState } from 'react';
import type { MemoNote } from '../types';
import { useMemos } from '../hooks/useTrip';

interface MemoBoardProps {
  canEdit: boolean;
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function MemoForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<MemoNote>;
  onSubmit: (data: Omit<MemoNote, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        url: url.trim() || undefined,
        tags,
        memo: memo.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">{initial?.id ? '메모 수정' : '메모 추가'}</h3>

      {/* Title */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="메모 제목을 입력하세요"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">URL 링크</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">태그</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColor(tag)}`}>
              #{tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-60">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="태그 입력 후 Enter"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim()}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-40"
          >
            추가
          </button>
        </div>
      </div>

      {/* Memo */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">메모</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={4}
          placeholder="내용을 자유롭게 입력하세요"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? '저장 중...' : initial?.id ? '수정' : '추가'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function MemoCard({
  item,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: MemoNote;
  canEdit: boolean;
  onEdit: (item: MemoNote) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 leading-snug">{item.title}</h3>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 truncate"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate">{item.url}</span>
            </a>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => { if (window.confirm('삭제하시겠습니까?')) onDelete(item.id); }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColor(tag)}`}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Memo text */}
      {item.memo && (
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-3">
          {item.memo}
        </p>
      )}
    </div>
  );
}

export function MemoBoard({ canEdit }: MemoBoardProps) {
  const { items, addItem, updateItem, deleteItem } = useMemos();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<MemoNote | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(items.flatMap((i) => i.tags)));

  const filtered = filterTag ? items.filter((i) => i.tags.includes(filterTag)) : items;

  const handleEdit = (item: MemoNote) => {
    setEditTarget(item);
    setShowForm(false);
  };

  const handleUpdate = async (data: Omit<MemoNote, 'id' | 'createdAt'>) => {
    if (!editTarget) return;
    await updateItem(editTarget.id, data);
    setEditTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterTag === null
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterTag === tag
                  ? `${tagColor(tag)} ring-2 ring-offset-1 ring-current`
                  : `${tagColor(tag)} opacity-60 hover:opacity-100`
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Edit form */}
      {editTarget && (
        <MemoForm
          initial={editTarget}
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <MemoCard
            key={item.id}
            item={item}
            canEdit={canEdit}
            onEdit={handleEdit}
            onDelete={deleteItem}
          />
        ))}
      </div>

      {filtered.length === 0 && !showForm && !editTarget && (
        <div className="text-center py-10 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">{filterTag ? `#${filterTag} 태그 메모가 없습니다` : '등록된 메모가 없습니다'}</p>
        </div>
      )}

      {/* Add form */}
      {canEdit && (
        showForm ? (
          <MemoForm
            onSubmit={async (data) => { await addItem(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            onClick={() => { setShowForm(true); setEditTarget(null); }}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            메모 추가
          </button>
        )
      )}
    </div>
  );
}
