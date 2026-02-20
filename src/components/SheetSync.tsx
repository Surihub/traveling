import { useState, useEffect } from 'react';
import { useTrip, useDays, useAccommodations, useShopping, useChecklist, useTransport } from '../hooks/useTrip';
import {
  getScriptUrl,
  setScriptUrl,
  clearScriptUrl,
  resetScriptUrlToDefault,
  getDefaultScriptUrl,
  isUsingDefaultScriptUrl,
  hasCustomScriptUrl,
  SHEET_URL_EVENT,
  readSheet,
  syncSheet,
  testConnection,
  flightToSheetData,
  sheetDataToFlight,
  daysToSheetData,
  sheetDataToDays,
  accommodationsToSheetData,
  sheetDataToAccommodations,
  shoppingToSheetData,
  sheetDataToShopping,
  checklistToSheetData,
  sheetDataToChecklist,
  transportToSheetData,
  sheetDataToTransport,
} from '../utils/googleSheets';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncState {
  status: SyncStatus;
  message?: string;
}

interface SheetSyncProps {
  canEdit: boolean;
}

const LAST_SYNC_KEY = 'travel_last_sheet_sync';

export function SheetSync({ canEdit }: SheetSyncProps) {
  const { trip, updateFlight } = useTrip();
  const { days } = useDays();
  const { items: accommodations } = useAccommodations();
  const { items: shopping } = useShopping();
  const { items: checklist } = useChecklist();
  const { items: transport } = useTransport();

  const [scriptUrl, setUrl] = useState(getScriptUrl() || '');
  const [isConnected, setIsConnected] = useState(!!getScriptUrl());
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [usingDefaultUrl, setUsingDefaultUrl] = useState(isUsingDefaultScriptUrl());
  const [hasCustomUrl, setHasCustomUrl] = useState(hasCustomScriptUrl());
  const [testing, setTesting] = useState(false);

  const [flightSync, setFlightSync] = useState<SyncState>({ status: 'idle' });
  const [scheduleSync, setScheduleSync] = useState<SyncState>({ status: 'idle' });
  const [accomSync, setAccomSync] = useState<SyncState>({ status: 'idle' });
  const [shopSync, setShopSync] = useState<SyncState>({ status: 'idle' });
  const [checkSync, setCheckSync] = useState<SyncState>({ status: 'idle' });
  const [transportSync, setTransportSync] = useState<SyncState>({ status: 'idle' });
  const [allSync, setAllSync] = useState<SyncState>({ status: 'idle' });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const defaultScriptUrl = getDefaultScriptUrl();

  useEffect(() => {
    setLastSyncTime(localStorage.getItem(LAST_SYNC_KEY));
  }, []);

  useEffect(() => {
    const handler = () => {
      const current = getScriptUrl();
      setUrl(current || '');
      setIsConnected(!!current);
      setUsingDefaultUrl(isUsingDefaultScriptUrl());
      setHasCustomUrl(hasCustomScriptUrl());
    };
    window.addEventListener(SHEET_URL_EVENT, handler);
    return () => window.removeEventListener(SHEET_URL_EVENT, handler);
  }, []);

  const handleConnect = async () => {
    if (!scriptUrl.trim()) return;
    setTesting(true);
    setScriptUrl(scriptUrl.trim());
    try {
      const ok = await testConnection();
      if (ok) {
        setIsConnected(true);
        setShowUrlInput(false);
        setUsingDefaultUrl(false);
        setHasCustomUrl(true);
      } else {
        setIsConnected(true); // 연결 시도는 저장
        setShowUrlInput(false);
        setUsingDefaultUrl(false);
        setHasCustomUrl(true);
      }
    } catch {
      setIsConnected(true);
      setShowUrlInput(false);
      setUsingDefaultUrl(false);
      setHasCustomUrl(true);
    }
    setTesting(false);
  };

  const handleDisconnect = () => {
    clearScriptUrl();
    setIsConnected(false);
    setUrl('');
    setUsingDefaultUrl(false);
    setHasCustomUrl(false);
    setShowUrlInput(false);
  };

  const handleUseDefault = () => {
    resetScriptUrlToDefault();
    const current = getScriptUrl();
    setUrl(current || '');
    setIsConnected(!!current);
    setUsingDefaultUrl(isUsingDefaultScriptUrl());
    setHasCustomUrl(hasCustomScriptUrl());
    setShowUrlInput(false);
  };

  const updateLastSync = () => {
    const now = new Date().toLocaleString('ko-KR');
    localStorage.setItem(LAST_SYNC_KEY, now);
    setLastSyncTime(now);
  };

  // --- 내보내기 (앱 → 시트) ---

  const exportFlight = async () => {
    if (!trip?.flight) { setFlightSync({ status: 'error', message: '항공편 정보가 없습니다' }); return; }
    setFlightSync({ status: 'syncing' });
    try {
      const { headers, rows } = flightToSheetData(trip.flight);
      await syncSheet('항공편', headers, rows);
      setFlightSync({ status: 'success', message: '항공편 내보내기 완료' });
      updateLastSync();
    } catch (e: unknown) {
      setFlightSync({ status: 'error', message: (e as Error).message });
    }
  };

  const exportSchedule = async () => {
    setScheduleSync({ status: 'syncing' });
    try {
      const { headers, rows } = daysToSheetData(days);
      await syncSheet('일정', headers, rows);
      setScheduleSync({ status: 'success', message: `${days.length}일 일정 내보내기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setScheduleSync({ status: 'error', message: (e as Error).message });
    }
  };

  const exportAccommodations = async () => {
    setAccomSync({ status: 'syncing' });
    try {
      const { headers, rows } = accommodationsToSheetData(accommodations);
      await syncSheet('숙소', headers, rows);
      setAccomSync({ status: 'success', message: `${accommodations.length}개 숙소 내보내기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setAccomSync({ status: 'error', message: (e as Error).message });
    }
  };

  const exportShopping = async () => {
    setShopSync({ status: 'syncing' });
    try {
      const { headers, rows } = shoppingToSheetData(shopping);
      await syncSheet('쇼핑', headers, rows);
      setShopSync({ status: 'success', message: `${shopping.length}개 쇼핑 내보내기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setShopSync({ status: 'error', message: (e as Error).message });
    }
  };

  const exportChecklist = async () => {
    setCheckSync({ status: 'syncing' });
    try {
      const { headers, rows } = checklistToSheetData(checklist);
      await syncSheet('체크리스트', headers, rows);
      setCheckSync({ status: 'success', message: `${checklist.length}개 체크리스트 내보내기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setCheckSync({ status: 'error', message: (e as Error).message });
    }
  };

  const exportTransport = async () => {
    setTransportSync({ status: 'syncing' });
    try {
      const { headers, rows } = transportToSheetData(transport);
      await syncSheet('교통', headers, rows);
      setTransportSync({ status: 'success', message: `${transport.length}건 교통 일정 내보내기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setTransportSync({ status: 'error', message: (e as Error).message });
    }
  };

  const exportAll = async () => {
    setAllSync({ status: 'syncing' });
    try {
      await exportFlight();
      await exportSchedule();
      await exportAccommodations();
      await exportShopping();
      await exportChecklist();
      await exportTransport();
      setAllSync({ status: 'success', message: '전체 내보내기 완료' });
      updateLastSync();
    } catch (e: unknown) {
      setAllSync({ status: 'error', message: (e as Error).message });
    }
  };

  // --- 가져오기 (시트 → 앱) ---

  const importFlight = async () => {
    if (!canEdit) return;
    setFlightSync({ status: 'syncing' });
    try {
      const rows = await readSheet('항공편');
      const flight = sheetDataToFlight(rows);
      if (!flight) { setFlightSync({ status: 'error', message: '시트에서 항공편 데이터를 찾을 수 없습니다' }); return; }
      await updateFlight(flight);
      setFlightSync({ status: 'success', message: '항공편 가져오기 완료' });
      updateLastSync();
    } catch (e: unknown) {
      setFlightSync({ status: 'error', message: (e as Error).message });
    }
  };

  const importSchedule = async () => {
    if (!canEdit) return;
    setScheduleSync({ status: 'syncing' });
    try {
      const rows = await readSheet('일정');
      const importedDays = sheetDataToDays(rows);
      const stored = localStorage.getItem('italy_trip_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.days = importedDays;
        localStorage.setItem('italy_trip_data', JSON.stringify(data));
        window.dispatchEvent(new Event('tripDataChanged'));
      }
      setScheduleSync({ status: 'success', message: `${importedDays.length}일 일정 가져오기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setScheduleSync({ status: 'error', message: (e as Error).message });
    }
  };

  const importAccommodations = async () => {
    if (!canEdit) return;
    setAccomSync({ status: 'syncing' });
    try {
      const rows = await readSheet('숙소');
      const imported = sheetDataToAccommodations(rows);
      const stored = localStorage.getItem('italy_trip_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.accommodations = imported;
        localStorage.setItem('italy_trip_data', JSON.stringify(data));
        window.dispatchEvent(new Event('tripDataChanged'));
      }
      setAccomSync({ status: 'success', message: `${imported.length}개 숙소 가져오기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setAccomSync({ status: 'error', message: (e as Error).message });
    }
  };

  const importShopping = async () => {
    if (!canEdit) return;
    setShopSync({ status: 'syncing' });
    try {
      const rows = await readSheet('쇼핑');
      const imported = sheetDataToShopping(rows);
      const stored = localStorage.getItem('italy_trip_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.shopping = imported;
        localStorage.setItem('italy_trip_data', JSON.stringify(data));
        window.dispatchEvent(new Event('tripDataChanged'));
      }
      setShopSync({ status: 'success', message: `${imported.length}개 쇼핑 가져오기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setShopSync({ status: 'error', message: (e as Error).message });
    }
  };

  const importChecklist = async () => {
    if (!canEdit) return;
    setCheckSync({ status: 'syncing' });
    try {
      const rows = await readSheet('체크리스트');
      const imported = sheetDataToChecklist(rows);
      const stored = localStorage.getItem('italy_trip_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.checklist = imported;
        localStorage.setItem('italy_trip_data', JSON.stringify(data));
        window.dispatchEvent(new Event('tripDataChanged'));
      }
      setCheckSync({ status: 'success', message: `${imported.length}개 체크리스트 가져오기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setCheckSync({ status: 'error', message: (e as Error).message });
    }
  };

  const importAll = async () => {
    if (!canEdit) return;
    if (!window.confirm('시트의 데이터로 앱의 모든 데이터를 덮어씁니다. 계속하시겠습니까?')) return;
    setAllSync({ status: 'syncing' });
    try {
      await importFlight();
      await importSchedule();
      await importAccommodations();
      await importShopping();
      await importChecklist();
      await importTransport();
      setAllSync({ status: 'success', message: '전체 가져오기 완료' });
      updateLastSync();
    } catch (e: unknown) {
      setAllSync({ status: 'error', message: (e as Error).message });
    }
  };

  const importTransport = async () => {
    if (!canEdit) return;
    setTransportSync({ status: 'syncing' });
    try {
      const rows = await readSheet('교통');
      const imported = sheetDataToTransport(rows);
      const stored = localStorage.getItem('italy_trip_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.transport = imported;
        localStorage.setItem('italy_trip_data', JSON.stringify(data));
        window.dispatchEvent(new Event('tripDataChanged'));
      }
      setTransportSync({ status: 'success', message: `${imported.length}건 교통 일정 가져오기 완료` });
      updateLastSync();
    } catch (e: unknown) {
      setTransportSync({ status: 'error', message: (e as Error).message });
    }
  };

  const statusIcon = (state: SyncState) => {
    if (state.status === 'syncing') return (
      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    );
    if (state.status === 'success') return (
      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
    if (state.status === 'error') return (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
    return null;
  };

  type SyncItem = {
    label: string;
    icon: string;
    count: string;
    state: SyncState;
    onExport: () => void;
    onImport: () => void;
  };

  const syncItems: SyncItem[] = [
    {
      label: '항공편', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
      count: trip?.flight ? '2편' : '없음',
      state: flightSync, onExport: exportFlight, onImport: importFlight,
    },
    {
      label: '일정', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      count: `${days.length}일`,
      state: scheduleSync, onExport: exportSchedule, onImport: importSchedule,
    },
    {
      label: '숙소', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      count: `${accommodations.length}곳`,
      state: accomSync, onExport: exportAccommodations, onImport: importAccommodations,
    },
    {
      label: '쇼핑', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      count: `${shopping.length}개`,
      state: shopSync, onExport: exportShopping, onImport: importShopping,
    },
    {
      label: '체크리스트', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      count: `${checklist.length}개`,
      state: checkSync, onExport: exportChecklist, onImport: importChecklist,
    },
    {
      label: '교통', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      count: `${transport.length}건`,
      state: transportSync, onExport: exportTransport, onImport: importTransport,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Google Sheets 연결
          </h3>
          <span className={`text-xs rounded-full px-3 py-1 font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isConnected ? '연결됨' : '미연결'}
          </span>
        </div>

        {isConnected && !showUrlInput ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 break-all bg-gray-50 px-3 py-2 rounded-lg">
              {scriptUrl}
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => setShowUrlInput(true)}
                className="text-xs text-blue-600 hover:text-blue-700">URL 변경</button>
              {hasCustomUrl ? (
                <>
                  <button onClick={handleDisconnect}
                    className="text-xs text-red-500 hover:text-red-600">연결 해제</button>
                  {defaultScriptUrl && (
                    <button onClick={handleUseDefault}
                      className="text-xs text-emerald-600 hover:text-emerald-700">공유 URL로 전환</button>
                  )}
                </>
              ) : (
                <span className="text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  공유 URL 자동 사용
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Google Apps Script 배포 URL을 입력하거나 공유 URL을 사용하세요.
            </p>
            <input
              type="url"
              value={scriptUrl}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={handleConnect} disabled={!scriptUrl.trim() || testing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">
                {testing ? '연결 테스트 중...' : '연결'}
              </button>
              {showUrlInput && (
                <button onClick={() => setShowUrlInput(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                  취소
                </button>
              )}
              {!isConnected && defaultScriptUrl && (
                <button onClick={handleUseDefault}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600">
                  공유 URL 자동 연결
                </button>
              )}
            </div>
          </div>
        )}

        {lastSyncTime && (
          <p className="text-xs text-gray-400 mt-3">
            마지막 동기화: {lastSyncTime}
          </p>
        )}
      </div>

      {isConnected && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900">자동 동기화 켜짐</p>
              <p className="text-xs text-blue-800">
                앱에서 데이터를 수정하면 1~2초 안에 현재 시트로 즉시 전송되고, 시트 변경분도 가져올 수 있습니다. 별도의 내보내기/가져오기가 필요하지 않습니다.
              </p>
              {usingDefaultUrl && defaultScriptUrl && (
                <p className="text-[11px] text-blue-700 break-all mt-2">
                  모든 방문자는 공유 URL로 동기화됩니다: {defaultScriptUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isConnected && (
        <p className="text-xs text-gray-500 text-center">
          문제가 생겼을 때만 아래 버튼으로 수동 동기화를 실행하세요.
        </p>
      )}

      {/* How to setup guide */}
      {!isConnected && (
        <details className="bg-white rounded-xl shadow-sm border">
          <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50">
            설정 가이드 (처음이라면 펼쳐보세요)
          </summary>
          <div className="px-5 pb-5 space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
              <p>구글 시트를 새로 만드세요</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
              <p>상단 메뉴 <strong>확장 프로그램 &rarr; Apps Script</strong> 클릭</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="mb-2">아래 코드를 전체 복사해서 붙여넣기:</p>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs leading-relaxed whitespace-pre">{`const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID);
  const sheetName = e.parameter.sheet || 'Sheet1';
  if (sheetName === '_ping') {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  const ws = sheet.getSheetByName(sheetName);
  if (!ws) return ContentService.createTextOutput(
    JSON.stringify({ error: 'not found' })
  ).setMimeType(ContentService.MimeType.JSON);
  const data = ws.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return ContentService.createTextOutput(
    JSON.stringify(rows)
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID);
  const body = JSON.parse(e.postData.contents);
  const sheetName = body.sheet || 'Sheet1';
  const action = body.action;
  let ws = sheet.getSheetByName(sheetName);
  if (!ws) ws = sheet.insertSheet(sheetName);
  if (action === 'sync') {
    ws.clearContents();
    const headers = body.headers;
    const rows = body.rows;
    ws.getRange(1, 1, 1, headers.length)
      .setValues([headers]);
    if (rows.length > 0) {
      ws.getRange(2, 1, rows.length, headers.length)
        .setValues(rows);
    }
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, count: rows.length })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(
    JSON.stringify({ error: 'unknown action' })
  ).setMimeType(ContentService.MimeType.JSON);
}`}</pre>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
              <p><strong>배포 &rarr; 새 배포</strong> &rarr; 유형: <strong>웹 앱</strong> &rarr; 액세스: <strong>모든 사용자</strong> &rarr; 배포</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">5</span>
              <p>배포된 <strong>URL을 복사</strong>해서 위 입력란에 붙여넣기</p>
            </div>
          </div>
        </details>
      )}

      {/* Sync actions */}
      {isConnected && (
        <>
          {/* Full sync buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={exportAll} disabled={allSync.status === 'syncing'}
              className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow text-left disabled:opacity-50">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-bold text-gray-800">전체 내보내기</span>
                {statusIcon(allSync)}
              </div>
              <p className="text-xs text-gray-500">앱 &rarr; 시트</p>
            </button>

            <button onClick={importAll} disabled={!canEdit || allSync.status === 'syncing'}
              className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow text-left disabled:opacity-50">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="text-sm font-bold text-gray-800">전체 가져오기</span>
                {statusIcon(allSync)}
              </div>
              <p className="text-xs text-gray-500">
                시트 &rarr; 앱
                {!canEdit && <span className="text-red-400 ml-1">(수정모드 필요)</span>}
              </p>
            </button>
          </div>

          {allSync.message && (
            <p className={`text-xs text-center ${allSync.status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {allSync.message}
            </p>
          )}

          {/* Individual sync */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">수동 동기화 (필요 시)</h3>
            {syncItems.map(item => (
              <div key={item.label} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.count}</p>
                    </div>
                    {statusIcon(item.state)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={item.onExport} disabled={item.state.status === 'syncing'}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
                      title="앱 → 시트">
                      내보내기
                    </button>
                    <button onClick={item.onImport} disabled={!canEdit || item.state.status === 'syncing'}
                      className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50"
                      title="시트 → 앱">
                      가져오기
                    </button>
                  </div>
                </div>
                {item.state.message && (
                  <p className={`mt-2 text-xs ${item.state.status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {item.state.message}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-xs font-bold text-yellow-700 mb-2">사용 팁</p>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>- 모든 변경사항은 자동으로 연결된 시트에 업로드됩니다 (1~2초 지연).</li>
              <li>- <strong>내보내기</strong>는 누구나 가능, <strong>가져오기</strong>는 수정모드에서만 가능</li>
              <li>- 시트에서 직접 수정한 후 <strong>가져오기</strong>하면 앱에 반영됩니다</li>
              <li>- 내보내기 시 해당 시트 탭의 기존 데이터는 <strong>덮어씌워집니다</strong></li>
              <li>- 시트 탭: 항공편, 일정, 숙소, 쇼핑, 체크리스트 (자동 생성)</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
