import { useMemo } from 'react';
import { buildMapEmbedUrl } from '../utils/maps';

interface MapPreviewProps {
  query?: string;
  mapUrl?: string;
  height?: number;
  label?: string;
}

export function MapPreview({ query, mapUrl, height = 220, label }: MapPreviewProps) {
  const embedUrl = useMemo(() => buildMapEmbedUrl({ query, mapUrl }), [query, mapUrl]);

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {label && (
        <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
          {label}
        </div>
      )}
      <iframe
        src={embedUrl}
        title={label || 'Google Maps 미리보기'}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}
