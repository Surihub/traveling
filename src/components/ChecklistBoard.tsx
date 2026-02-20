import { useState } from 'react';
import type { ChecklistItem } from '../types';
import { useChecklist } from '../hooks/useTrip';

interface ChecklistBoardProps {
  canEdit: boolean;
}

function ChecklistForm({ onSubmit, onCancel }: {
  onSubmit: (data: Omit<ChecklistItem, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [item, setItem] = useState('');
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ item, purpose, isReady: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">체크리스트 항목 추가</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">항목 *</label>
          <input type="text" value={item} onChange={e => setItem(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="여권" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">용도</label>
          <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="필수서류" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving || !item.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">
          {saving ? '저장 중...' : '추가'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
          취소
        </button>
      </div>
    </form>
  );
}

export function ChecklistBoard({ canEdit }: ChecklistBoardProps) {
  const { items, addItem, updateItem, deleteItem } = useChecklist();
  const [showForm, setShowForm] = useState(false);

  const readyCount = items.filter(i => i.isReady).length;
  const progress = items.length > 0 ? Math.round((readyCount / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">준비 진행률</span>
            <span className="text-sm font-bold text-emerald-600">{readyCount}/{items.length} ({progress}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id}
            className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-3 ${item.isReady ? 'opacity-60' : ''}`}
          >
            {/* Checkbox */}
            {canEdit && (
              <button
                onClick={() => updateItem(item.id, { isReady: !item.isReady })}
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.isReady ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                }`}
              >
                {item.isReady && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <span className={`font-medium text-gray-800 ${item.isReady ? 'line-through' : ''}`}>
                {item.item}
              </span>
              {item.purpose && (
                <span className="ml-2 text-xs text-gray-400">{item.purpose}</span>
              )}
            </div>

            {canEdit && (
              <button
                onClick={() => { if (window.confirm('삭제하시겠습니까?')) deleteItem(item.id); }}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <p>등록된 체크리스트 항목이 없습니다</p>
        </div>
      )}

      {canEdit && (
        showForm ? (
          <ChecklistForm
            onSubmit={async (data) => { await addItem(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-400 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            체크리스트 항목 추가
          </button>
        )
      )}
    </div>
  );
}
