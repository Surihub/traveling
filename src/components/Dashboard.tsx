import { useState, useEffect, useMemo } from 'react';
import { useTrip, useDays, useAccommodations } from '../hooks/useTrip';
import type { Day } from '../types';
import { DayDetail } from './DayDetail';
import { AllScheduleBoard } from './AllScheduleBoard';
import type { ScheduleView } from './AllScheduleBoard';
import { AccommodationBoard } from './AccommodationBoard';
import { ShoppingBoard } from './ShoppingBoard';
import { TransportBoard } from './TransportBoard';
import { MemoBoard } from './MemoBoard';
import { LocalTourBoard } from './LocalTourBoard';
import { ItalianHelper } from './ItalianHelper';
import { CurrencyCalculator } from './CurrencyCalculator';

type MainTab = 'travel' | 'schedule' | 'italian' | 'currency';
type TravelSubTab = 'daily' | 'all-schedule' | 'transport' | 'accommodation' | 'shopping' | 'localtour' | 'memo';

interface DashboardProps {
  canEdit: boolean;
  onRequestEdit: () => void;
  onLogout: () => void;
  getRemainingTime: () => number;
}

export function Dashboard({ canEdit, onRequestEdit, onLogout, getRemainingTime }: DashboardProps) {
  const { trip, loading: tripLoading } = useTrip();
  const { days, loading: daysLoading, addDay, updateDay, deleteDay } = useDays();
  const { items: accommodations, loading: accommodationsLoading } = useAccommodations();
  const [selectedDay, setSelectedDay] = useState<{ day: Day } | null>(null);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  const [newDayCity, setNewDayCity] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [mainTab, setMainTab] = useState<MainTab | null>(null);
  const [travelSubTab, setTravelSubTab] = useState<TravelSubTab>('daily');
  const [scheduleView, setScheduleView] = useState<ScheduleView>('daily');
  const [highlightAccom, setHighlightAccom] = useState<string | undefined>();

  const sortedDays = useMemo(() => {
    return [...days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [days]);

  const cityColorPalette = [
    { card: 'bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200', badge: 'bg-sky-100 text-sky-700', accent: 'text-sky-600' },
    { card: 'bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200', badge: 'bg-rose-100 text-rose-700', accent: 'text-rose-600' },
    { card: 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-600' },
    { card: 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200', badge: 'bg-amber-100 text-amber-700', accent: 'text-amber-600' },
    { card: 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', accent: 'text-indigo-600' },
    { card: 'bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200', badge: 'bg-teal-100 text-teal-700', accent: 'text-teal-600' },
  ];

  const cityColorMap = useMemo(() => {
    const map = new Map<string, (typeof cityColorPalette)[number]>();
    sortedDays.forEach((day) => {
      const key = day.city?.trim() || '기타';
      if (!map.has(key)) {
        map.set(key, cityColorPalette[map.size % cityColorPalette.length]);
      }
    });
    return map;
  }, [sortedDays]);

  useEffect(() => {
    if (canEdit) {
      const interval = setInterval(() => {
        setRemainingTime(getRemainingTime());
      }, 1000);
      setRemainingTime(getRemainingTime());
      return () => clearInterval(interval);
    }
  }, [canEdit, getRemainingTime]);

  const formatRemainingTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateDDay = () => {
    if (!trip?.startDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(trip.startDate);
    startDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const dDay = calculateDDay();

  const handleAddDay = async () => {
    if (newDayDate && newDayCity) {
      await addDay(newDayDate, newDayCity);
      setNewDayDate('');
      setNewDayCity('');
      setShowAddDay(false);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (window.confirm('이 날짜의 모든 일정이 삭제됩니다. 계속하시겠습니까?')) {
      await deleteDay(dayId);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
  };


  const mainTabs: { key: MainTab; label: string; emoji: string }[] = [
    { key: 'schedule', label: '일정', emoji: '📋' },
    { key: 'italian', label: '이탈리아어', emoji: '🇮🇹' },
    { key: 'currency', label: '환율', emoji: '💶' },
  ];

  const travelSubTabs: { key: TravelSubTab; label: string }[] = [
    { key: 'daily', label: '일자별로 보기' },
    { key: 'all-schedule', label: '모든일정' },
    { key: 'transport', label: '교통' },
    { key: 'accommodation', label: '숙소' },
    { key: 'shopping', label: '쇼핑' },
    { key: 'localtour', label: '현지투어' },
    { key: 'memo', label: '메모' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          {/* 상단: 앱 이름 + 컨트롤 */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => setMainTab(null)}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left"
            >
              {/* 이탈리아 국기 */}
              <div className="flex h-6 w-9 overflow-hidden rounded-sm shadow-sm flex-shrink-0">
                <div className="flex-1 bg-[#009246]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#ce2b37]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  {trip?.title || '수빈이네 in Italy'}
                </h1>
                {dDay !== null && (
                  <p className="text-xs text-gray-400 leading-tight">
                    {dDay > 0
                      ? <span className="text-rose-500 font-semibold">D-{dDay}</span>
                      : dDay === 0
                        ? <span className="text-rose-600 font-bold">D-Day! 🎉</span>
                        : <span className="text-gray-400">D+{Math.abs(dDay)}</span>}
                    {trip?.startDate && trip?.endDate && (
                      <span className="ml-1.5 text-gray-400">
                        {trip.startDate.replace(/-/g, '.')} ~ {trip.endDate.replace(/-/g, '.')}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </button>
            <div className="flex items-center gap-1.5">
              {canEdit && (
                <>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                    🔓 {formatRemainingTime(remainingTime)}
                  </span>
                  <button
                    onClick={onLogout}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-full hover:bg-gray-100"
                  >
                    잠금
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 메인 탭 — 홈에서는 숨김 */}
          {mainTab !== null && (
            <div className="flex gap-0">
              {mainTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMainTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all border-b-2 ${
                    mainTab === tab.key
                      ? 'border-slate-700 text-slate-800'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

<main className={`max-w-2xl mx-auto px-4${mainTab === null ? '' : ' py-5'}`}>
        {/* 홈 화면 */}
        {mainTab === null && (
          <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 57px)' }}>
            <div className="flex flex-col items-center pt-5 pb-4">
              <div className="flex h-10 w-16 overflow-hidden rounded-md shadow mb-3">
                <div className="flex-1 bg-[#009246]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#ce2b37]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{trip?.title || '수빈이네 in Italy'}</h2>
              {dDay !== null && (
                <p className="text-sm text-gray-400">
                  {dDay > 0
                    ? <span className="text-rose-500 font-semibold">D-{dDay}</span>
                    : dDay === 0
                      ? <span className="text-rose-600 font-bold">D-Day! 🎉</span>
                      : <span>D+{Math.abs(dDay)}</span>}
                  {trip?.startDate && trip?.endDate && (
                    <span className="ml-1.5">{trip.startDate.replace(/-/g, '.')} ~ {trip.endDate.replace(/-/g, '.')}</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 flex-1 pb-4">
              {[
                { key: 'schedule' as MainTab, emoji: '📋', label: '일정', desc: '날짜별 전체 여행 일정 보기' },
                { key: 'italian' as MainTab, emoji: '🇮🇹', label: '이탈리아어', desc: '여행에 필요한 표현 모음' },
                { key: 'currency' as MainTab, emoji: '💶', label: '환율', desc: '유로 ↔ 원화 빠른 계산' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setMainTab(item.key)}
                  className="flex-1 w-full flex flex-col items-center justify-center gap-3 bg-white rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  <span className="text-6xl leading-none">{item.emoji}</span>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{item.label}</p>
                    <p className="text-base text-gray-400 mt-1">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 일정 탭 */}
        {mainTab === 'schedule' && (
          <div className="py-5">
            {/* 서브탭 + 편집 버튼 */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-2 flex-1">
                {([
                  { key: 'daily' as ScheduleView, label: '일자별로 보기' },
                  { key: 'accommodation' as ScheduleView, label: '숙소만 보기' },
                  { key: 'transport' as ScheduleView, label: '교통만 보기' },
                ] as { key: ScheduleView; label: string }[]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setScheduleView(tab.key); setHighlightAccom(undefined); }}
                    className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                      scheduleView === tab.key
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {!canEdit && (
                <button
                  onClick={onRequestEdit}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  편집
                </button>
              )}
            </div>
            <AllScheduleBoard
              canEdit={canEdit}
              view={scheduleView}
              highlightAccom={highlightAccom}
              onAccomClick={(name) => {
                setHighlightAccom(name);
                setScheduleView('accommodation');
              }}
            />
          </div>
        )}

        {/* 이탈리아어 탭 */}
        {mainTab === 'italian' && <ItalianHelper />}

        {/* 환율 탭 */}
        {mainTab === 'currency' && <CurrencyCalculator />}

        {/* 여행관리 탭 (임시 숨김) */}
        {mainTab === 'travel' && (
        tripLoading || daysLoading || accommodationsLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <>
            {/* 서브 탭 + 편집 버튼 */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none flex-1">
                {travelSubTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTravelSubTab(tab.key)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      travelSubTab === tab.key
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {!canEdit && (
                <button
                  onClick={onRequestEdit}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  편집
                </button>
              )}
            </div>

            {/* 일자별로 보기 탭 */}
            {travelSubTab === 'daily' && (
              <>
                <div className="space-y-4">
                  {sortedDays.map((day, index) => {
                    const color = cityColorMap.get(day.city?.trim() || '기타') || cityColorPalette[0];
                    const assigned = accommodations.find((acc) => acc.id === day.accommodationId);
                    // 숙소는 체크인 날짜에만 표시
                    const isCheckInDay = assigned ? assigned.checkIn === day.date : !!day.accommodationName;
                    const fallbackAccommodation = (isCheckInDay && day.accommodationName)
                      ? {
                          name: day.accommodationName,
                          address: day.accommodationAddress,
                        }
                      : undefined;
                    const showAccommodation = isCheckInDay && (assigned || fallbackAccommodation);
                    return (
                      <div
                        key={day.id}
                        className={`rounded-2xl border shadow-sm hover:shadow-lg transition-shadow ${color.card}`}
                      >
                        <div
                          onClick={() => setSelectedDay({ day })}
                          className="p-4 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color.badge}`}>
                                  {day.city}
                                </span>
                                <span className="text-xs text-gray-400">Day {index + 1}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-800">
                                {day.items[0]?.title || '세부 일정 확인'}
                              </h3>
                              <div className="space-y-1 mt-1">
                                {day.items.length > 0 && (
                                  <p className="text-xs text-gray-600">
                                    {day.items.length}개 일정 · 마지막 일정 {day.items[day.items.length - 1].title}
                                  </p>
                                )}
                                {showAccommodation && (
                                  <p className="text-xs text-gray-600 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.38 0 2.5-1.12 2.5-2.5S13.38 6 12 6s-2.5 1.12-2.5 2.5S10.62 11 12 11zm0 0c2.485 0 4.5 2.015 4.5 4.5S12 21 12 21s-4.5-3.015-4.5-5.5S9.515 11 12 11z" />
                                    </svg>
                                    체크인 · {assigned?.name || fallbackAccommodation?.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDay(day.id);
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/50 rounded-lg"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                              <svg className={`w-5 h-5 ${color.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {canEdit && (
                  showAddDay ? (
                    <div className="mt-4 bg-white rounded-xl shadow-md p-4">
                      <h3 className="font-medium text-gray-800 mb-3">새 날짜 추가</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">날짜</label>
                          <input
                            type="date"
                            value={newDayDate}
                            onChange={(e) => setNewDayDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">도시</label>
                          <input
                            type="text"
                            value={newDayCity}
                            onChange={(e) => setNewDayCity(e.target.value)}
                            placeholder="예: 로마, 피렌체, 베네치아"
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddDay}
                            disabled={!newDayDate || !newDayCity}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                          >
                            추가
                          </button>
                          <button
                            onClick={() => setShowAddDay(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddDay(true)}
                      className="w-full mt-4 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      새 날짜 추가
                    </button>
                  )
                )}

                {sortedDays.length === 0 && !canEdit && (
                  <div className="text-center py-12 text-gray-500">
                    <p>등록된 일정이 없습니다</p>
                  </div>
                )}
              </>
            )}

            {/* 모든일정 tab */}
            {travelSubTab === 'all-schedule' && <AllScheduleBoard canEdit={canEdit} />}

            {/* 교통 tab */}
            {travelSubTab === 'transport' && <TransportBoard canEdit={canEdit} />}

            {/* 숙소 tab */}
            {travelSubTab === 'accommodation' && <AccommodationBoard canEdit={canEdit} />}

            {/* 쇼핑 tab */}
            {travelSubTab === 'shopping' && <ShoppingBoard canEdit={canEdit} />}

            {/* 현지투어 tab */}
            {travelSubTab === 'localtour' && <LocalTourBoard canEdit={canEdit} />}

            {/* 메모 tab */}
            {travelSubTab === 'memo' && <MemoBoard canEdit={canEdit} />}

          </>
        )
        )}
      </main>

      {/* Day detail — 전체화면 */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50">
          <DayDetail
            day={selectedDay.day}
            onBack={() => setSelectedDay(null)}
            onUpdateDay={updateDay}
            canEdit={canEdit}
            accommodations={accommodations}
          />
        </div>
      )}
    </div>
  );
}
