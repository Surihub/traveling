import { useState } from 'react';
import type { TripItem } from '../types';
import { ITEM_TYPE_BADGE_CLASS, ITEM_TYPE_LABEL } from '../types';
import { openGoogleMaps, openGoogleDirections } from '../utils/maps';
import { ItemForm } from './ItemForm';

interface ItemCardProps {
  item: TripItem;
  onUpdate: (id: string, data: Partial<TripItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canEdit: boolean;
  originName?: string;
  originAddress?: string;
  originMapUrl?: string;
}

export function ItemCard({ item, onUpdate, onDelete, canEdit, originName, originAddress, originMapUrl }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      await onDelete(item.id);
    }
  };

  if (isEditing && canEdit) {
    return (
      <ItemForm
        initialData={item}
        onSubmit={async (data) => {
          await onUpdate(item.id, data);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
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
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
              title="수정"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
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

      <div className="flex flex-wrap gap-2 mb-3">
        {(item.googleMapsUrl || item.address) && (
          <button
            onClick={() => openGoogleMaps(item.googleMapsUrl, item.address)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            지도 보기
          </button>
        )}
        {(originName || originAddress || originMapUrl) && (item.googleMapsUrl || item.address || item.title) && (
          <button
            onClick={() =>
              openGoogleDirections({
                originName,
                originAddress,
                originMapUrl,
                destinationName: item.title,
                destinationAddress: item.address,
                destinationMapUrl: item.googleMapsUrl,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0 0l3-3m-3 3l-3-3" />
            </svg>
            숙소→길찾기
          </button>
        )}
        {item.links?.map((link, index) => (
          <a
            key={index}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
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
    </div>
  );
}
