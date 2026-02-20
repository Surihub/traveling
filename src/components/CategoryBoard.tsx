import { useState } from 'react';
import type { Day, ItemType, TripItem } from '../types';
import { ITEM_TYPE_BADGE_CLASS, ITEM_TYPE_LABEL, ITEM_TYPE_ORDER } from '../types';
import { addDayItem } from '../hooks/useTrip';
import { ItemForm } from './ItemForm';
import { openGoogleMaps } from '../utils/maps';

interface CategoryBoardProps {
  days: Day[];
  canEdit: boolean;
  activeType: ItemType;
  onChangeType: (type: ItemType) => void;
  onOpenDayDetail: (day: Day) => void;
  onOpenDayDetailWithType: (day: Day, type: ItemType) => void;
}

const BASE_STAY_CITIES = ['로마', '베로나', '피렌체'];

export function CategoryBoard({
  days,
  canEdit,
  activeType,
  onChangeType,
  onOpenDayDetail,
  onOpenDayDetailWithType,
}: CategoryBoardProps) {
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  const handleAddItem = async (dayId: string, data: Omit<TripItem, 'id' | 'updatedAt'>) => {
    await addDayItem(dayId, data);
    setExpandedDayId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {ITEM_TYPE_ORDER.map((type) => (
          <button
            key={type}
            onClick={() => onChangeType(type)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              activeType === type
                ? `${ITEM_TYPE_BADGE_CLASS[type]} border-2`
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
            }`}
          >
            {ITEM_TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      {activeType === 'stay' && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
          {BASE_STAY_CITIES.map((city) => (
            <span
              key={city}
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700"
            >
              {city} 본거지
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {days.map((day, index) => {
          const typeItems = [...day.items.filter((item) => item.type === activeType)].sort(
            (a, b) => a.order - b.order
          );

          return (
            <article key={day.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Day {index + 1}</p>
                  <h3 className="text-lg font-semibold text-gray-900">{day.city}</h3>
                  <p className="text-sm text-gray-500">{formatDate(day.date)}</p>
                </div>
                <button
                  onClick={() => onOpenDayDetail(day)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  세부 일정
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {typeItems.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500">
                    등록된 {ITEM_TYPE_LABEL[activeType]} 일정이 없습니다.
                  </p>
                ) : (
                  typeItems.map((item) => (
                    <div key={item.id} className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{item.title}</p>
                        {(item.googleMapsUrl || item.address) && (
                          <button
                            onClick={() => openGoogleMaps(item.googleMapsUrl, item.address)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            지도
                          </button>
                        )}
                      </div>
                      {item.memo && <p className="mt-1 text-sm text-gray-600">{item.memo}</p>}
                    </div>
                  ))
                )}
              </div>

              {canEdit && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setExpandedDayId((current) => (current === day.id ? null : day.id))
                    }
                    className="rounded-lg border border-dashed border-gray-400 px-3 py-1 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600"
                  >
                    {expandedDayId === day.id ? '닫기' : `${ITEM_TYPE_LABEL[activeType]} 추가`}
                  </button>
                  <button
                    onClick={() => onOpenDayDetailWithType(day, activeType)}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-400"
                  >
                    상세 편집
                  </button>
                </div>
              )}

              {canEdit && expandedDayId === day.id && (
                <div className="mt-4">
                  <ItemForm
                    lockedType={activeType}
                    initialType={activeType}
                    onSubmit={async (formData) => {
                      await handleAddItem(day.id, formData as Omit<TripItem, 'id' | 'updatedAt'>);
                    }}
                    onCancel={() => setExpandedDayId(null)}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
