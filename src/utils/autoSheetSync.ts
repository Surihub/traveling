import {
  SHEET_URL_EVENT,
  getScriptUrl,
  readSheet,
  syncSheet,
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
  memosToSheetData,
  sheetDataToMemos,
  localToursToSheetData,
  sheetDataToLocalTours,
  travelPoolToSheetData,
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
    const [flightRows, scheduleRows, accomRows, shoppingRows, checklistRows, memoRows, transportRows, localTourRows] = await Promise.all([
      safeRead('항공편'),
      safeRead('일정'),
      safeRead('숙소'),
      safeRead('쇼핑'),
      safeRead('체크리스트'),
      safeRead('메모'),
      safeRead('교통'),
      safeRead('현지투어'),
    ]);

    const current = loadTripData();
    const next: TripData = { ...current };
    let changed = false;

    const flight = sheetDataToFlight(flightRows);
    if (flight) {
      next.trip = { ...next.trip, flight };
      changed = true;
    }

    if (scheduleRows.length > 0) {
      next.days = sheetDataToDays(scheduleRows);
      changed = true;
    }

    if (accomRows.length > 0 || current.accommodations.length === 0) {
      next.accommodations = sheetDataToAccommodations(accomRows);
      changed = changed || accomRows.length > 0;
    }

    if (shoppingRows.length > 0 || current.shopping.length === 0) {
      next.shopping = sheetDataToShopping(shoppingRows);
      changed = changed || shoppingRows.length > 0;
    }

    if (checklistRows.length > 0 || current.checklist.length === 0) {
      next.checklist = sheetDataToChecklist(checklistRows);
      changed = changed || checklistRows.length > 0;
    }

    if (memoRows.length > 0) {
      next.memos = sheetDataToMemos(memoRows);
      changed = true;
    }

    if (transportRows.length > 0) {
      next.transport = sheetDataToTransport(transportRows);
      changed = true;
    }

    if (localTourRows.length > 0) {
      next.localTours = sheetDataToLocalTours(localTourRows);
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

    if (data.trip.flight) {
      const flight = flightToSheetData(data.trip.flight);
      await syncSheet('항공편', flight.headers, flight.rows);
    }

    const schedule = daysToSheetData(data.days);
    await syncSheet('일정', schedule.headers, schedule.rows);

    const accommodations = accommodationsToSheetData(data.accommodations);
    await syncSheet('숙소', accommodations.headers, accommodations.rows);

    const shopping = shoppingToSheetData(data.shopping);
    await syncSheet('쇼핑', shopping.headers, shopping.rows);

    const checklist = checklistToSheetData(data.checklist);
    await syncSheet('체크리스트', checklist.headers, checklist.rows);

    const memos = memosToSheetData(data.memos);
    await syncSheet('메모', memos.headers, memos.rows);

    const transport = transportToSheetData(data.transport);
    await syncSheet('교통', transport.headers, transport.rows);

    const localTours = localToursToSheetData(data.localTours);
    await syncSheet('현지투어', localTours.headers, localTours.rows);

    const pool = travelPoolToSheetData(
      data.localTours,
      data.accommodations,
      data.shopping,
      data.transport,
      data.memos,
    );
    await syncSheet('여행준비', pool.headers, pool.rows);
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
