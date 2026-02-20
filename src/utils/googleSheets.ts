import type {
  Day, TripItem, AccommodationCandidate, ShoppingItem, ChecklistItem,
  FlightLeg, FlightInfo, TransportBooking, MemoNote,
} from '../types';

const SCRIPT_URL_KEY = 'travel_google_script_url';
const DISABLED_MARK = '__DISABLED__';
export const SHEET_URL_EVENT = 'sheetScriptUrlChanged';
const ENV_SCRIPT_URL = (import.meta.env.VITE_DEFAULT_SHEET_URL || '').trim();
const BUILTIN_SCRIPT_URL = ENV_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyrgwTQL7nWHhyZNJBAZj359zTBtMtHK3twDQ-6d3HQN9roqOLw0qUJzQnh6cm0g2lH7Q/exec';

function emitScriptUrlChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SHEET_URL_EVENT));
}

export function getScriptUrl(): string | null {
  const stored = localStorage.getItem(SCRIPT_URL_KEY);
  if (!stored || stored === '') {
    return BUILTIN_SCRIPT_URL || null;
  }
  if (stored === DISABLED_MARK) return null;
  return stored;
}
export function setScriptUrl(url: string) {
  localStorage.setItem(SCRIPT_URL_KEY, url);
  emitScriptUrlChanged();
}
export function clearScriptUrl() {
  if (BUILTIN_SCRIPT_URL) {
    localStorage.setItem(SCRIPT_URL_KEY, DISABLED_MARK);
  } else {
    localStorage.removeItem(SCRIPT_URL_KEY);
  }
  emitScriptUrlChanged();
}

export function resetScriptUrlToDefault() {
  localStorage.removeItem(SCRIPT_URL_KEY);
  emitScriptUrlChanged();
}

export function getDefaultScriptUrl(): string | null {
  return BUILTIN_SCRIPT_URL || null;
}

export function isUsingDefaultScriptUrl(): boolean {
  const stored = localStorage.getItem(SCRIPT_URL_KEY);
  return (!stored || stored === '') && !!BUILTIN_SCRIPT_URL;
}

export function hasCustomScriptUrl(): boolean {
  const stored = localStorage.getItem(SCRIPT_URL_KEY);
  if (!stored) return false;
  return stored !== '' && stored !== DISABLED_MARK;
}

// ── CORS-safe fetch for Apps Script ──
// Apps Script 302 redirect 처리: preflight 방지를 위해 Content-Type 없이 전송

async function apsFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    redirect: 'follow',
    ...options,
  });
  if (!res.ok && res.type !== 'opaque') {
    throw new Error(`HTTP ${res.status}`);
  }
  return res;
}

