import {
  SHEET_URL_EVENT,
  getScriptUrl,
  readSheetDirect,
  syncSheet,
  sheetDataToAccommodations,
  sheetDataToAllSchedule,
  allScheduleToSheetData,
  sheetDataToExpenses,
} from './googleSheets';
import { loadTripData, saveTripData } from '../hooks/useTrip';
import type { TripData } from '../types';

const AUTO_SYNC_DEBOUNCE = 1500;

let initialized = false;
let debounceId: number | null = null;
let isHydrating = false;
let isExporting = false;
let pendingExport = false;

// ── 동기화 상태 ──
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'done';
let currentSyncStatus: SyncStatus = 'idle';

function emitSyncStatus(status: SyncStatus) {
  currentSyncStatus = status;
  window.dispatchEvent(new CustomEvent('sheetSyncStatus', { detail: status }));
}

export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

function hasScriptUrl() {
  return !!getScriptUrl();
}

async function hydrateFromSheets() {
  if (isHydrating) return false;
  isHydrating = true;
  emitSyncStatus('syncing');
  try {
    // 구글시트 직접 읽기 (gviz API) — Apps Script 불필요
    // "모든일정" 탭명이 다를 경우 "일자별"도 시도
    const results = await Promise.allSettled([
      readSheetDirect('숙소'),
      readSheetDirect('모든일정').catch(() => readSheetDirect('일자별')),
      readSheetDirect('비용정리'),
    ]);

    const accomRows    = results[0].status === 'fulfilled' ? results[0].value : [];
    const scheduleRows = results[1].status === 'fulfilled' ? results[1].value : [];
    const expenseRows  = results[2].status === 'fulfilled' ? results[2].value : [];

    // 전부 실패한 경우
    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed) {
      const reason = results[0].status === 'rejected' ? results[0].reason : undefined;
      throw reason ?? new Error('시트 읽기 실패');
    }

    const current = loadTripData();
    const next: TripData = { ...current };
    let changed = false;

    if (accomRows.length > 0) {
      next.accommodations = sheetDataToAccommodations(accomRows);
      changed = true;
    }

    if (scheduleRows.length > 0) {
      const sheetParsed = sheetDataToAllSchedule(scheduleRows);
      const localRows = current.scheduleRows || [];
      next.scheduleRows = sheetParsed.map(sr => {
        const local = localRows.find(l => l.id === sr.id);
        if (local) {
          return {
            ...sr,
            mainSchedule: local.mainSchedule || sr.mainSchedule,
            movePlan: local.movePlan || sr.movePlan,
            preparation: local.preparation || sr.preparation,
            memo: local.memo || sr.memo,
          };
        }
        return sr;
      });
      changed = true;
    }

    if (expenseRows.length > 0) {
      next.expenseRows = sheetDataToExpenses(expenseRows);
      changed = true;
    }

    if (changed) saveTripData(next);
    emitSyncStatus('done');
    return changed;
  } catch (error) {
    console.error('[SheetSync] 동기화 실패:', error);
    emitSyncStatus('error');
    return false;
  } finally {
    isHydrating = false;
  }
}

async function exportAllToSheets() {
  if (!hasScriptUrl()) return;
  if (isHydrating) { pendingExport = true; return; }
  if (isExporting) { pendingExport = true; return; }
  isExporting = true;
  try {
    const data = loadTripData();
    if (data.scheduleRows && data.scheduleRows.length > 0) {
      const schedule = allScheduleToSheetData(data.scheduleRows);
      await syncSheet('모든일정', schedule.headers, schedule.rows);
    }
  } catch (error) {
    console.warn('[SheetSync] 내보내기 실패:', error);
  } finally {
    isExporting = false;
    if (pendingExport) {
      pendingExport = false;
      scheduleAutoExport();
    }
  }
}

function scheduleAutoExport() {
  if (!hasScriptUrl() || isHydrating) return;
  if (debounceId) window.clearTimeout(debounceId);
  debounceId = window.setTimeout(() => {
    debounceId = null;
    void exportAllToSheets();
  }, AUTO_SYNC_DEBOUNCE);
}

function handleLocalChange() {
  if (isHydrating) return;
  scheduleAutoExport();
}

function handleScriptUrlChange() {
  if (!hasScriptUrl()) return;
  void hydrateFromSheets();
  scheduleAutoExport();
}

export function initAutoSheetSync() {
  if (typeof window === 'undefined' || initialized) return () => {};
  initialized = true;

  const localChangeHandler = () => handleLocalChange();
  const urlChangeHandler = () => handleScriptUrlChange();

  window.addEventListener('tripDataChanged', localChangeHandler);
  window.addEventListener(SHEET_URL_EVENT, urlChangeHandler);

  // 읽기는 gviz API로 직접 접근 (Apps Script 불필요)
  void hydrateFromSheets();

  return () => {
    initialized = false;
    window.removeEventListener('tripDataChanged', localChangeHandler);
    window.removeEventListener(SHEET_URL_EVENT, urlChangeHandler);
    if (debounceId) {
      window.clearTimeout(debounceId);
      debounceId = null;
    }
  };
}

/** 외부에서 강제 동기화 트리거 */
export async function triggerSync() {
  return hydrateFromSheets();
}

export async function forceExportNow() {
  await exportAllToSheets();
}
