import type { FlightInfo as FlightInfoType, FlightLeg } from '../types';

interface FlightInfoProps {
  flight?: FlightInfoType;
}

function formatTime(value?: string) {
  if (!value) return '-';
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  }
  return trimmed;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
}

function FlightLegCard({ leg, isReturn }: { leg: FlightLeg; isReturn: boolean }) {
  const accentClass = isReturn ? 'text-emerald-700 bg-emerald-100' : 'text-blue-700 bg-blue-100';
  const borderClass = isReturn ? 'border-emerald-100' : 'border-blue-100';
  const bgClass = isReturn ? 'bg-emerald-50/40' : 'bg-blue-50/40';

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-4`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${accentClass}`}>
          {isReturn ? '귀국' : '출국'}
        </span>
        <span className="text-sm font-semibold text-gray-700">{leg.airline}</span>
        <span className="text-sm text-gray-500">{leg.flightNumber}</span>
        {leg.duration && (
          <span className="ml-auto text-xs text-gray-400">{leg.duration}</span>
        )}
      </div>

      {/* Departure → Arrival */}
      <div className="flex items-stretch gap-3">
        {/* Departure */}
        <div className="flex-1 rounded-lg border border-gray-100 bg-white p-3">
          <p className="text-xs text-gray-400 mb-1">출발</p>
          <p className="text-2xl font-bold text-gray-900">{formatTime(leg.departureTime)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(leg.departureDate)}</p>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{leg.departureCity}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono font-bold text-gray-700">{leg.departureAirportCode}</span>
              {leg.departureTerminal && (
                <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-500">
                  {leg.departureTerminal}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="w-6 h-px bg-gray-300" />
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="w-6 h-px bg-gray-300" />
        </div>

        {/* Arrival */}
        <div className="flex-1 rounded-lg border border-gray-100 bg-white p-3">
          <p className="text-xs text-gray-400 mb-1">도착</p>
          <p className="text-2xl font-bold text-gray-900">{formatTime(leg.arrivalTime)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(leg.arrivalDate)}
            {leg.arrivalDate !== leg.departureDate && (
              <span className="ml-1 text-red-500 font-medium">+1</span>
            )}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{leg.arrivalCity}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono font-bold text-gray-700">{leg.arrivalAirportCode}</span>
              {leg.arrivalTerminal && (
                <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-500">
                  {leg.arrivalTerminal}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlightInfo({ flight }: FlightInfoProps) {
  if (!flight) {
    return (
      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-gray-800">항공편 정보</h2>
        <p className="mt-2 text-gray-500">등록된 항공편 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-5 shadow-md space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">항공편 정보</h2>
      <FlightLegCard leg={flight.outbound} isReturn={false} />
      <FlightLegCard leg={flight.inbound} isReturn={true} />
    </div>
  );
}
