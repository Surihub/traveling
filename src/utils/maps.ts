export function openGoogleMaps(url?: string, address?: string): void {
  if (url) {
    window.open(url, '_blank');
  } else if (address) {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  }
}

interface DirectionsParams {
  originName?: string;
  originAddress?: string;
  originMapUrl?: string;
  destinationName?: string;
  destinationAddress?: string;
  destinationMapUrl?: string;
}

function resolveDirectionsParam(label?: string, address?: string, mapUrl?: string): string | null {
  if (mapUrl) {
    const extracted = extractPlaceNameFromGoogleMapsUrl(mapUrl);
    if (extracted) return extracted;
    return mapUrl;
  }
  if (address?.trim()) return address.trim();
  if (label?.trim()) return label.trim();
  return null;
}

export function buildDirectionsUrl(params: DirectionsParams): string | null {
  const origin = resolveDirectionsParam(params.originName, params.originAddress, params.originMapUrl);
  const destination = resolveDirectionsParam(
    params.destinationName,
    params.destinationAddress,
    params.destinationMapUrl,
  );
  if (!destination) return null;
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', destination);
  if (origin) {
    url.searchParams.set('origin', origin);
  }
  url.searchParams.set('travelmode', 'driving');
  return url.toString();
}

export function openGoogleDirections(params: DirectionsParams): void {
  const url = buildDirectionsUrl(params);
  if (url) {
    window.open(url, '_blank');
  }
}

export function buildMapEmbedUrl(options: { query?: string; mapUrl?: string }): string | null {
  if (options.mapUrl) {
    const url = options.mapUrl;
    if (url.includes('output=embed') || url.includes('/embed')) {
      return url;
    }
    const place = extractPlaceNameFromGoogleMapsUrl(url);
    if (place) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }
  }
  if (options.query?.trim()) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(options.query.trim())}&output=embed`;
  }
  return null;
}

export function generateGoogleMapsUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

function cleanPlaceSegment(value: string): string {
  if (!value) return '';
  const decoded = decodeURIComponent(value.replace(/\+/g, ' '));
  return decoded.replace(/@.*$/, '').replace(/\s+/g, ' ').trim();
}

export function extractPlaceNameFromGoogleMapsUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
    if (placeMatch?.[1]) {
      const cleaned = cleanPlaceSegment(placeMatch[1]);
      if (cleaned) {
        return cleaned;
      }
    }

    const queryKeys = ['q', 'query', 'destination', 'origin'];
    for (const key of queryKeys) {
      const value = parsed.searchParams.get(key);
      if (value) {
        const cleaned = cleanPlaceSegment(value);
        if (cleaned) {
          return cleaned;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}
