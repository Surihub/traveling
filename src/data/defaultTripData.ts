import type {
  TripData,
  Trip,
  Day,
  TripItem,
  ItemType,
  AccommodationCandidate,
  ShoppingItem,
  ChecklistItem,
  TransportBooking,
  LocalTour,
} from '../types';

export const DEFAULT_UPDATED_AT = '2025-01-01T00:00:00Z';

const outboundFlight = {
  flightNumber: 'OZ561',
  airline: '아시아나항공',
  departureAirport: '인천 (T2)',
  departureAirportCode: 'ICN',
  departureTerminal: 'T2',
  departureCity: '인천',
  departureDate: '2026-03-01',
  departureTime: '14:05',
  arrivalAirport: '로마 (T3)',
  arrivalAirportCode: 'FCO',
  arrivalTerminal: 'T3',
  arrivalCity: '로마',
  arrivalDate: '2026-03-01',
  arrivalTime: '19:35',
  duration: '13시간 30분',
  memo: '좌석 26D, 직항',
};

const inboundFlight = {
  flightNumber: 'OZ562',
  airline: '아시아나항공',
  departureAirport: '로마 (T3)',
  departureAirportCode: 'FCO',
  departureTerminal: 'T3',
  departureCity: '로마',
  departureDate: '2026-03-13',
  departureTime: '22:00',
  arrivalAirport: '인천 (T2)',
  arrivalAirportCode: 'ICN',
  arrivalTerminal: 'T2',
  arrivalCity: '인천',
  arrivalDate: '2026-03-14',
  arrivalTime: '17:35',
  duration: '11시간 35분',
  memo: '좌석 31A, +1일 도착',
};

const accommodationsSeed: Array<Omit<AccommodationCandidate, 'createdAt'> & { checkIn?: string; checkOut?: string }> = [
  {
    id: 'acc-a',
    name: 'A',
    city: '로마',
    checkIn: '2026-03-01',
    checkOut: '2026-03-03',
    memo: '처음 로마 숙소, 짐 맡겨달라고 하기(하루만용!) - 시내 근처',
    isBooked: true,
  },
  {
    id: 'acc-b',
    name: 'B',
    city: '소렌토',
    checkIn: '2026-03-03',
    checkOut: '2026-03-04',
    memo: '소렌토 숙소(리스트 있음)',
    isBooked: true,
  },
  {
    id: 'acc-c',
    name: 'C',
    city: '로마',
    checkIn: '2026-03-04',
    checkOut: '2026-03-05',
    memo: '처음 로마 숙소/혹은 테르미니역 근처 숙소(늦게 떨어지고 일찍 나가야 하므로)',
    isBooked: true,
  },
  {
    id: 'acc-d',
    name: 'D',
    city: '베네치아',
    checkIn: '2026-03-05',
    checkOut: '2026-03-07',
    memo: '베네치아(메스트레) 숙소, 본섬은 돌계단 많아서 비추, 메스트레가 좋음',
    isBooked: true,
  },
  {
    id: 'acc-e',
    name: 'E',
    city: '피렌체',
    checkIn: '2026-03-07',
    checkOut: '2026-03-10',
    memo: '피렌체 숙소, 산타노벨라 근처',
    isBooked: true,
  },
  {
    id: 'acc-f',
    name: 'F',
    city: '로마',
    checkIn: '2026-03-10',
    checkOut: '2026-03-13',
    memo: '마지막 로마 숙소, 처음이랑 다른 곳',
    isBooked: true,
  },
];

type ScheduleSeed = {
  date: string;
  city: string;
  summary: string;
};

const scheduleSeeds: ScheduleSeed[] = [
  { date: '2026-03-01', city: '로마', summary: '인천→로마 19:35 도착, 숙소 체크인 및 휴식' },
  { date: '2026-03-02', city: '로마', summary: '판테온, 트레비 분수, 나보나 광장 시내 산책' },
  { date: '2026-03-03', city: '남부', summary: '남부 투어 출발 — 나폴리 → 소렌토 이동' },
  { date: '2026-03-04', city: '로마', summary: '남부 투어 복귀, 오후 테르미니역 도착 후 야간 산책' },
  { date: '2026-03-05', city: '베네치아', summary: '로마→베네치아 이동(3.5h), 산 마르코 광장 야경' },
  { date: '2026-03-06', city: '베네치아', summary: '베로나 & 시르미오네(가르다 호수) 당일치기' },
  { date: '2026-03-07', city: '베네치아', summary: '부라노/무라노 섬 투어 → 피렌체로 이동' },
  { date: '2026-03-08', city: '피렌체', summary: '우피치 · 두오모 · 명품 거리 산책' },
  { date: '2026-03-09', city: '피렌체', summary: '토스카나 와이너리 투어 or 산타 크로체 골목 탐험' },
  { date: '2026-03-10', city: '피렌체', summary: '더 몰 아울렛 투어 → 로마로 이동' },
  { date: '2026-03-11', city: '로마', summary: '바티칸 투어 + 마지막 쇼핑, 포켓 커피 챙기기' },
  { date: '2026-03-12', city: '로마', summary: '여유로운 체크아웃, 공항 이동 후 22:00 출국' },
];