export async function readSheet(sheetName: string): Promise<Record<string, string>[]> {
  const url = getScriptUrl();
  if (!url) throw new Error('Apps Script URL 미설정');
  const sep = url.includes('?') ? '&' : '?';
  const res = await apsFetch(`${url}${sep}sheet=${encodeURIComponent(sheetName)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function syncSheet(
  sheetName: string,
  headers: string[],
  rows: (string | number | boolean)[][],
): Promise<{ success: boolean; count: number }> {
  const url = getScriptUrl();
  if (!url) throw new Error('Apps Script URL 미설정');

  // text/plain 으로 보내야 CORS preflight 없음
  const res = await apsFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ sheet: sheetName, action: 'sync', headers, rows }),
  });

  try {
    return await res.json();
  } catch {
    // no-cors 또는 redirect 후 body 읽기 실패 시 성공으로 간주
    return { success: true, count: rows.length };
  }
}

export async function testConnection(): Promise<boolean> {
  const url = getScriptUrl();
  if (!url) return false;
  try {
    const sep = url.includes('?') ? '&' : '?';
    const res = await apsFetch(`${url}${sep}sheet=_ping`);
    await res.json(); // 응답 파싱 가능하면 연결 성공
    return true;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════
// 데이터 변환 (앱 ↔ 시트) - 5탭 구조
// ══════════════════════════════════════

// ── [항공편] 구분, 편명, 항공사, 출발공항, 출발코드, 출발일, 출발시간, 도착공항, 도착코드, 도착일, 도착시간, 비행시간, 메모 ──

const FLIGHT_HEADERS = [
  '구분', '편명', '항공사', '출발공항', '출발코드', '출발일', '출발시간',
  '도착공항', '도착코드', '도착일', '도착시간', '비행시간', '메모',
];

function flightLegToRow(label: string, leg: FlightLeg): string[] {
  return [
    label, leg.flightNumber, leg.airline,
    leg.departureAirport, leg.departureAirportCode,
    leg.departureDate, leg.departureTime,
    leg.arrivalAirport, leg.arrivalAirportCode,
    leg.arrivalDate, leg.arrivalTime,
    leg.duration || '', leg.memo || '',
  ];
}

function rowToFlightLeg(row: Record<string, string>): FlightLeg {
  return {
    flightNumber: row['편명'] || '', airline: row['항공사'] || '',
    departureAirport: row['출발공항'] || '', departureAirportCode: row['출발코드'] || '',
    departureCity: '', departureDate: row['출발일'] || '', departureTime: row['출발시간'] || '',
    arrivalAirport: row['도착공항'] || '', arrivalAirportCode: row['도착코드'] || '',
    arrivalCity: '', arrivalDate: row['도착일'] || '', arrivalTime: row['도착시간'] || '',
    duration: row['비행시간'] || undefined, memo: row['메모'] || undefined,
  };
}

export function flightToSheetData(flight: FlightInfo) {
  return {
    headers: FLIGHT_HEADERS,
    rows: [flightLegToRow('출국', flight.outbound), flightLegToRow('귀국', flight.inbound)],
  };
}

export function sheetDataToFlight(rows: Record<string, string>[]): FlightInfo | null {
  const out = rows.find(r => r['구분'] === '출국');
  const inb = rows.find(r => r['구분'] === '귀국');
  if (!out || !inb) return null;
  return { outbound: rowToFlightLeg(out), inbound: rowToFlightLeg(inb) };
}

// ── [일정] 날짜, 도시, Day, 주요일정, 메모, 순서, 카테고리 ──

const SCHEDULE_HEADERS = ['날짜', '도시', 'Day', '주요일정', '메모', '순서', '카테고리', '숙소ID', '숙소이름', '숙소주소', '숙소지도URL'];

export function daysToSheetData(days: Day[]) {
  const rows: string[][] = [];
  days.forEach((day, idx) => {
    const stayMeta = [
      day.accommodationId || '',
      day.accommodationName || '',
      day.accommodationAddress || '',
      day.accommodationMapUrl || '',
    ];
    if (day.items.length === 0) {
      rows.push([day.date, day.city, String(idx + 1), '', '', '', '', ...stayMeta]);
    } else {
      day.items.forEach(item => {
        rows.push([
          day.date, day.city, String(idx + 1),
          item.title, item.memo || '', String(item.order), item.type,
          ...stayMeta,
        ]);
      });
    }
  });
  return { headers: SCHEDULE_HEADERS, rows };
}

export function sheetDataToDays(rows: Record<string, string>[]): Day[] {
  const dayMap = new Map<string, Day>();
  rows.forEach(row => {
    const date = String(row['날짜'] || '').trim();
    if (!date) return;
    const accommodationId = String(row['숙소ID'] || '').trim();
    const accommodationName = String(row['숙소이름'] || '').trim();
    const accommodationAddress = String(row['숙소주소'] || '').trim();
    const accommodationMapUrl = String(row['숙소지도URL'] || '').trim();
    if (!dayMap.has(date)) {
      dayMap.set(date, {
        id: `day-${date}`,
        date,
        city: String(row['도시'] || ''),
        items: [],
        accommodationId: accommodationId || undefined,
        accommodationName: accommodationName || undefined,
        accommodationAddress: accommodationAddress || undefined,
        accommodationMapUrl: accommodationMapUrl || undefined,
      });
    }
    const day = dayMap.get(date)!;
    if (!day.accommodationId && accommodationId) day.accommodationId = accommodationId;
    if (!day.accommodationName && accommodationName) day.accommodationName = accommodationName;
    if (!day.accommodationAddress && accommodationAddress) day.accommodationAddress = accommodationAddress;
    if (!day.accommodationMapUrl && accommodationMapUrl) day.accommodationMapUrl = accommodationMapUrl;
    const title = String(row['주요일정'] || '').trim();
    if (title) {
      const item: TripItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: (String(row['카테고리'] || 'etc') as TripItem['type']),
        title,
        links: [],
        memo: String(row['메모'] || '') || undefined,
        order: parseInt(String(row['순서'])) || day.items.length + 1,
        updatedAt: new Date(),
      };
      day.items.push(item);
    }
  });
  return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ── [숙소] 이름, 위치, 체크인, 체크아웃, 메모, 예약상태 ──

const ACCOM_HEADERS = ['이름', '위치', '체크인', '체크아웃', '메모', '예약상태'];

export function accommodationsToSheetData(items: AccommodationCandidate[]) {
  const rows = items.map(item => [
    item.name, item.city,
    item.checkIn || '', item.checkOut || '',
    item.memo || '',
    item.isBooked ? '예약완료' : '후보',
  ]);
  return { headers: ACCOM_HEADERS, rows };
}

export function sheetDataToAccommodations(rows: Record<string, string>[]): AccommodationCandidate[] {
  return rows.filter(r => r['이름']).map((row, i) => ({
    id: `acc-import-${Date.now()}-${i}`,
    name: String(row['이름']),
    city: String(row['위치'] || ''),
    checkIn: String(row['체크인'] || '') || undefined,
    checkOut: String(row['체크아웃'] || '') || undefined,
    memo: String(row['메모'] || '') || undefined,
    isBooked: String(row['예약상태']) === '예약완료',
    createdAt: new Date(),
  }));
}

// ── [쇼핑] 브랜드/아이템, 도시, 메모, 구매여부 ──

const SHOPPING_HEADERS = ['브랜드/아이템', '도시', '메모', '구매여부'];

export function shoppingToSheetData(items: ShoppingItem[]) {
  const rows = items.map(item => [
    item.name, item.city, item.memo || '',
    item.isPurchased ? 'O' : '',
  ]);
  return { headers: SHOPPING_HEADERS, rows };
}

export function sheetDataToShopping(rows: Record<string, string>[]): ShoppingItem[] {
  return rows.filter(r => r['브랜드/아이템']).map((row, i) => ({
    id: `shop-import-${Date.now()}-${i}`,
    name: String(row['브랜드/아이템']),
    city: String(row['도시'] || ''),
    memo: String(row['메모'] || '') || undefined,
    isPurchased: String(row['구매여부']).trim() === 'O',
    createdAt: new Date(),
  }));
}

// ── [체크리스트] 항목, 용도, 준비완료여부 ──

const CHECKLIST_HEADERS = ['항목', '용도', '준비완료여부'];

const TRANSPORT_HEADERS = ['날짜', '출발', '도착', '운행사', '열차번호', '출발시간', '도착시간', '소요시간', '좌석', '예약번호', '상태', '메모'];

export function checklistToSheetData(items: ChecklistItem[]) {
  const rows = items.map(item => [
    item.item, item.purpose, item.isReady ? 'O' : '',
  ]);
  return { headers: CHECKLIST_HEADERS, rows };
}

export function sheetDataToChecklist(rows: Record<string, string>[]): ChecklistItem[] {
  return rows.filter(r => r['항목']).map((row, i) => ({
    id: `chk-import-${Date.now()}-${i}`,
    item: String(row['항목']),
    purpose: String(row['용도'] || ''),
    isReady: String(row['준비완료여부']).trim() === 'O',
    createdAt: new Date(),
  }));
}

export function transportToSheetData(items: TransportBooking[]) {
  const rows = items.map(item => [
    item.date,
    item.from,
    item.to,
    item.provider || '',
    item.trainNumber || '',
    item.departureTime || '',
    item.arrivalTime || '',
    item.duration || '',
    item.seatInfo || '',
    item.reservationCode || '',
    item.status,
    item.memo || '',
  ]);
  return { headers: TRANSPORT_HEADERS, rows };
}

export function sheetDataToTransport(rows: Record<string, string>[]): TransportBooking[] {
  return rows.filter(r => r['날짜']).map((row, i) => ({
    id: `trans-import-${Date.now()}-${i}`,
    date: String(row['날짜'] || ''),
    from: String(row['출발'] || ''),
    to: String(row['도착'] || ''),
    provider: String(row['운행사'] || '') || undefined,
    trainNumber: String(row['열차번호'] || '') || undefined,
    departureTime: String(row['출발시간'] || '') || undefined,
    arrivalTime: String(row['도착시간'] || '') || undefined,
    duration: String(row['소요시간'] || '') || undefined,
    seatInfo: String(row['좌석'] || '') || undefined,
    reservationCode: String(row['예약번호'] || '') || undefined,
    memo: String(row['메모'] || '') || undefined,
    status: (String(row['상태'] || 'planned') as TransportBooking['status']) || 'planned',
    createdAt: new Date(),
  }));
}

// ── [메모] 제목, URL, 태그, 메모 ──

const MEMO_HEADERS = ['제목', 'URL', '태그', '메모'];

export function memosToSheetData(items: MemoNote[]) {
  const rows = items.map(item => [
    item.title,
    item.url || '',
    item.tags.join(', '),
    item.memo || '',
  ]);
  return { headers: MEMO_HEADERS, rows };
}

export function sheetDataToMemos(rows: Record<string, string>[]): MemoNote[] {
  return rows.filter(r => r['제목']).map((row, i) => ({
    id: `memo-import-${Date.now()}-${i}`,
    title: String(row['제목']),
    url: String(row['URL'] || '') || undefined,
    tags: String(row['태그'] || '').split(',').map(t => t.trim()).filter(Boolean),
    memo: String(row['메모'] || '') || undefined,
    createdAt: new Date(),
  }));
}
