import type { TripData, AccommodationCandidate } from '../types';
import type { Day } from '../types';

/** 체크인/체크아웃 날짜 기준으로 days에 숙소를 자동 배정 (checkIn <= date < checkOut) */
export function autoAssignAccommodations(days: Day[], accs: AccommodationCandidate[]): Day[] {
  return days.map((day) => {
    const acc = accs.find((a) => {
      const ci = a.checkIn || '';
      const co = a.checkOut || '';
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

export const defaultTripData: TripData = {
  trip: {
    id: 'italy-2026',
    title: '수빈석빈 in Italy',
    members: [],
    startDate: '2026-03-01',
    endDate: '2026-03-13',
    flight: {
      outbound: {
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
      },
      inbound: {
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
      },
    },
  },
  days: [],
  wishlist: [],
  accommodations: [],
  shopping: [],
  checklist: [],
  transport: [],
  memos: [],
  localTours: [],
  scheduleRows: [],
  expenseRows: [],
};
