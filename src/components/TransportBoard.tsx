import { useState } from 'react';
import type { TransportBooking, TransportStatus } from '../types';
import { useTransport } from '../hooks/useTrip';

interface TransportBoardProps {
  canEdit: boolean;
}

interface TransportFormProps {
  initialData?: TransportBooking;
  onSubmit: (data: Omit<TransportBooking, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

const statusLabel: Record<TransportStatus, string> = {
  planned: '예정',
  booked: '예약완료',
  completed: '완료',
};

const statusBadge: Record<TransportStatus, string> = {
  planned: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  booked: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

function TransportForm({ initialData, onSubmit, onCancel }: TransportFormProps) {
  const [date, setDate] = useState(initialData?.date || '');
  const [from, setFrom] = useState(initialData?.from || '');
  const [to, setTo] = useState(initialData?.to || '');
  const [provider, setProvider] = useState(initialData?.provider || '');
  const [trainNumber, setTrainNumber] = useState(initialData?.trainNumber || '');
  const [departureTime, setDepartureTime] = useState(initialData?.departureTime || '');
  const [arrivalTime, setArrivalTime] = useState(initialData?.arrivalTime || '');
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [seatInfo, setSeatInfo] = useState(initialData?.seatInfo || '');
  const [reservationCode, setReservationCode] = useState(initialData?.reservationCode || '');
  const [memo, setMemo] = useState(initialData?.memo || '');
  const [status, setStatus] = useState<TransportStatus>(initialData?.status || 'planned');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !from.trim() || !to.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        date,
        from,
        to,
        provider: provider || undefined,
        trainNumber: trainNumber || undefined,
        departureTime: departureTime || undefined,
        arrivalTime: arrivalTime || undefined,
        duration: duration || undefined,
        seatInfo: seatInfo || undefined,
        reservationCode: reservationCode || undefined,
        memo: memo || undefined,
        status,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">날짜 *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">상태</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TransportStatus)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="planned">예정</option>
            <option value="booked">예약완료</option>
            <option value="completed">완료</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">출발 *</label>
          <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예: 로마 테르미니" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">도착 *</label>
          <input type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예: 베네치아 S. Lucia" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">운행사/열차</label>
          <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Trenitalia / Italo" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">열차 번호</label>
          <input type="text" value={trainNumber} onChange={(e) => setTrainNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="FR 9408" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">출발 시간</label>
          <input type="text" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="09:10" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">도착 시간</label>
          <input type="text" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="12:40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">소요 시간</label>
          <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="3h30m" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">좌석/등급</label>
          <input type="text" value={seatInfo} onChange={(e) => setSeatInfo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Premium 창가" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">예약번호</label>
          <input type="text" value={reservationCode} onChange={(e) => setReservationCode(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="PNR-XXXX" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">메모</label>
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="비고" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving || !date || !from.trim() || !to.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
          {saving ? '저장 중...' : initialData ? '수정' : '추가'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
          취소
        </button>
      </div>
    </form>
  );
}

export function TransportBoard({ canEdit }: TransportBoardProps) {
  const { items, addItem, updateItem, deleteItem } = useTransport();
  const [filter, setFilter] = useState<TransportStatus | 'all'>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((booking) => (filter === 'all' ? true : booking.status === filter));

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-2">
        {(['all', 'planned', 'booked', 'completed'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              filter === key
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200'
            }`}
          >
            {key === 'all' ? '전체' : statusLabel[key as TransportStatus]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((booking) => (
          <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{booking.date}</span>
                  <span>•</span>
                  <span>{booking.provider || '교통편'}</span>
                  {booking.trainNumber && <span className="text-gray-400">#{booking.trainNumber}</span>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">
                  {booking.from}
                  <span className="mx-2 text-gray-400">→</span>
                  {booking.to}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {booking.departureTime || '?'} 출발 · {booking.arrivalTime || '?'} 도착
                  {booking.duration && <span className="text-gray-400"> · {booking.duration}</span>}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                  {booking.seatInfo && <span className="px-2 py-1 bg-gray-50 rounded-lg">{booking.seatInfo}</span>}
                  {booking.reservationCode && <span className="px-2 py-1 bg-gray-50 rounded-lg">PNR {booking.reservationCode}</span>}
                  {booking.memo && <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg">{booking.memo}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusBadge[booking.status]}`}>
                  {statusLabel[booking.status]}
                </span>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        updateItem(booking.id, {
                          status:
                            booking.status === 'planned'
                              ? 'booked'
                              : booking.status === 'booked'
                                ? 'completed'
                                : 'completed',
                        })
                      }
                      className="px-3 py-1 rounded-lg border text-xs text-gray-600 hover:border-blue-300"
                    >
                      다음 단계
                    </button>
                    <button
                      onClick={() => setEditing(booking.id)}
                      className="px-3 py-1 rounded-lg border text-xs text-gray-500 hover:border-blue-300"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('이 교통 일정을 삭제할까요?')) deleteItem(booking.id);
                      }}
                      className="px-3 py-1 rounded-lg border text-xs text-red-500 hover:border-red-300"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
            {editing === booking.id && canEdit && (
              <div className="mt-4 border-t pt-4">
                <TransportForm
                  initialData={booking}
                  onSubmit={async (data) => {
                    await updateItem(booking.id, data);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-sm text-gray-500 bg-white rounded-2xl border border-dashed py-8">
          등록된 교통 일정이 없습니다.
        </div>
      )}

      {canEdit && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          {showForm ? (
            <TransportForm
              onSubmit={async (data) => {
                await addItem(data);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            >
              + 새 교통 일정 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
