import { useState, useEffect, useCallback } from 'react';
import type {
  Trip,
  Day,
  TripItem,
  WishlistItem,
  FlightInfo,
  AccommodationCandidate,
  ShoppingItem,
  ChecklistItem,
  TripData,
  TransportBooking,
  MemoNote,
  LocalTour,
  ScheduleRow,
} from '../types';
import { defaultTripData, autoAssignAccommodations } from '../data/defaultTripData';

const STORAGE_KEY = 'italy_trip_data';

const defaultData: TripData = defaultTripData;

function loadData(): TripData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (!parsed.accommodations) parsed.accommodations = [];
    if (!parsed.shopping) parsed.shopping = [];
    if (!parsed.checklist) parsed.checklist = [];
    if (!parsed.transport) parsed.transport = [];
    if (!parsed.memos) parsed.memos = [];
    if (!parsed.localTours) parsed.localTours = defaultData.localTours;
    if (!parsed.scheduleRows) parsed.scheduleRows = [];
    if (!parsed.expenseRows) parsed.expenseRows = [];
    // Migrate old flight format
    if (parsed.trip.flight && !parsed.trip.flight.outbound && parsed.trip.flight.departure) {
      parsed.trip.flight = defaultData.trip.flight;
    }
    // Migrate old destinations to remove
    delete parsed.destinations;

    // 숙소 데이터 마이그레이션: 기본 숙소 ID가 하나라도 없으면 재설정 후 날짜 기반 자동배정
    const defaultAccIds = defaultData.accommodations.map((a) => a.id);
    const hasAllDefaults = defaultAccIds.every((id: string) =>
      parsed.accommodations.some((a: AccommodationCandidate) => a.id === id)
    );
    if (!hasAllDefaults) {
      parsed.accommodations = defaultData.accommodations;
      parsed.days = autoAssignAccommodations(parsed.days, parsed.accommodations);
    }

    return parsed;
  }
  return defaultData;
}

function saveData(data: TripData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('tripDataChanged'));
}

function mutateData(mutator: (data: TripData) => void) {
  const data = loadData();
  mutator(data);
  saveData(data);
}

function createStoredItem(item: Omit<TripItem, 'id' | 'updatedAt'>): TripItem {
  return { ...item, id: `item-${Date.now()}`, updatedAt: new Date() };
}

export function addDayItem(dayId: string, item: Omit<TripItem, 'id' | 'updatedAt'>) {
  mutateData((data) => {
    const idx = data.days.findIndex((d) => d.id === dayId);
    if (idx === -1) return;
    data.days[idx].items.push(createStoredItem(item));
    data.days[idx].items.sort((a, b) => a.order - b.order);
  });
}

export function updateDayItem(dayId: string, itemId: string, updates: Partial<TripItem>) {
  mutateData((data) => {
    const di = data.days.findIndex((d) => d.id === dayId);
    if (di === -1) return;
    const ii = data.days[di].items.findIndex((i) => i.id === itemId);
    if (ii === -1) return;
    data.days[di].items[ii] = { ...data.days[di].items[ii], ...updates, updatedAt: new Date() };
  });
}

export function deleteDayItem(dayId: string, itemId: string) {
  mutateData((data) => {
    const idx = data.days.findIndex((d) => d.id === dayId);
    if (idx === -1) return;
    data.days[idx].items = data.days[idx].items.filter((i) => i.id !== itemId);
  });
}

// ── useTrip ──

export function useTrip() {
  const [trip, setTrip] = useState<Trip>(defaultData.trip);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = loadData();
    setTrip(data.trip);
    setLoading(false);
    const handleChange = () => setTrip(loadData().trip);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const updateFlight = useCallback(async (flight: FlightInfo) => {
    mutateData((data) => { data.trip.flight = flight; });
  }, []);

  return { trip, loading, updateFlight };
}

// ── useDays ──

