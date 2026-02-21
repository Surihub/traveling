import { useEffect, useMemo, useState } from 'react';
import type { Day, TripItem, ItemType, AccommodationCandidate } from '../types';
import { ITEM_TYPE_LABEL, ITEM_TYPE_ORDER, ITEM_TYPE_BADGE_CLASS } from '../types';
import { useDayItems, useMemos, useLocalTours, useShopping, useTransport } from '../hooks/useTrip';
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

type PoolCategory = 'all' | 'localtour' | 'accommodation' | 'shopping' | 'transport' | 'memo';

type PoolItem = {
  id: string;
  category: PoolCategory;
  title: string;
  subtitle?: string;
  defaultType: ItemType;
};

const POOL_CATEGORIES: { key: PoolCategory; label: string; badgeClass: string }[] = [
  { key: 'all', label: '전체', badgeClass: 'bg-gray-100 text-gray-600' },
  { key: 'localtour', label: '현지투어', badgeClass: 'bg-emerald-100 text-emerald-700' },
  { key: 'accommodation', label: '숙소', badgeClass: 'bg-sky-100 text-sky-700' },
  { key: 'shopping', label: '쇼핑', badgeClass: 'bg-rose-100 text-rose-700' },
  { key: 'transport', label: '교통', badgeClass: 'bg-amber-100 text-amber-700' },
  { key: 'memo', label: '메모', badgeClass: 'bg-violet-100 text-violet-700' },
];

