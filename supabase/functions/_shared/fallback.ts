// Decides whether an upstream provider failure should roll over to the fallback.
//
// - User-initiated aborts never fall back (the request is done).
// - Transport-layer failures (TypeError from fetch) always fall back — the
//   primary provider is unreachable.
// - HTTP 5xx / 429 / 401 / 403 fall back — server trouble or provider-side
//   auth problems where the backup key may still work.
// - Other 4xx (400, 404, …) are our bug — do not mask them by retrying.
// - Unknown shapes default to fall back, erring on the side of serving the user.

export function isRetryable(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return false;
  if (err instanceof TypeError) return true;
  const status = (err as { status?: number } | null)?.status;
  if (typeof status === 'number') {
    if (status >= 500) return true;
    if (status === 429 || status === 401 || status === 403) return true;
    return false;
  }
  return true;
}
