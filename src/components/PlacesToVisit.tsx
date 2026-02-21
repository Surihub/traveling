import { useState } from 'react';
import type { Day, TripItem } from '../types';
import { useMemos, addDayItem } from '../hooks/useTrip';

const VISIT_TAG = '관광지';

interface Props {
  days: Day[];
  canEdit: boolean;
}

export function PlacesToVisit({ days, canEdit }: Props) {
  const { items: memos, addItem: addMemo } = useMemos();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('last');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMemo, setNewMemo] = useState('');

  const places = memos.filter((m) => m.tags.includes(VISIT_TAG));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
  };

  const computeOrder = (dayId: string, position: string): number => {
    const day = days.find((d) => d.id === dayId);
    if (!day || day.items.length === 0) return 1;
    const sorted = [...day.items].sort((a, b) => a.order - b.order);
    if (position === 'first') return sorted[0].order - 1;
    if (position === 'last') return sorted[sorted.length - 1].order + 1;
    const idx = sorted.findIndex((i) => i.id === position);
    if (idx === -1) return sorted[sorted.length - 1].order + 1;
    const curr = sorted[idx].order;
    const next = idx < sorted.length - 1 ? sorted[idx + 1].order : curr + 2;
    return (curr + next) / 2;
  };

  const handleAssign = async (memoId: string) => {
    if (!selectedDayId) return;
    const memo = memos.find((m) => m.id === memoId);
    if (!memo) return;
    const order = computeOrder(selectedDayId, selectedPosition);
    const item: Omit<TripItem, 'id' | 'updatedAt'> = {
      type: 'tour',
      title: memo.title,
      links: memo.url ? [memo.url] : [],
      memo: memo.memo,
      order,
    };
    await addDayItem(selectedDayId, item);
    setAssigningId(null);
    setSelectedDayId('');
    setSelectedPosition('last');
  };

  const handleAddPlace = async () => {
    if (!newTitle.trim()) return;
    await addMemo({
      title: newTitle.trim(),
      url: undefined,
      tags: [VISIT_TAG],
      memo: newMemo.trim() || undefined,
    });
    setNewTitle('');
    setNewMemo('');
    setShowAddForm(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-800">들러야 할 곳</h2>
          <span className="text-xs text-gray-400">{places.length}곳</span>
        </div>
        {canEdit && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); setAssigningId(null); }}
            className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + 장소 추가
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-3 bg-white rounded-xl border border-blue-100 p-4 space-y-3 shadow-sm">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="장소 이름 *"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
          <textarea
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            placeholder="메모 (선택)"
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />
          <p className="text-xs text-gray-400">메모탭에도 자동으로 #관광지 태그로 저장됩니다</p>
          <div className="flex gap-2">
            <button
              onClick={handleAddPlace}
              disabled={!newTitle.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              추가
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {places.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-5 text-center">
          <p className="text-sm text-gray-400">메모 탭에서 <span className="font-medium">#관광지</span> 태그를 달면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {places.map((place) => {
            const isAssigning = assigningId === place.id;
            const selectedDay = days.find((d) => d.id === selectedDayId);
            const sortedItems = selectedDay
              ? [...selectedDay.items].sort((a, b) => a.order - b.order)
              : [];

            return (
              <div
                key={place.id}
                className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${isAssigning ? 'border-blue-200' : 'border-gray-100'}`}
              >
                <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm leading-snug">{place.title}</p>
                    {place.memo && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{place.memo}</p>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => {
                        if (isAssigning) {
                          setAssigningId(null);
                        } else {
                          setAssigningId(place.id);
                          setSelectedDayId('');
                          setSelectedPosition('last');
                          setShowAddForm(false);
                        }
                      }}
                      className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        isAssigning
                          ? 'bg-gray-100 text-gray-500 border-gray-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {isAssigning ? '취소' : '일정에 추가'}
                    </button>
                  )}
                </div>

                {isAssigning && (
                  <div className="border-t border-blue-100 bg-blue-50/40 px-3 py-3 space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">날짜</label>
                      <select
                        value={selectedDayId}
                        onChange={(e) => { setSelectedDayId(e.target.value); setSelectedPosition('last'); }}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="">날짜 선택</option>
                        {days.map((day) => (
                          <option key={day.id} value={day.id}>
                            {formatDate(day.date)} · {day.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedDayId && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">순서</label>
                        <select
                          value={selectedPosition}
                          onChange={(e) => setSelectedPosition(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="first">맨 처음</option>
                          {sortedItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title} 다음
                            </option>
                          ))}
                          <option value="last">맨 마지막</option>
                        </select>
                      </div>
                    )}

                    <button
                      onClick={() => handleAssign(place.id)}
                      disabled={!selectedDayId}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      추가하기
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
