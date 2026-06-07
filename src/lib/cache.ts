const CACHE_NAME = 'elshaday-cache-v1';
const AR_CACHE_NAME = 'elshaday-ar-v1';

export async function cacheAsset(url: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(AR_CACHE_NAME);
    const response = await fetch(url, { cache: 'force-cache' });
    if (response.ok) cache.put(url, response);
  } catch {}
}

export async function getCachedAsset(url: string): Promise<Response | undefined> {
  if (typeof window === 'undefined' || !('caches' in window)) return undefined;
  try {
    const cache = await caches.open(AR_CACHE_NAME);
    const cached = await cache.match(url);
    return cached;
  } catch { return undefined; }
}

export async function preloadARModels(models: { glb: string; usdz: string }[]): Promise<void> {
  if (typeof window === 'undefined') return;
  const urls = models.flatMap(m => [m.glb, m.usdz]);
  await Promise.allSettled(urls.map(url => cacheAsset(url)));
}

export async function cacheImage(url: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    if (!url.startsWith('http')) return;
    const cached = await cache.match(url);
    if (!cached) {
      const response = await fetch(url, { cache: 'force-cache' });
      if (response.ok) cache.put(url, response);
    }
  } catch {}
}

export async function cacheAllImages(images: string[]): Promise<void> {
  if (typeof window === 'undefined') return;
  const externalImages = images.filter(img => img.startsWith('http'));
  await Promise.allSettled(externalImages.map(url => cacheImage(url)));
}

export function getCachedImageUrl(url: string): string {
  return url;
}

export async function clearCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    await caches.delete(CACHE_NAME);
    await caches.delete(AR_CACHE_NAME);
  } catch {}
}
