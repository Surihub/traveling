// ── 일정 관련 ──

export type ItemType = 'stay' | 'tour' | 'transport' | 'food' | 'etc';

export interface TripItem {
  id: string;
  type: ItemType;
  title: string;       // 주요일정
  address?: string;
  googleMapsUrl?: string;
  links: string[];
  memo?: string;
  order: number;
  updatedAt: Date;
  originLabel?: string;
  originAddress?: string;
  originMapUrl?: string;
}

export interface Day {
  id: string;
  date: string;
  city: string;
  items: TripItem[];
  accommodationId?: string;
  accommodationName?: string;
  accommodationAddress?: string;
  accommodationMapUrl?: string;
}

// ── 항공편 ──

export interface FlightLeg {
  flightNumber: string;   // 편명
  airline: string;        // 항공사
  departureAirport: string;   // 출발공항
  departureAirportCode: string; // 출발코드
  departureTerminal?: string;
  departureCity: string;
  departureDate: string;  // 출발일
  departureTime: string;  // 출발시간 (현지)
  arrivalAirport: string;     // 도착공항
  arrivalAirportCode: string; // 도착코드
  arrivalTerminal?: string;
  arrivalCity: string;
  arrivalDate: string;    // 도착일
  arrivalTime: string;    // 도착시간 (현지)
  duration?: string;      // 비행시간
  seatClass?: string;
  bookingRef?: string;
  memo?: string;
}

export interface FlightInfo {
  outbound: FlightLeg;
  inbound: FlightLeg;
}

// ── 숙소 (시트: 이름, 위치, 체크인, 체크아웃, 메모, 예약상태) ──

export interface AccommodationCandidate {
  id: string;
  name: string;         // 이름
  city: string;         // 위치
  checkIn?: string;     // 체크인
  checkOut?: string;    // 체크아웃
  memo?: string;        // 메모
  isBooked: boolean;    // 예약상태
  createdAt: Date;
  address?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
}

// ── 쇼핑 (시트: 브랜드/아이템, 도시, 메모, 구매여부) ──

export interface ShoppingItem {
  id: string;
  name: string;         // 브랜드/아이템
  city: string;         // 도시
  memo?: string;        // 메모
  isPurchased: boolean; // 구매여부
  createdAt: Date;
}

// ── 체크리스트 (시트: 항목, 용도, 준비완료여부) ──

export interface ChecklistItem {
  id: string;
  item: string;         // 항목
  purpose: string;      // 용도
  isReady: boolean;     // 준비완료여부
  createdAt: Date;
}

export type TransportStatus = 'planned' | 'booked' | 'completed';

export interface TransportBooking {
  id: string;
  date: string;
  from: string;
  to: string;
  provider?: string;
  trainNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  seatInfo?: string;
  reservationCode?: string;
  memo?: string;
  status: TransportStatus;
  createdAt: Date;
}

// ── 여행 ──

export interface Trip {
  id: string;
  title: string;
  members: string[];
  flight?: FlightInfo;
  startDate: string;
  endDate: string;
}

export interface WishlistItem {
  id: string;
  type: ItemType;
  title: string;
  address?: string;
  googleMapsUrl?: string;
  links: string[];
  memo?: string;
  createdAt: Date;
}

// ── 메모 ──

export interface MemoNote {
  id: string;
  title: string;
  url?: string;
  tags: string[];
  memo?: string;
  createdAt: Date;
}

export interface TripData {
  trip: Trip;
  days: Day[];
  wishlist: WishlistItem[];
  accommodations: AccommodationCandidate[];
  shopping: ShoppingItem[];
  checklist: ChecklistItem[];
  transport: TransportBooking[];
  memos: MemoNote[];
}

// ── 상수 ──

export const ITEM_TYPE_ORDER: ItemType[] = ['stay', 'tour', 'transport', 'food', 'etc'];

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  stay: '숙소',
  tour: '관광',
  transport: '교통',
  food: '식사',
  etc: '기타',
};

export const ITEM_TYPE_BADGE_CLASS: Record<ItemType, string> = {
  stay: 'border-sky-200 bg-sky-50 text-sky-700',
  tour: 'border-amber-200 bg-amber-50 text-amber-700',
  transport: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  food: 'border-rose-200 bg-rose-50 text-rose-700',
  etc: 'border-stone-200 bg-stone-50 text-stone-700',
};

export const ITEM_TYPE_SECTION_CLASS: Record<ItemType, string> = {
  stay: 'border-sky-100 bg-sky-50/40',
  tour: 'border-amber-100 bg-amber-50/40',
  transport: 'border-emerald-100 bg-emerald-50/40',
  food: 'border-rose-100 bg-rose-50/40',
  etc: 'border-stone-100 bg-stone-50/40',
};