export function useDays() {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDays(loadData().days);
    setLoading(false);
    const handleChange = () => setDays(loadData().days);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addDay = useCallback(async (date: string, city: string) => {
    mutateData((data) => {
      data.days.push({ id: `day-${Date.now()}`, date, city, items: [] });
      data.days.sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const updateDay = useCallback(async (dayId: string, updates: Partial<Day>) => {
    mutateData((data) => {
      const idx = data.days.findIndex((d) => d.id === dayId);
      if (idx !== -1) data.days[idx] = { ...data.days[idx], ...updates };
    });
  }, []);

  const deleteDay = useCallback(async (dayId: string) => {
    mutateData((data) => { data.days = data.days.filter((d) => d.id !== dayId); });
  }, []);

  return { days, loading, addDay, updateDay, deleteDay };
}

// ── useDayItems ──

export function useDayItems(dayId: string | null) {
  const [items, setItems] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dayId) { setItems([]); setLoading(false); return; }
    setItems(loadData().days.find((d) => d.id === dayId)?.items || []);
    setLoading(false);
    const handleChange = () => setItems(loadData().days.find((d) => d.id === dayId)?.items || []);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, [dayId]);

  const addItem = useCallback(async (item: Omit<TripItem, 'id' | 'updatedAt'>) => { if (dayId) addDayItem(dayId, item); }, [dayId]);
  const updateItem = useCallback(async (itemId: string, updates: Partial<TripItem>) => { if (dayId) updateDayItem(dayId, itemId, updates); }, [dayId]);
  const deleteItem = useCallback(async (itemId: string) => { if (dayId) deleteDayItem(dayId, itemId); }, [dayId]);

  return { items, loading, addItem, updateItem, deleteItem };
}

// ── useWishlist ──

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(loadData().wishlist);
    setLoading(false);
    const handleChange = () => setItems(loadData().wishlist);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addItem = useCallback(async (item: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    mutateData((data) => { data.wishlist.unshift({ ...item, id: `wish-${Date.now()}`, createdAt: new Date() }); });
  }, []);
  const updateItem = useCallback(async (itemId: string, updates: Partial<WishlistItem>) => {
    mutateData((data) => { const i = data.wishlist.findIndex((x) => x.id === itemId); if (i !== -1) data.wishlist[i] = { ...data.wishlist[i], ...updates }; });
  }, []);
  const deleteItem = useCallback(async (itemId: string) => {
    mutateData((data) => { data.wishlist = data.wishlist.filter((x) => x.id !== itemId); });
  }, []);
  const moveToDay = useCallback(async (itemId: string, dayId: string, order: number) => {
    mutateData((data) => {
      const w = data.wishlist.find((x) => x.id === itemId);
      if (!w) return;
      const di = data.days.findIndex((d) => d.id === dayId);
      if (di === -1) return;
      data.days[di].items.push({ id: `item-${Date.now()}`, type: w.type, title: w.title, address: w.address, googleMapsUrl: w.googleMapsUrl, links: w.links, memo: w.memo, order, updatedAt: new Date() });
      data.days[di].items.sort((a, b) => a.order - b.order);
      data.wishlist = data.wishlist.filter((x) => x.id !== itemId);
    });
  }, []);

  return { items, loading, addItem, updateItem, deleteItem, moveToDay };
}

// ── useAccommodations ──

export function useAccommodations() {
  const [items, setItems] = useState<AccommodationCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(loadData().accommodations);
    setLoading(false);
    const handleChange = () => setItems(loadData().accommodations);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addItem = useCallback(async (item: Omit<AccommodationCandidate, 'id' | 'createdAt'>) => {
    mutateData((data) => { data.accommodations.push({ ...item, id: `acc-${Date.now()}`, createdAt: new Date() }); });
  }, []);
  const updateItem = useCallback(async (itemId: string, updates: Partial<AccommodationCandidate>) => {
    mutateData((data) => { const i = data.accommodations.findIndex((x) => x.id === itemId); if (i !== -1) data.accommodations[i] = { ...data.accommodations[i], ...updates }; });
  }, []);
  const deleteItem = useCallback(async (itemId: string) => {
    mutateData((data) => { data.accommodations = data.accommodations.filter((x) => x.id !== itemId); });
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
}

// ── useShopping ──

export function useShopping() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(loadData().shopping);
    setLoading(false);
    const handleChange = () => setItems(loadData().shopping);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addItem = useCallback(async (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => {
    mutateData((data) => { data.shopping.push({ ...item, id: `shop-${Date.now()}`, createdAt: new Date() }); });
  }, []);
  const updateItem = useCallback(async (itemId: string, updates: Partial<ShoppingItem>) => {
    mutateData((data) => { const i = data.shopping.findIndex((x) => x.id === itemId); if (i !== -1) data.shopping[i] = { ...data.shopping[i], ...updates }; });
  }, []);
  const deleteItem = useCallback(async (itemId: string) => {
    mutateData((data) => { data.shopping = data.shopping.filter((x) => x.id !== itemId); });
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
}

// ── useChecklist ──

export function useChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(loadData().checklist);
    setLoading(false);
    const handleChange = () => setItems(loadData().checklist);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addItem = useCallback(async (item: Omit<ChecklistItem, 'id' | 'createdAt'>) => {
    mutateData((data) => { data.checklist.push({ ...item, id: `chk-${Date.now()}`, createdAt: new Date() }); });
  }, []);
  const updateItem = useCallback(async (itemId: string, updates: Partial<ChecklistItem>) => {
    mutateData((data) => { const i = data.checklist.findIndex((x) => x.id === itemId); if (i !== -1) data.checklist[i] = { ...data.checklist[i], ...updates }; });
  }, []);
  const deleteItem = useCallback(async (itemId: string) => {
    mutateData((data) => { data.checklist = data.checklist.filter((x) => x.id !== itemId); });
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
}

// ── useTransport ──

export function useTransport() {
  const [items, setItems] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(loadData().transport);
    setLoading(false);
    const handleChange = () => setItems(loadData().transport);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addItem = useCallback(async (item: Omit<TransportBooking, 'id' | 'createdAt'>) => {
    mutateData((data) => {
      data.transport.push({ ...item, id: `tr-${Date.now()}`, createdAt: new Date() });
      data.transport.sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: Partial<TransportBooking>) => {
    mutateData((data) => {
      const idx = data.transport.findIndex((x) => x.id === itemId);
      if (idx !== -1) {
        data.transport[idx] = { ...data.transport[idx], ...updates };
      }
    });
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    mutateData((data) => {
      data.transport = data.transport.filter((x) => x.id !== itemId);
    });
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
}

// ── useMemos ──

export function useMemos() {
  const [items, setItems] = useState<MemoNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(loadData().memos);
    setLoading(false);
    const handleChange = () => setItems(loadData().memos);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addItem = useCallback(async (item: Omit<MemoNote, 'id' | 'createdAt'>) => {
    mutateData((data) => { data.memos.unshift({ ...item, id: `memo-${Date.now()}`, createdAt: new Date() }); });
  }, []);
  const updateItem = useCallback(async (itemId: string, updates: Partial<MemoNote>) => {
    mutateData((data) => { const i = data.memos.findIndex((x) => x.id === itemId); if (i !== -1) data.memos[i] = { ...data.memos[i], ...updates }; });
  }, []);
  const deleteItem = useCallback(async (itemId: string) => {
    mutateData((data) => { data.memos = data.memos.filter((x) => x.id !== itemId); });
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
}

// ── useLocalTours ──

export function useLocalTours() {
  const [items, setItems] = useState<LocalTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(loadData().localTours);
    setLoading(false);
    const handleChange = () => setItems(loadData().localTours);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const addItem = useCallback(async (item: Omit<LocalTour, 'id' | 'createdAt'>) => {
    mutateData((data) => {
      data.localTours.push({ ...item, id: `tour-${Date.now()}`, createdAt: new Date() });
      data.localTours.sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);
  const updateItem = useCallback(async (itemId: string, updates: Partial<LocalTour>) => {
    mutateData((data) => { const i = data.localTours.findIndex((x) => x.id === itemId); if (i !== -1) data.localTours[i] = { ...data.localTours[i], ...updates }; });
  }, []);
  const deleteItem = useCallback(async (itemId: string) => {
    mutateData((data) => { data.localTours = data.localTours.filter((x) => x.id !== itemId); });
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
}

// ── useScheduleRows ──

export function useScheduleRows() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRows(loadData().scheduleRows || []);
    setLoading(false);
    const handleChange = () => setRows(loadData().scheduleRows || []);
    window.addEventListener('tripDataChanged', handleChange);
    return () => window.removeEventListener('tripDataChanged', handleChange);
  }, []);

  const updateRow = useCallback(async (rowId: string, updates: Partial<ScheduleRow>) => {
    mutateData((data) => {
      const idx = (data.scheduleRows || []).findIndex((r) => r.id === rowId);
      if (idx !== -1) {
        data.scheduleRows[idx] = { ...data.scheduleRows[idx], ...updates, updatedAt: new Date() };
      }
    });
  }, []);

  return { rows, loading, updateRow };
}

export { loadData as loadTripData, saveData as saveTripData, mutateData as mutateTripData };
