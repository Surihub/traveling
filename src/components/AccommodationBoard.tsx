import { useState } from 'react';
import type { AccommodationCandidate } from '../types';
import { useAccommodations } from '../hooks/useTrip';
import { openGoogleMaps, openGoogleDirections } from '../utils/maps';

interface AccommodationBoardProps {
  canEdit: boolean;
}

function AccommodationForm({ onSubmit, onCancel }: {
  onSubmit: (data: Omit<AccommodationCandidate, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [memo, setMemo] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name, city,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        memo: memo || undefined,
        isBooked: false,
        address: address || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        websiteUrl: websiteUrl || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">숙소 후보 추가</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">숙소명 *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Hotel Roma" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">위치 *</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="로마" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">체크인</label>
          <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">체크아웃</label>
          <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">메모</label>
        <textarea value={memo} onChange={e => setMemo(e.target.value)}
          rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예약번호, 주소, 연락처 등" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">주소</label>
        <input type="text" value={address} onChange={e => setAddress(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="예: Via Nazionale 10, Roma" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">구글맵 URL</label>
        <input type="url" value={googleMapsUrl} onChange={e => setGoogleMapsUrl(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://maps.google.com/..." />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">예약/웹사이트 링크</label>
        <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://hotel.com/..." />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving || !name.trim() || !city.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">
          {saving ? '저장 중...' : '추가'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
          취소
        </button>
      </div>
    </form>
  );
}

export function AccommodationBoard({ canEdit }: AccommodationBoardProps) {
  const { items, addItem, updateItem, deleteItem } = useAccommodations();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'booked' | 'candidate'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');

  const filteredItems = items.filter(item => {
    if (filter === 'booked') return item.isBooked;
    if (filter === 'candidate') return !item.isBooked;
    return true;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-sky-100 text-sky-700 border-2 border-sky-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
          전체 ({items.length})
        </button>
        <button onClick={() => setFilter('booked')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'booked' ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
          예약완료
        </button>
        <button onClick={() => setFilter('candidate')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === 'candidate' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
          후보
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.isBooked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.isBooked ? '예약완료' : '후보'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{item.city}</p>
                {item.address && <p className="text-xs text-gray-400">{item.address}</p>}
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <button
                    onClick={() => updateItem(item.id, { isBooked: !item.isBooked })}
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      item.isBooked
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {item.isBooked ? '후보로' : '예약완료'}
                  </button>
                  <button
                    onClick={() => { if (window.confirm('삭제하시겠습니까?')) deleteItem(item.id); }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Dates */}
            {(item.checkIn || item.checkOut) && (
              <div className="flex gap-4 mb-2">
                <span className="text-xs text-gray-500">
                  체크인 <span className="font-medium text-gray-700">{formatDate(item.checkIn)}</span>
                </span>
                <span className="text-xs text-gray-500">
                  체크아웃 <span className="font-medium text-gray-700">{formatDate(item.checkOut)}</span>
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {(item.googleMapsUrl || item.address) && (
                <button
                  onClick={() => openGoogleMaps(item.googleMapsUrl, item.address || `${item.name} ${item.city}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  지도 보기
                </button>
              )}
              {(item.googleMapsUrl || item.address) && (
                <button
                  onClick={() =>
                    openGoogleDirections({
                      destinationName: item.name,
                      destinationAddress: item.address,
                      destinationMapUrl: item.googleMapsUrl,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                >
                  길찾기
                </button>
              )}
              {item.websiteUrl && (
                <a
                  href={item.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                >
                  웹사이트
                </a>
              )}
            </div>

            {/* Memo */}
            {editingId === item.id ? (
              <div className="mt-2">
                <textarea
                  value={editMemo}
                  onChange={e => setEditMemo(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => { updateItem(item.id, { memo: editMemo || undefined }); setEditingId(null); }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >저장</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-500">취소</button>
                </div>
              </div>
            ) : (
              item.memo ? (
                <p
                  className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2 whitespace-pre-wrap cursor-pointer hover:bg-gray-100"
                  onClick={() => { if (canEdit) { setEditingId(item.id); setEditMemo(item.memo || ''); } }}
                >
                  {item.memo}
                </p>
              ) : canEdit ? (
                <button
                  onClick={() => { setEditingId(item.id); setEditMemo(''); }}
                  className="text-xs text-gray-400 mt-2 hover:text-gray-600"
                >+ 메모 추가</button>
              ) : null
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <p>{filter === 'all' ? '등록된 숙소가 없습니다' : filter === 'booked' ? '예약 완료된 숙소가 없습니다' : '후보 숙소가 없습니다'}</p>
          {canEdit && <p className="text-sm mt-1">아래 버튼으로 숙소 후보를 추가해보세요</p>}
        </div>
      )}

      {/* Add form */}
      {canEdit && (
        showForm ? (
          <AccommodationForm
            onSubmit={async (data) => {
              await addItem(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-sky-400 hover:text-sky-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            숙소 후보 추가
          </button>
        )
      )}
    </div>
  );
}
