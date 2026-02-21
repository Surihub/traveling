import { useState } from 'react';
import type { LocalTour, TourStatus } from '../types';
import { useLocalTours } from '../hooks/useTrip';

const STATUS_LABEL: Record<TourStatus, string> = {
  planned: '계획중',
  booked: '예약완료',
  completed: '완료',
};

const STATUS_CLASS: Record<TourStatus, string> = {
  planned: 'bg-amber-50 text-amber-700 border-amber-200',
  booked: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-gray-100 text-gray-500 border-gray-200',
};

const EMPTY_FORM: Omit<LocalTour, 'id' | 'createdAt'> = {
  name: '',
  date: '',
  duration: '',
  provider: '',
  meetingPoint: '',
  meetingTime: '',
  reservationCode: '',
  price: '',
  memo: '',
  status: 'planned',
};

interface Props {
  canEdit: boolean;
}

export function LocalTourBoard({ canEdit }: Props) {
  const { items, loading, addItem, updateItem, deleteItem } = useLocalTours();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<LocalTour, 'id' | 'createdAt'>>(EMPTY_FORM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Omit<LocalTour, 'id' | 'createdAt'>>(EMPTY_FORM);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
  };

  const handleStartEdit = (tour: LocalTour) => {
    setEditingId(tour.id);
    setEditForm({
      name: tour.name,
      date: tour.date,
      duration: tour.duration || '',
      provider: tour.provider || '',
      meetingPoint: tour.meetingPoint || '',
      meetingTime: tour.meetingTime || '',
      reservationCode: tour.reservationCode || '',
      price: tour.price || '',
      memo: tour.memo || '',
      status: tour.status,
    });
    setExpandedId(tour.id);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateItem(editingId, editForm);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 투어를 삭제하시겠습니까?')) {
      await deleteItem(id);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.name || !addForm.date) return;
    await addItem(addForm);
    setAddForm(EMPTY_FORM);
    setShowAddForm(false);
  };

  if (loading) return <div className="text-center py-8 text-gray-500">로딩 중...</div>;

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      {sorted.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-gray-400 text-sm">등록된 투어가 없습니다</div>
      )}

      {sorted.map((tour) => {
        const isExpanded = expandedId === tour.id;
        const isEditing = editingId === tour.id;

        return (
          <div key={tour.id} className="rounded-2xl border border-violet-100 bg-white shadow-sm overflow-hidden">
            {/* 카드 헤더 */}
            <div
              className="flex items-start justify-between p-4 cursor-pointer hover:bg-violet-50/40 transition-colors"
              onClick={() => !isEditing && setExpandedId(isExpanded ? null : tour.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_CLASS[tour.status]}`}>
                    {STATUS_LABEL[tour.status]}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(tour.date)}</span>
                  {tour.duration && <span className="text-xs text-gray-400">· {tour.duration}</span>}
                </div>
                <h3 className="text-base font-bold text-gray-800">{tour.name}</h3>
                {tour.meetingPoint && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {tour.meetingPoint}{tour.meetingTime ? ` · ${tour.meetingTime}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                {canEdit && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(tour); }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(tour.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* 펼쳤을 때 */}
            {isExpanded && (
              <div className="border-t border-violet-100 px-4 pb-4 pt-3 bg-violet-50/30">
                {isEditing ? (
                  <TourForm
                    form={editForm}
                    onChange={setEditForm}
                    onSubmit={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                    submitLabel="저장"
                  />
                ) : (
                  <TourDetail tour={tour} />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 투어 추가 */}
      {canEdit && (
        showAddForm ? (
          <div className="rounded-2xl border border-dashed border-violet-300 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">새 투어 추가</h3>
            <TourForm
              form={addForm}
              onChange={setAddForm}
              onSubmit={handleAddSubmit}
              onCancel={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
              submitLabel="추가"
            />
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            투어 추가
          </button>
        )
      )}
    </div>
  );
}

function TourDetail({ tour }: { tour: LocalTour }) {
  const rows = [
    { label: '투어 업체', value: tour.provider },
    { label: '집합 장소', value: tour.meetingPoint },
    { label: '집합 시간', value: tour.meetingTime },
    { label: '예약 번호', value: tour.reservationCode },
    { label: '가격', value: tour.price },
  ];
  const hasAny = rows.some((r) => r.value);

  return (
    <div className="space-y-2">
      {hasAny && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.map(({ label, value }) =>
            value ? (
              <>
                <dt key={`dt-${label}`} className="text-gray-400 whitespace-nowrap">{label}</dt>
                <dd key={`dd-${label}`} className="text-gray-700 font-medium">{value}</dd>
              </>
            ) : null
          )}
        </dl>
      )}
      {tour.memo && (
        <div className="mt-2 rounded-xl bg-white border border-gray-100 p-3 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
          {tour.memo}
        </div>
      )}
      {!hasAny && !tour.memo && (
        <p className="text-sm text-gray-400">세부 정보가 없습니다.</p>
      )}
    </div>
  );
}

function TourForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: Omit<LocalTour, 'id' | 'createdAt'>;
  onChange: (f: Omit<LocalTour, 'id' | 'createdAt'>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const set = (key: keyof typeof form, value: string) => onChange({ ...form, [key]: value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">투어 이름 *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="예: 바티칸 투어"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">날짜 *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">상태</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="planned">계획중</option>
            <option value="booked">예약완료</option>
            <option value="completed">완료</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">기간</label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => set('duration', e.target.value)}
            placeholder="예: 1박2일, 6시간"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">투어 업체</label>
          <input
            type="text"
            value={form.provider}
            onChange={(e) => set('provider', e.target.value)}
            placeholder="업체명"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">집합 장소</label>
          <input
            type="text"
            value={form.meetingPoint}
            onChange={(e) => set('meetingPoint', e.target.value)}
            placeholder="예: 로마 테르미니역 5번 출구"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">집합 시간</label>
          <input
            type="time"
            value={form.meetingTime}
            onChange={(e) => set('meetingTime', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">가격</label>
          <input
            type="text"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="예: €50/인"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">예약 번호</label>
          <input
            type="text"
            value={form.reservationCode}
            onChange={(e) => set('reservationCode', e.target.value)}
            placeholder="예약 확인 번호"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">메모</label>
          <textarea
            value={form.memo}
            onChange={(e) => set('memo', e.target.value)}
            placeholder="코스, 포함사항, 주의사항 등"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={!form.name || !form.date}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
        >
          취소
        </button>
      </div>
    </div>
  );
}
