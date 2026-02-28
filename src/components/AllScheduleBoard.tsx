import { useState, useMemo, useEffect, useCallback } from 'react';
import { useScheduleRows } from '../hooks/useTrip';
import { readSheetDirect, syncSheet, sheetDataToAccommodations, accommodationsToSheetData, normalizeDateStr } from '../utils/googleSheets';
import { triggerSync, getSyncStatus, type SyncStatus } from '../utils/autoSheetSync';
import type { ScheduleRow, AccommodationCandidate } from '../types';

/** 동기화 상태를 구독하는 훅 */
function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  useEffect(() => {
    const handler = (e: Event) => setStatus((e as CustomEvent<SyncStatus>).detail);
    window.addEventListener('sheetSyncStatus', handler);
    return () => window.removeEventListener('sheetSyncStatus', handler);
  }, []);
  return status;
}

// "2026-03-03" → 로컬 타임 Date (UTC 파싱 방지)
function parseDateLocal(dateStr: string): Date {
  const s = normalizeDateStr(dateStr);
  const parts = s.split('-').map(Number);
  if (parts.length === 3 && parts.every(n => !isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(NaN);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function fmtDateShort(dateStr: string): string {
  const d = parseDateLocal(dateStr);
  if (isNaN(d.getTime())) return dateStr || '';
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

export type ScheduleView = 'daily' | 'accommodation' | 'transport';

// ── 도시별 색상 팔레트 ──

const CITY_COLORS = [
  { badge: 'bg-rose-100 text-rose-700', header: 'bg-rose-50', divider: 'border-rose-100' },
  { badge: 'bg-amber-100 text-amber-700', header: 'bg-amber-50', divider: 'border-amber-100' },
  { badge: 'bg-emerald-100 text-emerald-700', header: 'bg-emerald-50', divider: 'border-emerald-100' },
  { badge: 'bg-sky-100 text-sky-700', header: 'bg-sky-50', divider: 'border-sky-100' },
  { badge: 'bg-indigo-100 text-indigo-700', header: 'bg-indigo-50', divider: 'border-indigo-100' },
  { badge: 'bg-violet-100 text-violet-700', header: 'bg-violet-50', divider: 'border-violet-100' },
];

function buildCityColorMap(rows: ScheduleRow[]) {
  const map = new Map<string, typeof CITY_COLORS[number]>();
  rows.forEach((row) => {
    const city = row.city?.trim() || '기타';
    if (!map.has(city)) map.set(city, CITY_COLORS[map.size % CITY_COLORS.length]);
  });
  return map;
}

// ── 이동수단 이모티콘 ──

// IATA 항공사 코드 + 편명 패턴 (예: OZ561, KE123, AZ615)
const FLIGHT_NUMBER_RE = /\b[A-Z]{1,2}\d{3,4}\b/;

function getTransportEmoji(transport: string): string {
  if (!transport) return '';
  const t = transport.toLowerCase();
  const tUpper = transport.toUpperCase();

  // 비행기 키워드 또는 항공편명 패턴
  if (
    t.includes('비행기') || t.includes('항공') || t.includes('flight') || t.includes('기내') ||
    t.includes('아시아나') || t.includes('대한항공') || t.includes('진에어') ||
    t.includes('에어서울') || t.includes('티웨이') || t.includes('제주항공') ||
    t.includes('ryanair') || t.includes('easyjet') || t.includes('alitalia') ||
    t.includes('라이언') || t.includes('이지젯') || t.includes('이타에어') ||
    t.includes('공항') || t.includes('귀국') || t.includes('출국') ||
    t.includes('인천') || t.includes('airport') || t.includes('terminal') ||
    t.includes('터미널') || t.includes('탑승') || t.includes('boarding') ||
    FLIGHT_NUMBER_RE.test(tUpper)
  ) return '✈️';

  // 기차 키워드
  if (
    t.includes('기차') || t.includes('이탈로') || t.includes('italo') ||
    t.includes('트레니') || t.includes('trenitalia') || t.includes('레지오') ||
    t.includes('regionale') || t.includes('열차') || t.includes('철도') ||
    t.includes('frec') || / ic\b/.test(t) || / ec\b/.test(t)
  ) return '🚆';

  if (t.includes('버스') || t.includes('bus') || t.includes('coach')) return '🚌';
  if (t.includes('지하철') || t.includes('metro') || t.includes('subway')) return '🚇';
  if (t.includes('택시') || t.includes('cab')) return '🚕';
  if (t.includes('도보') || t.includes('걷기') || t.includes('walk')) return '🚶';
  if (t.includes('선박') || t.includes('ferry') || t.includes('크루즈') || t.includes('배')) return '🚢';
  return '🚗';
}

// ── 편집 가능 필드 (수정 버튼) ──

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (v: string) => void;
  canEdit: boolean;
}

function EditableField({ label, value, onSave, canEdit }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleOpen = () => {
    setDraft(value);
    setEditing(true);
  };

  const handleSave = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-b-0">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
        {canEdit && !editing && (
          <button
            onClick={handleOpen}
            className="text-[11px] text-indigo-400 hover:text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-colors flex-shrink-0"
          >
            수정
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={3}
            className="w-full text-sm text-gray-800 border border-indigo-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="text-xs bg-indigo-500 text-white px-4 py-1.5 rounded-full hover:bg-indigo-600 font-medium"
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              className="text-xs bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full hover:bg-gray-200 font-medium"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
          value ? 'text-gray-800' : 'text-gray-300 italic'
        }`}>
          {value || '—'}
        </p>
      )}
    </div>
  );
}

// ── 일자별 카드 ──

function DailyCard({
  row, onUpdate, canEdit, index, color, onAccomClick,
}: {
  row: ScheduleRow;
  onUpdate: (id: string, updates: Partial<ScheduleRow>) => void;
  canEdit: boolean;
  index: number;
  color: typeof CITY_COLORS[number];
  onAccomClick?: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasRoute = row.departure || row.arrival;
  const hasFixed = hasRoute || row.transport || row.accommodation || row.breakfast;
  const transportEmoji = row.transport
    ? getTransportEmoji(row.transport)
    : (hasRoute ? '🚗' : '');

  const dateLabel = fmtDateShort(row.date);

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      {/* 헤더 */}
      <button
        className={`w-full px-4 py-3.5 flex items-center gap-3 text-left ${color.header} transition-colors active:opacity-80`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col items-center justify-center w-9 h-9 rounded-xl bg-white/70 flex-shrink-0 shadow-sm">
          <span className="text-[9px] text-gray-400 font-bold leading-none uppercase">Day</span>
          <span className="text-sm font-bold text-slate-700 leading-tight">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-700 text-sm">{dateLabel}</span>
            {row.city && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color.badge}`}>
                {row.city}
              </span>
            )}
          </div>
          {row.mainSchedule && (
            <p className="text-xs text-gray-500 mt-0.5 truncate leading-snug">{row.mainSchedule}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {transportEmoji && <span className="text-base leading-none">{transportEmoji}</span>}
          {row.accommodation && <span className="text-sm leading-none">🏨</span>}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* 상세 내용 */}
      {expanded && (
        <div className="bg-white">
          {/* 고정 정보 */}
          {hasFixed && (
            <div className={`px-4 py-3 bg-gray-50 border-t ${color.divider} space-y-2`}>
              {(hasRoute || row.transport) && (
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0 mt-0.5">{transportEmoji || '🚗'}</span>
                  <div className="flex-1 min-w-0">
                    {hasRoute && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 flex-wrap">
                        {row.departure && <span className="font-semibold">{row.departure}</span>}
                        {row.departure && row.arrival && (
                          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        )}
                        {row.arrival && <span className="font-semibold">{row.arrival}</span>}
                      </div>
                    )}
                    {row.transport && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{row.transport}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {row.accommodation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccomClick?.(row.accommodation);
                    }}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 font-medium hover:bg-sky-100 active:scale-95 transition-all"
                  >
                    🏨 {row.accommodation}
                  </button>
                )}
                {row.breakfast && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium ${
                    row.breakfast === '포함'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>
                    🍳 조식 {row.breakfast}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 편집 가능 필드 */}
          <div>
            <EditableField label="주요일정" value={row.mainSchedule} onSave={(v) => onUpdate(row.id, { mainSchedule: v })} canEdit={canEdit} />
            <EditableField label="이동계획" value={row.movePlan} onSave={(v) => onUpdate(row.id, { movePlan: v })} canEdit={canEdit} />
            <EditableField label="준비할 것" value={row.preparation} onSave={(v) => onUpdate(row.id, { preparation: v })} canEdit={canEdit} />
            <EditableField label="메모" value={row.memo} onSave={(v) => onUpdate(row.id, { memo: v })} canEdit={canEdit} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── 숙소만 보기 (구글시트 "숙소" 탭 직접 사용) ──

function AccomEditField({
  label,
  value,
  onSave,
  canEdit,
  isUrl,
}: {
  label: string;
  value: string | undefined;
  onSave: (v: string) => void;
  canEdit: boolean;
  isUrl?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const handleSave = () => {
    if (draft !== (value ?? '')) onSave(draft);
    setEditing(false);
  };

  const displayVal = value || '';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
      <span className="text-[11px] text-gray-400 font-semibold w-20 flex-shrink-0 pt-0.5">{label}</span>
      {editing ? (
        <div className="flex-1 space-y-1.5">
          <input
            type={isUrl ? 'url' : 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full border border-indigo-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-full hover:bg-indigo-600 font-medium">저장</button>
            <button onClick={() => { setDraft(value ?? ''); setEditing(false); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 font-medium">취소</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-start justify-between gap-2">
          {isUrl && displayVal ? (
            <a href={displayVal} target="_blank" rel="noopener noreferrer"
              className="text-sm text-indigo-500 hover:text-indigo-700 underline truncate flex-1">
              {displayVal}
            </a>
          ) : (
            <span className={`text-sm flex-1 leading-relaxed ${displayVal ? 'text-gray-800' : 'text-gray-300 italic'}`}>
              {displayVal || '—'}
            </span>
          )}
          {canEdit && (
            <button
              onClick={() => { setDraft(value ?? ''); setEditing(true); }}
              className="flex-shrink-0 text-[11px] text-indigo-400 hover:text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              수정
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AccommodationView({ canEdit, highlightAccom }: { canEdit: boolean; highlightAccom?: string }) {
  const [accommodations, setAccommodations] = useState<AccommodationCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFromSheet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await readSheetDirect('숙소');
      const parsed = sheetDataToAccommodations(rows);
      setAccommodations(parsed);
      // highlightAccom이 있으면 이름이 일치하는 숙소 자동 펼치기
      if (highlightAccom) {
        const match = parsed.find(a =>
          a.name.trim().toLowerCase().includes(highlightAccom.trim().toLowerCase()) ||
          highlightAccom.trim().toLowerCase().includes(a.name.trim().toLowerCase())
        );
        if (match) setExpandedId(match.id);
      }
    } catch {
      setError('구글시트에서 숙소 정보를 가져오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [highlightAccom]);

  useEffect(() => { fetchFromSheet(); }, [fetchFromSheet]);

  const handleUpdate = useCallback(async (accId: string, updates: Partial<AccommodationCandidate>) => {
    // 로컬 상태 업데이트
    const updated = accommodations.map(a => a.id === accId ? { ...a, ...updates } : a);
    setAccommodations(updated);
    // 구글시트에 직접 저장
    setSaving(true);
    try {
      const { headers, rows } = accommodationsToSheetData(updated);
      await syncSheet('숙소', headers, rows);
    } catch {
      // 저장 실패해도 로컬 상태는 유지
    } finally {
      setSaving(false);
    }
  }, [accommodations]);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400 space-y-2">
        <p className="text-3xl animate-pulse">🏨</p>
        <p className="text-sm font-medium">구글시트에서 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-3xl">⚠️</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchFromSheet}
          className="text-sm text-sky-500 hover:text-sky-700 font-medium underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (accommodations.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 space-y-2">
        <p className="text-3xl">🏨</p>
        <p className="text-sm font-medium">숙소 정보가 없어요</p>
        <p className="text-xs text-gray-300">구글시트 '숙소' 탭을 확인하세요</p>
      </div>
    );
  }

  const fmtDate = (d: string) => d ? fmtDateShort(d) : '—';

  const sorted = [...accommodations].sort((a, b) => {
    if (!a.checkIn) return 1;
    if (!b.checkIn) return -1;
    return a.checkIn.localeCompare(b.checkIn);
  });

  return (
    <div className="space-y-3">
      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={fetchFromSheet}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:border-sky-300 hover:text-sky-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.01M20 20v-5h-.01M4 9a9 9 0 0115-4.47M20 15a9 9 0 01-15 4.47" />
          </svg>
          시트에서 새로고침
        </button>
      </div>

      {saving && (
        <p className="text-xs text-center text-indigo-400">저장 중...</p>
      )}

      {sorted.map((acc) => {
        const isOpen = expandedId === acc.id;
        return (
          <div key={acc.id} className="rounded-2xl overflow-hidden shadow-sm">
            <button
              className="w-full px-4 py-3.5 bg-sky-50 flex items-center gap-3 text-left active:opacity-80"
              onClick={() => setExpandedId(isOpen ? null : acc.id)}
            >
              <span className="text-2xl flex-shrink-0">🏨</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{acc.name}</p>
                <p className="text-xs text-sky-600 font-medium mt-0.5">
                  {acc.city}
                  {acc.checkIn && acc.checkOut && ` · ${fmtDate(acc.checkIn)} ~ ${fmtDate(acc.checkOut)}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {acc.isBooked && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">예약완료</span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="bg-white border-t border-sky-100">
                <div className="px-4 py-3 space-y-2.5 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase mb-0.5">체크인</p>
                      <p className="text-sm font-bold text-gray-800">{fmtDate(acc.checkIn ?? '')}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase mb-0.5">체크아웃</p>
                      <p className="text-sm font-bold text-gray-800">{fmtDate(acc.checkOut ?? '')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {acc.breakfast && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        acc.breakfast === '포함' || acc.breakfast === 'O'
                          ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>🍳 조식 {acc.breakfast}</span>
                    )}
                    {acc.slippers && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        acc.slippers === 'O' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-400'
                      }`}>🥿 실내화 {acc.slippers}</span>
                    )}
                    {acc.hairDryer && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        acc.hairDryer === 'O' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
                      }`}>💨 헤어드라이기 {acc.hairDryer}</span>
                    )}
                  </div>
                  {acc.memo && (
                    <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-3 py-2">{acc.memo}</p>
                  )}
                  {acc.googleMapsUrl && (
                    <a href={acc.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-500 hover:text-sky-700 font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      구글맵에서 보기
                    </a>
                  )}
                </div>
                <div className="px-4 py-1">
                  <AccomEditField label="어메니티" value={acc.amenities} onSave={(v) => handleUpdate(acc.id, { amenities: v })} canEdit={canEdit} />
                  <AccomEditField label="실내화" value={acc.slippers} onSave={(v) => handleUpdate(acc.id, { slippers: v })} canEdit={canEdit} />
                  <AccomEditField label="헤어드라이기" value={acc.hairDryer} onSave={(v) => handleUpdate(acc.id, { hairDryer: v })} canEdit={canEdit} />
                  <AccomEditField label="조식" value={acc.breakfast} onSave={(v) => handleUpdate(acc.id, { breakfast: v })} canEdit={canEdit} />
                  <AccomEditField label="호텔후기링크" value={acc.reviewLink} onSave={(v) => handleUpdate(acc.id, { reviewLink: v })} canEdit={canEdit} isUrl />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 교통만 보기 ──

function TransportView({ rows }: { rows: ScheduleRow[] }) {
  const transportRows = rows.filter((r) => r.departure || r.arrival || r.transport);

  if (transportRows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 space-y-2">
        <p className="text-3xl">🚆</p>
        <p className="text-sm font-medium">교통 정보가 없어요</p>
        <p className="text-xs text-gray-300">구글시트 동기화 후 확인하세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transportRows.map((row, i) => {
        const emoji = getTransportEmoji(row.transport);
        return (
          <div key={i} className="rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="px-4 py-3.5 bg-emerald-50 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">{emoji || '🚗'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-700 text-sm">{fmtDateShort(row.date)}</span>
                  {row.city && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      {row.city}
                    </span>
                  )}
                </div>
                {(row.departure || row.arrival) && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-700 mt-0.5 flex-wrap">
                    {row.departure && <span className="font-semibold">{row.departure}</span>}
                    {row.departure && row.arrival && (
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                    {row.arrival && <span className="font-semibold">{row.arrival}</span>}
                  </div>
                )}
              </div>
            </div>
            {row.transport && (
              <div className="px-4 py-2.5">
                <p className="text-sm text-gray-600 leading-relaxed">{row.transport}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ──

interface AllScheduleBoardProps {
  canEdit: boolean;
  view?: ScheduleView;
  onAccomClick?: (name: string) => void;
  highlightAccom?: string;
}

export function AllScheduleBoard({ canEdit, view = 'daily', onAccomClick, highlightAccom }: AllScheduleBoardProps) {
  const { rows, loading, updateRow } = useScheduleRows();
  const syncStatus = useSyncStatus();
  const [retrying, setRetrying] = useState(false);

  // 데이터가 없을 때 자동으로 동기화 시도
  useEffect(() => {
    if (!loading && rows.length === 0 && syncStatus === 'idle') {
      void triggerSync();
    }
  }, [loading, rows.length, syncStatus]);

  const handleRetry = async () => {
    setRetrying(true);
    await triggerSync();
    setRetrying(false);
  };

  const cityColorMap = useMemo(() => buildCityColorMap(rows), [rows]);

  const isSyncing = syncStatus === 'syncing' || loading || retrying;

  if (isSyncing && rows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 space-y-3">
        <p className="text-3xl animate-pulse">📡</p>
        <p className="text-sm font-medium">구글시트에서 데이터 불러오는 중...</p>
        <p className="text-xs text-gray-300">잠시만 기다려 주세요</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 space-y-3">
        <p className="text-3xl">{syncStatus === 'error' ? '⚠️' : '📋'}</p>
        <p className="text-sm font-medium">
          {syncStatus === 'error' ? '구글시트 연결에 실패했어요' : '일정 데이터가 없어요'}
        </p>
        <p className="text-xs text-gray-300">
          {syncStatus === 'error' ? '네트워크 또는 시트 권한을 확인해 주세요' : '구글시트 \'모든일정\' 탭을 확인해 주세요'}
        </p>
        <button
          onClick={handleRetry}
          disabled={isSyncing}
          className="mt-2 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-full bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.01M20 20v-5h-.01M4 9a9 9 0 0115-4.47M20 15a9 9 0 01-15 4.47" />
          </svg>
          다시 불러오기
        </button>
      </div>
    );
  }

  if (view === 'accommodation') return <AccommodationView canEdit={canEdit} highlightAccom={highlightAccom} />;
  if (view === 'transport') return <TransportView rows={rows} />;

  return (
    <div className="space-y-2.5">
      {rows.map((row, index) => (
        <DailyCard
          key={row.id}
          row={row}
          onUpdate={updateRow}
          canEdit={canEdit}
          index={index}
          color={cityColorMap.get(row.city?.trim() || '기타') ?? CITY_COLORS[0]}
          onAccomClick={onAccomClick}
        />
      ))}
    </div>
  );
}
