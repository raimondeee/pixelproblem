/** Resolve a public asset path for the current Vite base URL (local dev vs GitHub Pages). */
export function assetUrl(path: string): string {
  const normalized = path.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
}
