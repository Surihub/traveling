import { useState } from 'react';
import type { WishlistItem, Day } from '../types';
import { ITEM_TYPE_BADGE_CLASS, ITEM_TYPE_LABEL } from '../types';
import { useWishlist } from '../hooks/useTrip';
import { openGoogleMaps } from '../utils/maps';
import { ItemForm } from './ItemForm';

interface WishlistProps {
  days: Day[];
  onBack: () => void;
  canEdit: boolean;
}

export function Wishlist({ days, onBack, canEdit }: WishlistProps) {
  const { items, loading, addItem, updateItem, deleteItem, moveToDay } = useWishlist();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('이 항목을 삭제하시겠습니까?')) {
      await deleteItem(id);
    }
  };

  const handleMoveToDay = async (itemId: string, dayId: string) => {
    const dayItems = days.find((d) => d.id === dayId)?.items || [];
    const maxOrder = dayItems.length > 0 ? Math.max(...dayItems.map((i) => i.order || 0)) : 0;
    await moveToDay(itemId, dayId, maxOrder + 1);
    setMovingId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-800">위시리스트</h1>
          <p className="text-gray-500">아직 일정에 배치하지 않은 장소들</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-4">
                {editingId === item.id && canEdit ? (
                  <ItemForm
                    initialData={item}
                    isWishlist
                    onSubmit={async (data) => {
                      await updateItem(item.id, data);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <span
                           className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${ITEM_TYPE_BADGE_CLASS[item.type]}`}
                         >
                           {ITEM_TYPE_LABEL[item.type]}
                         </span>
                       </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setMovingId(movingId === item.id ? null : item.id)}
                            className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded"
                            title="일정에 추가"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingId(item.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="수정"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-800 text-lg mb-1">{item.title}</h3>

                    {item.address && (
                      <p className="text-sm text-gray-500 mb-2">{item.address}</p>
                    )}

                    {movingId === item.id && canEdit && (
                      <div className="mb-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 mb-2">어느 날짜로 이동할까요?</p>
                        <div className="flex flex-wrap gap-2">
                          {days.map((day) => (
                            <button
                              key={day.id}
                              onClick={() => handleMoveToDay(item.id, day.id)}
                              className="px-3 py-1.5 bg-white border border-green-300 rounded text-sm hover:bg-green-100"
                            >
                              {formatDate(day.date)} {day.city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {(item.googleMapsUrl || item.address) && (
                        <button
                          onClick={() => openGoogleMaps(item.googleMapsUrl, item.address)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                          지도 보기
                        </button>
                      )}
                      {item.links?.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          링크 {index + 1}
                        </a>
                      ))}
                    </div>

                    {item.memo && (
                      <div className="p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
                        {item.memo}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && !loading && (
           <div className="text-center py-12 text-gray-500">
             <p>위시리스트가 비어있습니다</p>
           </div>
        )}

        {canEdit && (
          <div className="mt-6">
            {showAddForm ? (
              <ItemForm
                isWishlist
                onSubmit={async (data) => {
                  await addItem(data as Omit<WishlistItem, 'id' | 'createdAt'>);
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                위시리스트에 추가
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
