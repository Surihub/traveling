import { useEffect, useState } from 'react';
import type { TripItem, ItemType, WishlistItem } from '../types';
import { ITEM_TYPE_LABEL, ITEM_TYPE_ORDER, ITEM_TYPE_BADGE_CLASS } from '../types';
import { extractPlaceNameFromGoogleMapsUrl } from '../utils/maps';

type FormData = Omit<TripItem, 'id' | 'updatedAt'> | Omit<WishlistItem, 'id' | 'createdAt'>;

interface ItemFormProps {
  initialData?: Partial<TripItem | WishlistItem>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isWishlist?: boolean;
  initialType?: ItemType;
  lockedType?: ItemType;
}

export function ItemForm({
  initialData,
  onSubmit,
  onCancel,
  isWishlist = false,
  initialType,
  lockedType,
}: ItemFormProps) {
  const resolvedInitialType: ItemType =
    lockedType || (initialData?.type as ItemType | undefined) || initialType || 'tour';
  const [type, setType] = useState<ItemType>(resolvedInitialType);
  const [title, setTitle] = useState(initialData?.title || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialData?.googleMapsUrl || '');
  const [memo, setMemo] = useState(initialData?.memo || '');
  const [saving, setSaving] = useState(false);
  const [hasManualTitle, setHasManualTitle] = useState(Boolean(initialData?.title));
  const [lastAutoTitleUrl, setLastAutoTitleUrl] = useState<string | null>(
    initialData?.googleMapsUrl || null
  );

  useEffect(() => {
    if (!googleMapsUrl || hasManualTitle || lastAutoTitleUrl === googleMapsUrl) {
      return;
    }
    const extractedName = extractPlaceNameFromGoogleMapsUrl(googleMapsUrl);
    if (extractedName) {
      setTitle(extractedName);
      setHasManualTitle(false);
      setLastAutoTitleUrl(googleMapsUrl);
    }
  }, [googleMapsUrl, hasManualTitle, lastAutoTitleUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const preservedAddress = initialData?.address;
      const preservedLinks = initialData?.links || [];
      const sequenceOrder = (initialData as TripItem)?.order ?? Date.now();

      const data: FormData = isWishlist
        ? { type, title, address: preservedAddress, googleMapsUrl, links: preservedLinks, memo }
        : { type, title, address: preservedAddress, googleMapsUrl, links: preservedLinks, memo, order: sequenceOrder };
      await onSubmit(data);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (lockedType && type !== lockedType) {
      setType(lockedType);
    }
  }, [lockedType, type]);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
        {lockedType ? (
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${ITEM_TYPE_BADGE_CLASS[lockedType]}`}
          >
            {ITEM_TYPE_LABEL[lockedType]}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ITEM_TYPE_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? `${ITEM_TYPE_BADGE_CLASS[t]} border-2`
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {ITEM_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            const value = e.target.value;
            setTitle(value);
            setHasManualTitle(value.trim().length > 0);
          }}
          placeholder="예: 트레비 분수"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">구글맵 URL</label>
        <input
          type="url"
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          placeholder="https://maps.google.com/..."
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="추가 메모..."
          rows={3}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장 중...' : initialData ? '수정' : '추가'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          취소
        </button>
      </div>
    </form>
  );
}
