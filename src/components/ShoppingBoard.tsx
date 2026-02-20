import { useState } from 'react';
import type { ShoppingItem } from '../types';
import { useShopping } from '../hooks/useTrip';

interface ShoppingBoardProps {
  canEdit: boolean;
}

function ShoppingForm({ onSubmit, onCancel }: {
  onSubmit: (data: Omit<ShoppingItem, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name, city,
        memo: memo || undefined,
        isPurchased: false,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">쇼핑 아이템 추가</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">브랜드/아이템 *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="구찌 벨트" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">도시</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="피렌체" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">메모</label>
        <textarea value={memo} onChange={e => setMemo(e.target.value)}
          rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="매장 위치, 가격 등" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving || !name.trim()}
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

export function ShoppingBoard({ canEdit }: ShoppingBoardProps) {
  const { items, addItem, updateItem, deleteItem } = useShopping();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'purchased' | 'pending'>('all');

  const filteredItems = items.filter(item => {
    if (filter === 'purchased') return item.isPurchased;
    if (filter === 'pending') return !item.isPurchased;
    return true;
  });

  const purchasedCount = items.filter(i => i.isPurchased).length;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <button onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-rose-100 text-rose-700 border-2 border-rose-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
          전체 ({items.length})
        </button>
        <button onClick={() => setFilter('pending')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
          미구매
        </button>
        <button onClick={() => setFilter('purchased')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'purchased' ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
          구매완료 ({purchasedCount})
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filteredItems.map(item => (
          <div key={item.id}
            className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-3 ${item.isPurchased ? 'opacity-60' : ''}`}
          >
            {/* Checkbox */}
            {canEdit && (
              <button
                onClick={() => updateItem(item.id, { isPurchased: !item.isPurchased })}
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.isPurchased ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {item.isPurchased && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium text-gray-800 ${item.isPurchased ? 'line-through' : ''}`}>
                  {item.name}
                </span>
                {item.city && (
                  <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">{item.city}</span>
                )}
              </div>
              {item.memo && (
                <p className="text-sm text-gray-500 mt-1">{item.memo}</p>
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

      {filteredItems.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <p>{filter === 'all' ? '등록된 쇼핑 아이템이 없습니다' : filter === 'purchased' ? '구매 완료된 아이템이 없습니다' : '미구매 아이템이 없습니다'}</p>
        </div>
      )}

      {canEdit && (
        showForm ? (
          <ShoppingForm
            onSubmit={async (data) => { await addItem(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-rose-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            쇼핑 아이템 추가
          </button>
        )
      )}
    </div>
  );
}
