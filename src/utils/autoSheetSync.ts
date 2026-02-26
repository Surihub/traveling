import {
  SHEET_URL_EVENT,
  getScriptUrl,
  readSheet,
  syncSheet,
  accommodationsToSheetData,
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

function hasScriptUrl() {
  return !!getScriptUrl();
}

async function safeRead(sheet: string) {
  try {
    return await readSheet(sheet);
  } catch (error) {
    console.warn(`[SheetSync] ${sheet} 읽기 실패`, error);
    return [] as Record<string, string>[];
  }
}

async function hydrateFromSheets() {
  if (!hasScriptUrl() || isHydrating) return false;
  isHydrating = true;
  try {
    // 3탭만 읽기: 숙소, 모든일정, 비용정리
    const [accomRows, allScheduleRows, expenseRows] = await Promise.all([
      safeRead('숙소'),
      safeRead('모든일정'),
      safeRead('비용정리'),
    ]);

    const current = loadTripData();
    const next: TripData = { ...current };
    let changed = false;

    if (accomRows.length > 0 || current.accommodations.length === 0) {
      next.accommodations = sheetDataToAccommodations(accomRows);
      changed = changed || accomRows.length > 0;
    }

    if (allScheduleRows.length > 0) {
      const sheetRows = sheetDataToAllSchedule(allScheduleRows);
      // 편집 가능한 필드는 로컬 값 유지, 고정 필드는 시트 값으로 업데이트
      const localRows = current.scheduleRows || [];
      next.scheduleRows = sheetRows.map(sr => {
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

    if (changed) {
      saveTripData(next);
    }

    return changed;
  } finally {
    isHydrating = false;
  }
}

async function exportAllToSheets() {
  if (!hasScriptUrl()) return;
  if (isHydrating) {
    pendingExport = true;
    return;
  }
  if (isExporting) {
    pendingExport = true;
    return;
  }
  isExporting = true;
  try {
    const data = loadTripData();

    // 숙소 탭: 앱 → 시트
    const accommodations = accommodationsToSheetData(data.accommodations);
    await syncSheet('숙소', accommodations.headers, accommodations.rows);

    // 모든일정 탭: 편집 가능한 필드(주요일정·이동계획·준비할것·메모) 반영
    if (data.scheduleRows && data.scheduleRows.length > 0) {
      const schedule = allScheduleToSheetData(data.scheduleRows);
      await syncSheet('모든일정', schedule.headers, schedule.rows);
    }
  } catch (error) {
    console.warn('[SheetSync] 자동 내보내기 실패', error);
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
  if (debounceId) {
    window.clearTimeout(debounceId);
  }
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
  if (typeof window === 'undefined' || initialized) {
    return () => {};
  }
  initialized = true;

  const localChangeHandler = () => handleLocalChange();
  const urlChangeHandler = () => handleScriptUrlChange();

  window.addEventListener('tripDataChanged', localChangeHandler);
  window.addEventListener(SHEET_URL_EVENT, urlChangeHandler);

  if (hasScriptUrl()) {
    void hydrateFromSheets();
    scheduleAutoExport();
  }

  return () => {
    window.removeEventListener('tripDataChanged', localChangeHandler);
    window.removeEventListener(SHEET_URL_EVENT, urlChangeHandler);
    if (debounceId) {
      window.clearTimeout(debounceId);
      debounceId = null;
    }
  };
}

export async function forceExportNow() {
  await exportAllToSheets();
}

export async function forceHydrateNow() {
  await hydrateFromSheets();
}