const shoppingSeeds: Array<{ name: string; city: string; memo?: string }> = [
  { name: '보테가 베네타', city: '피렌체', memo: '더몰 아울렛 혹은 본점 체크' },
  { name: '미우미우', city: '피렌체', memo: '신상 및 가격 확인' },
  { name: '구찌', city: '로마', memo: '스페인 광장 인근 매장' },
  { name: '막스마라', city: '로마', memo: '코트 사이즈 확인' },
  { name: '산타마리아 노벨라', city: '피렌체', memo: '고현정 크림 포함 화장품' },
  { name: '포켓 커피 / 마비스', city: '이탈리아', memo: '지인 선물용 스낵 & 치약' },
];

const checklistSeeds: Array<{ item: string; purpose?: string }> = [
  { item: '여권 및 사본', purpose: '필수 서류' },
  { item: '트래블로그/트래블월렛', purpose: '해외 결제 수단' },
  { item: '다이소 스프링 줄', purpose: '짐 잠금 보조' },
  { item: '편한 운동화', purpose: '도보 일정 필수' },
  { item: '감기약, 소화제', purpose: '상비약' },
  { item: '멀티탭/어댑터', purpose: '전압 변환' },
];

const transportSeeds: Array<Omit<TransportBooking, 'id' | 'createdAt'>> = [
  {
    date: '2026-03-03',
    from: '피렌체 SMN',
    to: '나폴리 중앙',
    provider: 'Trenitalia Frecciarossa',
    trainNumber: 'FR 9518',
    departureTime: '07:30',
    arrivalTime: '10:50',
    duration: '3h20m',
    seatInfo: '2등석 Quiet Car',
    reservationCode: 'PNR-FRX303',
    memo: '노마드 트래블 픽업 연계',
    status: 'booked',
  },
  {
    date: '2026-03-04',
    from: '나폴리 중앙',
    to: '로마 테르미니',
    provider: 'Trenitalia Frecciarossa',
    trainNumber: 'FR 9642',
    departureTime: '18:00',
    arrivalTime: '20:05',
    duration: '2h05m',
    seatInfo: '2등석',
    reservationCode: 'PNR-ROM804',
    memo: '로마 복귀 (20:00 도착 계획)',
    status: 'planned',
  },
  {
    date: '2026-03-05',
    from: '로마 테르미니',
    to: '베네치아 S. Lucia',
    provider: 'Frecciarossa',
    trainNumber: 'FR 9408',
    departureTime: '09:10',
    arrivalTime: '12:40',
    duration: '3h30m',
    seatInfo: '비즈니스 좌석, 창가',
    reservationCode: 'PNR-VCE305',
    memo: '산 마르코 야경 맞춰 도착',
    status: 'planned',
  },
  {
    date: '2026-03-06',
    from: '베네치아 S. Lucia',
    to: '베로나 P. Nuova',
    provider: 'Regionale Veloce',
    trainNumber: 'RV 2232',
    departureTime: '07:52',
    arrivalTime: '09:12',
    duration: '1h20m',
    seatInfo: '자유석',
    reservationCode: 'DAYPASS',
    memo: '베로나·시르미오네 당일치기',
    status: 'planned',
  },
  {
    date: '2026-03-08',
    from: '베네치아 S. Lucia',
    to: '피렌체 SMN',
    provider: 'Italo',
    trainNumber: 'Italo 9935',
    departureTime: '09:45',
    arrivalTime: '11:45',
    duration: '2h00m',
    seatInfo: 'Smart 클래스',
    reservationCode: 'IT-PIA808',
    memo: '피렌체 쇼핑 일정 시작',
    status: 'planned',
  },
  {
    date: '2026-03-11',
    from: '피렌체 SMN',
    to: '로마 테르미니',
    provider: 'Frecciarossa',
    trainNumber: 'FR 9544',
    departureTime: '16:10',
    arrivalTime: '18:05',
    duration: '1h55m',
    seatInfo: 'Premium',
    reservationCode: 'PNR-ROM311',
    memo: '마지막 로마 쇼핑 투어',
    status: 'planned',
  },
];

function detectItemType(summary: string): ItemType {
  if (/도착|이동|→/u.test(summary)) return 'transport';
  if (/체크인|숙소/u.test(summary)) return 'stay';
  if (/쇼핑|구매/u.test(summary)) return 'etc';
  if (/투어|산책|광장|섬/u.test(summary)) return 'tour';
  return 'etc';
}