export function DayDetail({ day, onBack, onUpdateDay, canEdit, isModal = false, accommodations }: DayDetailProps) {
  const { items, loading, addItem, updateItem, deleteItem } = useDayItems(day.id);
  const { items: memos } = useMemos();
  const { items: localTours } = useLocalTours();
  const { items: shopping } = useShopping();
  const { items: transport } = useTransport();

  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editCity, setEditCity] = useState(day.city);
  const [assigning, setAssigning] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState(day.accommodationId || '');

  // 통합 피커 상태
  const [showPicker, setShowPicker] = useState(false);
  const [poolCategory, setPoolCategory] = useState<PoolCategory>('all');
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [pickerType, setPickerType] = useState<ItemType>('tour');
  const [pickerPosition, setPickerPosition] = useState('last');

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

  // 통합 풀 생성
  const pool: PoolItem[] = useMemo(() => [
    ...localTours.map(t => ({
      id: `pool-lt-${t.id}`,
      category: 'localtour' as PoolCategory,
      title: t.name,
      subtitle: [t.date, t.meetingPoint].filter(Boolean).join(' · '),
      defaultType: 'tour' as ItemType,
    })),
    ...accommodations.map(a => ({
      id: `pool-ac-${a.id}`,
      category: 'accommodation' as PoolCategory,
      title: a.name,
      subtitle: [a.city, a.checkIn && a.checkOut ? `${a.checkIn}~${a.checkOut}` : ''].filter(Boolean).join(' · '),
      defaultType: 'stay' as ItemType,
    })),
    ...shopping.map(s => ({
      id: `pool-sh-${s.id}`,
      category: 'shopping' as PoolCategory,
      title: s.name,
      subtitle: [s.city, s.memo].filter(Boolean).join(' · '),
      defaultType: 'etc' as ItemType,
    })),
    ...transport.map(t => ({
      id: `pool-tr-${t.id}`,
      category: 'transport' as PoolCategory,
      title: `${t.from} → ${t.to}`,
      subtitle: [t.date, t.departureTime && t.arrivalTime ? `${t.departureTime}~${t.arrivalTime}` : t.departureTime].filter(Boolean).join(' '),
      defaultType: 'transport' as ItemType,
    })),
    ...memos.map(m => ({
      id: `pool-mo-${m.id}`,
      category: 'memo' as PoolCategory,
      title: m.title,
      subtitle: [m.tags.join(' '), m.memo].filter(Boolean).join(' · '),
      defaultType: 'tour' as ItemType,
    })),
  ], [localTours, accommodations, shopping, transport, memos]);

  const filteredPool = useMemo(() => {
    let result = poolCategory === 'all' ? pool : pool.filter(p => p.category === poolCategory);
    const q = pickerSearch.trim().toLowerCase();
    if (q) result = result.filter(p => p.title.toLowerCase().includes(q) || (p.subtitle || '').toLowerCase().includes(q));
    return result;
  }, [pool, poolCategory, pickerSearch]);

  useEffect(() => {
    setSelectedAccommodationId(day.accommodationId || '');
  }, [day.id, day.accommodationId]);

  const assignedAccommodation = useMemo(
    () => (!day.accommodationId ? undefined : accommodations.find((a) => a.id === day.accommodationId)),
    [accommodations, day.accommodationId]
  );

  const fallbackAccommodation = useMemo(() => {
    if (!day.accommodationName && !day.accommodationAddress && !day.accommodationMapUrl) return undefined;
    return {
      id: day.accommodationId,
      name: day.accommodationName,
      address: day.accommodationAddress,
      googleMapsUrl: day.accommodationMapUrl,
    } as Partial<AccommodationCandidate>;
  }, [day.accommodationId, day.accommodationName, day.accommodationAddress, day.accommodationMapUrl]);

  const displayAccommodation = assignedAccommodation || fallbackAccommodation;

  const recommendedAccommodations = useMemo(() => {
    const norm = day.city.trim().toLowerCase();
    const matches = accommodations.filter((a) => a.city.trim().toLowerCase() === norm);
    return matches.length > 0 ? matches : accommodations;
  }, [accommodations, day.city]);

  const computeOrder = (position: string): number => {
    if (sortedItems.length === 0) return 1;
    if (position === 'first') return sortedItems[0].order - 1;
    if (position === 'last') return sortedItems[sortedItems.length - 1].order + 1;
    const idx = sortedItems.findIndex((i) => i.id === position);
    if (idx === -1) return sortedItems[sortedItems.length - 1].order + 1;
    const curr = sortedItems[idx].order;
    const next = idx < sortedItems.length - 1 ? sortedItems[idx + 1].order : curr + 2;
    return (curr + next) / 2;
  };

  const handleAddFromPool = async () => {
    const item = pool.find((p) => p.id === selectedPoolId);
    if (!item) return;
    await addItem({
      type: pickerType,
      title: item.title,
      links: [],
      memo: item.subtitle,
      order: computeOrder(pickerPosition),
    });
    setSelectedPoolId(null);
    setPickerPosition('last');
    setShowPicker(false);
    setPickerSearch('');
  };

  const handleAssignAccommodation = async () => {
    const selected = accommodations.find((a) => a.id === selectedAccommodationId);
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
    const d = new Date(dateStr);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
  };

  const containerClass = isModal
    ? 'flex h-full flex-col rounded-2xl bg-white shadow-2xl overflow-hidden'
    : 'min-h-screen bg-gray-50';
  const headerWrapperClass = isModal ? 'bg-white border-b sticky top-0 z-10' : 'bg-white shadow-sm sticky top-0 z-10';
  const headerInnerClass = isModal ? 'w-full px-6 py-4' : 'max-w-2xl mx-auto px-4 py-4';
  const contentWrapperClass = isModal ? 'flex-1 overflow-y-auto px-6 py-4' : 'max-w-2xl mx-auto px-4 py-4';

  return (
    <div className={containerClass}>
      {/* 헤더 */}
      <div className={headerWrapperClass}>
        <div className={headerInnerClass}>
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3">
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
              <button onClick={handleUpdateHeader} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">저장</button>
              <button onClick={() => setIsEditingHeader(false)} className="px-3 py-1 bg-gray-200 rounded text-sm">취소</button>
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
            {/* 숙소 섹션 — 숙소가 있을 때만 표시 */}
            {displayAccommodation && (
            <section className="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
              {displayAccommodation && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">오늘의 숙소</p>
                  <h2 className="text-xl font-bold text-gray-800">{displayAccommodation.name}</h2>
                  {displayAccommodation?.address && (
                    <p className="text-sm text-gray-500 mt-1">{displayAccommodation.address}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleRemoveAccommodation}
                      className="px-3 py-1.5 rounded-full border text-xs text-gray-500 hover:border-red-300 hover:text-red-500"
                    >
                      해제
                    </button>
                    <button
                      onClick={() => setAssigning((p) => !p)}
                      className="px-3 py-1.5 rounded-full border text-xs text-blue-600 hover:border-blue-300"
                    >
                      {assigning ? '닫기' : '변경'}
                    </button>
                  </div>
                )}
              </div>
              )}

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
                        onClick={() => openGoogleDirections({ originName: displayAccommodation.address || displayAccommodation.name, originMapUrl: displayAccommodation.googleMapsUrl, destinationName: day.city })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100"
                      >
                        주변 길찾기
                      </button>
                    )}
                  </div>
                  <MapPreview mapUrl={displayAccommodation.googleMapsUrl} query={displayAccommodation.address || displayAccommodation.name} label="Google Maps" height={200} />
                </>
              )}

              {assigning && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 space-y-3">
                  {recommendedAccommodations.length === 0 ? (
                    <p className="text-sm text-gray-500">등록된 숙소가 없습니다. 숙소 탭에서 먼저 추가해주세요.</p>
                  ) : (
                    <>
                      <label className="block text-xs text-gray-500">숙소 선택</label>
                      <select value={selectedAccommodationId} onChange={(e) => setSelectedAccommodationId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="">숙소를 선택하세요</option>
                        {recommendedAccommodations.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name} · {acc.city}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleAssignAccommodation} disabled={!selectedAccommodationId} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-50">배정하기</button>
                        <button onClick={() => setAssigning(false)} className="px-4 py-2 rounded-lg bg-white border text-sm">취소</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
            )}

            {/* canEdit이고 숙소 미배정 시 배정 버튼만 노출 */}
            {canEdit && !displayAccommodation && !assigning && (
              <button
                onClick={() => setAssigning(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors bg-white"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                숙소 배정
              </button>
            )}

            {/* assigning 패널 (숙소 없을 때) */}
            {canEdit && !displayAccommodation && assigning && (
              <section className="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">숙소 배정</p>
                  <button onClick={() => setAssigning(false)} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
                </div>
                {recommendedAccommodations.length === 0 ? (
                  <p className="text-sm text-gray-500">등록된 숙소가 없습니다. 준비사항에서 먼저 추가해주세요.</p>
                ) : (
                  <>
                    <select value={selectedAccommodationId} onChange={(e) => setSelectedAccommodationId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">숙소를 선택하세요</option>
                      {recommendedAccommodations.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} · {acc.city}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleAssignAccommodation} disabled={!selectedAccommodationId} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-50">배정하기</button>
                      <button onClick={() => setAssigning(false)} className="px-4 py-2 rounded-lg bg-white border text-sm">취소</button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ── 준비사항에서 일정 추가 (통합 피커) ── */}
            {canEdit && (
              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 overflow-hidden">
                <button
                  onClick={() => { setShowPicker((p) => !p); setSelectedPoolId(null); setPickerSearch(''); setPoolCategory('all'); }}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="text-sm font-semibold text-indigo-700">준비사항에서 일정 추가</span>
                    <span className="text-xs text-indigo-400">{pool.length}개</span>
                  </div>
                  <svg className={`w-4 h-4 text-indigo-400 transition-transform ${showPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showPicker && (
                  <div className="border-t border-indigo-100 bg-white px-4 py-3 space-y-3">
                    {/* 카테고리 필터 */}
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
                      {POOL_CATEGORIES.map((cat) => {
                        const count = cat.key === 'all' ? pool.length : pool.filter(p => p.category === cat.key).length;
                        return (
                          <button
                            key={cat.key}
                            onClick={() => { setPoolCategory(cat.key); setSelectedPoolId(null); }}
                            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              poolCategory === cat.key
                                ? `${cat.badgeClass} border-transparent shadow-sm`
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {cat.label}
                            <span className="opacity-60">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 검색 */}
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder="검색..."
                        className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>

                    {/* 아이템 목록 */}
                    {filteredPool.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">항목이 없어요</p>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto -mx-1 px-1">
                        {filteredPool.map((item) => {
                          const isSelected = selectedPoolId === item.id;
                          const cat = POOL_CATEGORIES.find(c => c.key === item.category)!;
                          return (
                            <div key={item.id}>
                              <button
                                onClick={() => {
                                  setSelectedPoolId(isSelected ? null : item.id);
                                  setPickerType(item.defaultType);
                                  setPickerPosition('last');
                                }}
                                className={`w-full text-left rounded-xl px-3 py-2 border transition-all ${
                                  isSelected
                                    ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${cat.badgeClass}`}>
                                    {cat.label}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 leading-snug truncate">{item.title}</p>
                                    {item.subtitle && (
                                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.subtitle}</p>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* 선택된 항목의 설정 패널 */}
                              {isSelected && (
                                <div className="mt-1.5 ml-2 pl-3 border-l-2 border-indigo-200 space-y-2.5 pb-1">
                                  {/* 종류 */}
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1.5">종류</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {ITEM_TYPE_ORDER.map((type) => (
                                        <button
                                          key={type}
                                          onClick={() => setPickerType(type)}
                                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                            pickerType === type
                                              ? `${ITEM_TYPE_BADGE_CLASS[type]} border-transparent`
                                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                          }`}
                                        >
                                          {ITEM_TYPE_LABEL[type]}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 순서 */}
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1.5">순서</p>
                                    <select
                                      value={pickerPosition}
                                      onChange={(e) => setPickerPosition(e.target.value)}
                                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                                    >
                                      <option value="first">맨 처음</option>
                                      {sortedItems.map((it) => (
                                        <option key={it.id} value={it.id}>{it.title} 다음</option>
                                      ))}
                                      <option value="last">맨 마지막</option>
                                    </select>
                                  </div>

                                  <button
                                    onClick={handleAddFromPool}
                                    className="w-full py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
                                  >
                                    일정에 추가
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── 오늘의 일정 (flat list) ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-700">오늘의 일정</h2>
                  {sortedItems.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {sortedItems.length}개
                    </span>
                  )}
                </div>
                {canEdit && !showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    직접 추가
                  </button>
                )}
              </div>

              {sortedItems.length === 0 && !showAddForm ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center">
                  <p className="text-sm text-gray-400">아직 등록된 일정이 없어요</p>
                  {canEdit && (
                    <p className="text-xs text-gray-300 mt-1">위에서 준비사항으로 추가하거나 직접 추가해보세요</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedItems.map((item) => (
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

              {canEdit && showAddForm && (
                <div className="mt-3">
                  <ItemForm
                    onSubmit={async (data) => {
                      await addItem(data as Omit<TripItem, 'id' | 'updatedAt'>);
                      setShowAddForm(false);
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
