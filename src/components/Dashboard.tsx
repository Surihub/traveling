import { useState, useEffect, useRef, useMemo } from 'react';
import { useTrip, useDays, useAccommodations } from '../hooks/useTrip';
import type { Day } from '../types';
import { FlightInfo } from './FlightInfo';
import { DayDetail } from './DayDetail';
import { InfoBoard } from './InfoBoard';
import { GuideSection } from './GuideSection';
import { ItalianHelper } from './ItalianHelper';
import { CurrencyCalculator } from './CurrencyCalculator';
import { forceHydrateNow, forceExportNow } from '../utils/autoSheetSync';

type MainTab = 'travel' | 'italian' | 'currency';
type TravelSubTab = 'overview' | 'schedule' | 'info';
type ManualSyncMode = 'pull' | 'push' | 'both';

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
  const [mainTab, setMainTab] = useState<MainTab>('travel');
  const [travelSubTab, setTravelSubTab] = useState<TravelSubTab>('overview');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const syncTimeoutRef = useRef<number | null>(null);
  const syncMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSyncMenu && syncMenuRef.current && !syncMenuRef.current.contains(event.target as Node)) {
        setShowSyncMenu(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSyncMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showSyncMenu]);

  const startMessages: Record<ManualSyncMode, string> = {
    both: '시트와 앱을 동시에 최신화하는 중...',
    pull: '시트에서 최신 데이터를 가져오는 중...',
    push: '앱의 변경사항을 시트에 저장하는 중...',
  };

  const successMessages: Record<ManualSyncMode, string> = {
    both: '양방향 동기화가 완료되었습니다.',
    pull: '시트 데이터가 앱에 반영되었습니다.',
    push: '앱 데이터가 시트에 저장되었습니다.',
  };

  const runManualSync = async (mode: ManualSyncMode) => {
    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    setShowSyncMenu(false);
    setSyncStatus('loading');
    setSyncMessage(startMessages[mode]);
    try {
      if (mode === 'pull' || mode === 'both') {
        await forceHydrateNow();
      }
      if (mode === 'push' || mode === 'both') {
        await forceExportNow();
      }
      setSyncStatus('success');
      setSyncMessage(successMessages[mode]);
    } catch (error) {
      console.error('Manual sync failed', error);
      setSyncStatus('error');
      setSyncMessage('동기화에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      syncTimeoutRef.current = window.setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage(null);
        syncTimeoutRef.current = null;
      }, 5000);
    }
  };

  const handleManualSync = async (mode: ManualSyncMode, requiresEdit: boolean) => {
    if (requiresEdit && !canEdit) {
      setShowSyncMenu(false);
      setSyncStatus('error');
      setSyncMessage('시트 데이터를 불러오려면 수정모드가 필요합니다.');
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = window.setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage(null);
        syncTimeoutRef.current = null;
      }, 4000);
      return;
    }
    await runManualSync(mode);
  };

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


  const manualSyncOptions: { mode: ManualSyncMode; label: string; description: string; icon: string; requiresEdit: boolean }[] = [
    {
      mode: 'both',
      label: '전체 동기화',
      description: '앱 ↔ 시트 모두 최신화',
      icon: 'M4 4v5h.01M4 9a7 7 0 0112-5m4 0v5h-.01M20 7a7 7 0 01-12 5m0 0v5h-.01M8 17a7 7 0 0012 0m0 0v-5',
      requiresEdit: true,
    },
    {
      mode: 'pull',
      label: '시트 → 앱',
      description: '시트 변경분만 가져오기',
      icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10',
      requiresEdit: true,
    },
    {
      mode: 'push',
      label: '앱 → 시트',
      description: '현재 데이터를 시트에 저장',
      icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      requiresEdit: false,
    },
  ];

  const mainTabs: { key: MainTab; label: string; emoji: string }[] = [
    { key: 'travel', label: '여행관리', emoji: '🗺️' },
    { key: 'italian', label: '이탈리아어', emoji: '🇮🇹' },
    { key: 'currency', label: '환율', emoji: '💶' },
  ];

  const travelSubTabs: { key: TravelSubTab; label: string }[] = [
    { key: 'overview', label: '개요' },
    { key: 'schedule', label: '일정' },
    { key: 'info', label: '준비사항' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          {/* 상단: 앱 이름 + 컨트롤 */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
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
            </div>
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
              <div className="relative" ref={syncMenuRef}>
                <button
                  onClick={() => setShowSyncMenu((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    syncStatus === 'loading'
                      ? 'border-blue-200 text-blue-500 bg-blue-50'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={showSyncMenu}
                >
                  <svg className={`w-3.5 h-3.5 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.01M20 20v-5h-.01M4 9a9 9 0 0115-4.47M20 15a9 9 0 01-15 4.47" />
                  </svg>
                  동기화
                </button>
                {showSyncMenu && (
                  <div className="absolute right-0 mt-1.5 w-60 rounded-2xl border border-gray-100 bg-white shadow-xl z-40">
                    <div className="px-3 py-2 border-b text-xs text-gray-400 font-medium">수동 동기화</div>
                    <div className="py-1.5">
                      {manualSyncOptions.map((option) => {
                        const disabled = option.requiresEdit && !canEdit;
                        return (
                          <button
                            key={option.mode}
                            onClick={() => handleManualSync(option.mode, option.requiresEdit)}
                            disabled={disabled || syncStatus === 'loading'}
                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-40 ${
                              option.mode === 'both' ? 'font-semibold' : ''
                            }`}
                          >
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                            </svg>
                            <span>
                              {option.label}
                              <span className="block text-xs text-gray-400 font-normal">{option.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 메인 탭 */}
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
        </div>
      </header>

      {syncMessage && (
        <div className="max-w-2xl mx-auto px-4 pt-2">
          <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${
            syncStatus === 'error' ? 'bg-red-50 text-red-600' :
            syncStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {syncStatus === 'loading'
              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
              : syncStatus === 'error'
                ? <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            }
            <span>{syncMessage}</span>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* 이탈리아어 탭 */}
        {mainTab === 'italian' && <ItalianHelper />}

        {/* 환율 탭 */}
        {mainTab === 'currency' && <CurrencyCalculator />}

        {/* 여행관리 탭 */}
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

            {/* Overview tab */}
            {travelSubTab === 'overview' && (
              <>
                <GuideSection />
                <FlightInfo flight={trip?.flight} />
              </>
            )}

            {/* Schedule tab */}
            {travelSubTab === 'schedule' && (
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

            {/* Info tab — 현지투어 / 숙소 / 쇼핑 / 교통 / 메모 통합 */}
            {travelSubTab === 'info' && <InfoBoard canEdit={canEdit} />}

          </>
        )
        )}
      </main>

      {/* Day detail modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <DayDetail
              day={selectedDay.day}
              onBack={() => setSelectedDay(null)}
              onUpdateDay={updateDay}
              canEdit={canEdit}
              isModal
              accommodations={accommodations}
            />
          </div>
        </div>
      )}
    </div>
  );
}