function createTripItem(summary: string, dateLabel: string): TripItem {
  return {
    id: `item-${dateLabel}`,
    type: detectItemType(summary),
    title: summary,
    links: [],
    memo: undefined,
    order: 1,
    updatedAt: new Date(DEFAULT_UPDATED_AT),
  };
}

const accommodations: AccommodationCandidate[] = accommodationsSeed.map((acc) => ({
  ...acc,
  createdAt: new Date(DEFAULT_UPDATED_AT),
}));

/** "2026.3.3." 또는 "2026.03.03" 형식을 "2026-03-03" ISO 형식으로 변환 */
function normalizeDateStr(d: string): string {
  if (!d) return '';
  const s = d.trim().replace(/\.\s*$/, ''); // 끝의 마침표 제거
  if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length === 3) {
      const [y, m, day] = parts;
      return `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return s;
}

/** 체크인/체크아웃 날짜를 기준으로 days에 숙소를 자동 배정한다 (checkIn <= date < checkOut) */
export function autoAssignAccommodations(days: Day[], accs: AccommodationCandidate[]): Day[] {
  return days.map((day) => {
    const acc = accs.find((a) => {
      const ci = normalizeDateStr(a.checkIn || '');
      const co = normalizeDateStr(a.checkOut || '');
      return ci && co && ci <= day.date && day.date < co;
    });
    if (!acc) return day;
    return {
      ...day,
      accommodationId: acc.id,
      accommodationName: acc.name,
      accommodationAddress: acc.address || acc.memo,
      accommodationMapUrl: acc.googleMapsUrl,
    };
  });
}

const days: Day[] = autoAssignAccommodations(
  scheduleSeeds.map((seed, index) => ({
    id: `day-${seed.date}`,
    date: seed.date,
    city: seed.city,
    items: [createTripItem(seed.summary, `${seed.date}-${index}`)],
  })),
  accommodations
);

const shopping: ShoppingItem[] = shoppingSeeds.map((seed, index) => ({
  id: `shop-${index}`,
  name: seed.name,
  city: seed.city,
  memo: seed.memo,
  isPurchased: false,
  createdAt: new Date(DEFAULT_UPDATED_AT),
}));

const checklist: ChecklistItem[] = checklistSeeds.map((seed, index) => ({
  id: `chk-${index}`,
  item: seed.item,
  purpose: seed.purpose || '',
  isReady: false,
  createdAt: new Date(DEFAULT_UPDATED_AT),
}));

const transport: TransportBooking[] = transportSeeds.map((seed, index) => ({
  id: `tr-${index}`,
  ...seed,
  createdAt: new Date(DEFAULT_UPDATED_AT),
}));

const localTourSeeds: Array<Omit<LocalTour, 'id' | 'createdAt'>> = [
  {
    name: '남부투어 1박',
    date: '2026-03-03',
    duration: '1박2일',
    provider: '노마드트래블',
    meetingPoint: '로마 테르미니역 5번 출구',
    meetingTime: '07:00',
    reservationCode: '',
    price: '',
    memo: '나폴리 → 폼페이 → 소렌토 → 아말피 코스트. 픽업 후 전용 버스 이동. 체크인 숙소: 소렌토 노마드하우스',
    status: 'planned',
  },
  {
    name: '토스카나 와이너리 투어',
    date: '2026-03-10',
    duration: '종일 (약 8시간)',
    provider: '',
    meetingPoint: '피렌체 산타마리아 노벨라역 광장',
    meetingTime: '09:00',
    reservationCode: '',
    price: '',
    memo: '키안티 와인 산지 투어. 와이너리 방문 및 시음 포함. 인원 확인 후 예약 진행',
    status: 'planned',
  },
  {
    name: '바티칸 투어',
    date: '2026-03-02',
    duration: '반일 (약 4시간)',
    provider: '',
    meetingPoint: '바티칸 박물관 입구 (Viale Vaticano)',
    meetingTime: '09:00',
    reservationCode: '',
    price: '',
    memo: '바티칸 박물관 → 시스티나 성당 → 성 베드로 대성당. 줄 없이 입장하려면 사전 예약 필수',
    status: 'planned',
  },
];

const localTours: LocalTour[] = localTourSeeds.map((seed, index) => ({
  id: `tour-${index}`,
  ...seed,
  createdAt: new Date(DEFAULT_UPDATED_AT),
}));

const trip: Trip = {
  id: 'italy-2026',
  title: '수빈석빈 in Italy',
  members: [],
  startDate: '2026-03-01',
  endDate: '2026-03-12',
  flight: {
    outbound: outboundFlight,
    inbound: inboundFlight,
  },
};

export const defaultTripData: TripData = {
  trip,
  days,
  wishlist: [],
  accommodations,
  shopping,
  checklist,
  transport,
  memos: [],
  localTours,
};
