import { useEffect, useMemo, useState } from 'react';
import type { Day, TripItem, ItemType, AccommodationCandidate } from '../types';
import { ITEM_TYPE_LABEL, ITEM_TYPE_ORDER, ITEM_TYPE_SECTION_CLASS, ITEM_TYPE_BADGE_CLASS } from '../types';
import { useDayItems } from '../hooks/useTrip';
import { ItemCard } from './ItemCard';
import { ItemForm } from './ItemForm';
import { MapPreview } from './MapPreview';
import { openGoogleMaps, openGoogleDirections } from '../utils/maps';

interface DayDetailProps {
  day: Day;
  onBack: () => void;
  onUpdateDay: (dayId: string, data: Partial<Day>) => Promise<void>;
  canEdit: boolean;
  isModal?: boolean;
  accommodations: AccommodationCandidate[];
}

export function DayDetail({ day, onBack, onUpdateDay, canEdit, isModal = false, accommodations }: DayDetailProps) {
  const { items, loading, addItem, updateItem, deleteItem } = useDayItems(day.id);
  const [activeFormType, setActiveFormType] = useState<ItemType | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editCity, setEditCity] = useState(day.city);
  const [assigning, setAssigning] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState(day.accommodationId || '');

  const groupedItems = useMemo(
    () =>
      ITEM_TYPE_ORDER.map((type) => ({
        type,
        items: items.filter((item) => item.type === type),
      })),
    [items]
  );

  useEffect(() => {
    setSelectedAccommodationId(day.accommodationId || '');
  }, [day.id, day.accommodationId]);

  const assignedAccommodation = useMemo(() => {
    if (!day.accommodationId) return undefined;
    return accommodations.find((acc) => acc.id === day.accommodationId);
  }, [accommodations, day.accommodationId]);

  const fallbackAccommodation = useMemo(() => {
    if (!day.accommodationName && !day.accommodationAddress && !day.accommodationMapUrl) {
      return undefined;
    }
    return {
      id: day.accommodationId,
      name: day.accommodationName,
      address: day.accommodationAddress,
      googleMapsUrl: day.accommodationMapUrl,
    } as Partial<AccommodationCandidate>;
  }, [day.accommodationId, day.accommodationName, day.accommodationAddress, day.accommodationMapUrl]);

  const displayAccommodation = assignedAccommodation || fallbackAccommodation;

  const recommendedAccommodations = useMemo(() => {
    if (!day.city.trim()) return accommodations;
    const normalized = day.city.trim().toLowerCase();
    const matches = accommodations.filter((acc) => acc.city.trim().toLowerCase() === normalized);
    return matches.length > 0 ? matches : accommodations;
  }, [accommodations, day.city]);

  const handleAssignAccommodation = async () => {
    const selected = accommodations.find((acc) => acc.id === selectedAccommodationId);
    await onUpdateDay(day.id, {
      accommodationId: selected?.id,
      accommodationName: selected?.name,
      accommodationAddress: selected?.address,
      accommodationMapUrl: selected?.googleMapsUrl,
    });
    setAssigning(false);
  };

  const handleRemoveAccommodation = async () => {
    await onUpdateDay(day.id, {
      accommodationId: undefined,
      accommodationName: undefined,
      accommodationAddress: undefined,
      accommodationMapUrl: undefined,
    });
    setSelectedAccommodationId('');
  };

  const handleUpdateHeader = async () => {
    await onUpdateDay(day.id, { city: editCity });
    setIsEditingHeader(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
  };

  const containerClass = isModal
    ? 'flex h-full flex-col rounded-2xl bg-white shadow-2xl overflow-hidden'
    : 'min-h-screen bg-gray-50';
  const headerWrapperClass = isModal
    ? 'bg-white border-b sticky top-0 z-10'
    : 'bg-white shadow-sm sticky top-0 z-10';
  const headerInnerClass = isModal ? 'w-full px-6 py-4' : 'max-w-2xl mx-auto px-4 py-4';
  const contentWrapperClass = isModal
    ? 'flex-1 overflow-y-auto px-6 py-4'
    : 'max-w-2xl mx-auto px-4 py-4';

  return (
    <div className={containerClass}>
      <div className={headerWrapperClass}>
        <div className={headerInnerClass}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isModal ? '창 닫기' : '돌아가기'}
          </button>

          {isEditingHeader && canEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleUpdateHeader}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                저장
              </button>
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-3 py-1 bg-gray-200 rounded text-sm"
              >
                취소
              </button>
            </div>
          ) : (
            <div
              onClick={() => canEdit && setIsEditingHeader(true)}
              className={`${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''} -mx-2 px-2 py-1 rounded`}
            >
              <h1 className="text-2xl font-bold text-gray-800">{day.city}</h1>
              <p className="text-gray-500">{formatDate(day.date)}</p>
            </div>
          )}
        </div>
      </div>

      <div className={contentWrapperClass}>
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">오늘의 숙소</p>
                  <h2 className="text-xl font-bold text-gray-800">
                    {displayAccommodation?.name || '배정된 숙소가 없어요'}
                  </h2>
                  {displayAccommodation?.address && (
                    <p className="text-sm text-gray-500 mt-1">{displayAccommodation.address}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    {displayAccommodation && (
                      <button
                        onClick={handleRemoveAccommodation}
                        className="px-3 py-1.5 rounded-full border text-xs text-gray-500 hover:border-red-300 hover:text-red-500"
                      >
                        해제
                      </button>
                    )}
                    <button
                      onClick={() => setAssigning((prev) => !prev)}
                      className="px-3 py-1.5 rounded-full border text-xs text-blue-600 hover:border-blue-300"
                    >
                      {assigning ? '닫기' : displayAccommodation ? '변경' : '배정' }
                    </button>
                  </div>
                )}
              </div>

              {displayAccommodation && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(displayAccommodation.googleMapsUrl || displayAccommodation.address) && (
                      <button
                        onClick={() => openGoogleMaps(displayAccommodation.googleMapsUrl, displayAccommodation.address || displayAccommodation.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100"
                      >
                        지도 열기
                      </button>
                    )}
                    {displayAccommodation.googleMapsUrl && day.city && (
                      <button
                        onClick={() => openGoogleDirections({
                          originName: displayAccommodation.address || displayAccommodation.name,
                          originMapUrl: displayAccommodation.googleMapsUrl,
                          destinationName: day.city,
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100"
                      >
                        주변 길찾기
                      </button>
                    )}
                  </div>
                  <MapPreview
                    mapUrl={displayAccommodation.googleMapsUrl}
                    query={displayAccommodation.address || displayAccommodation.name}
                    label="Google Maps"
                    height={200}
                  />
                </>
              )}

              {assigning && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 space-y-3">
                  {recommendedAccommodations.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      등록된 숙소가 없습니다. 숙소 탭에서 먼저 추가해주세요.
                    </p>
                  ) : (
                    <>
                      <label className="block text-xs text-gray-500">숙소 선택</label>
                      <select
                        value={selectedAccommodationId}
                        onChange={(e) => setSelectedAccommodationId(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">숙소를 선택하세요</option>
                        {recommendedAccommodations.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} · {acc.city}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAssignAccommodation}
                          disabled={!selectedAccommodationId}
                          className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
                        >
                          배정하기
                        </button>
                        <button
                          onClick={() => setAssigning(false)}
                          className="px-4 py-2 rounded-lg bg-white border text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
            {groupedItems.map(({ type, items: typeItems }) => (
              <section
                key={type}
                className={`rounded-2xl border px-4 py-4 ${ITEM_TYPE_SECTION_CLASS[type]}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${ITEM_TYPE_BADGE_CLASS[type]}`}
                    >
                      {ITEM_TYPE_LABEL[type]}
                    </span>
                    <span className="text-sm text-gray-500">{typeItems.length}개</span>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() =>
                        setActiveFormType((current) => (current === type ? null : type))
                      }
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {activeFormType === type ? '취소' : '추가'}
                    </button>
                  )}
                </div>

                {typeItems.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-500">
                    아직 등록된 일정이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {typeItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onUpdate={updateItem}
                        onDelete={deleteItem}
                        canEdit={canEdit}
                        originName={displayAccommodation?.name}
                        originAddress={displayAccommodation?.address}
                        originMapUrl={displayAccommodation?.googleMapsUrl}
                      />
                    ))}
                  </div>
                )}

                {canEdit && activeFormType === type && (
                  <div className="mt-4">
                    <ItemForm
                      initialType={type}
                      lockedType={type}
                      onSubmit={async (data) => {
                        await addItem(data as Omit<TripItem, 'id' | 'updatedAt'>);
                        setActiveFormType(null);
                      }}
                      onCancel={() => setActiveFormType(null)}
                    />
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
