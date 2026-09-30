import type { KeysetQuery, Page } from "./types";

/**
 * The backend uses TWO pagination shapes and mixing them up silently returns
 * the wrong thing. Both live here so callers pick deliberately.
 */

/** Browse/search: `?page=&page_size=` → `Page<T>` with totals. */
export interface PageQuery {
  page?: number;
  page_size?: number;
}

export function pageQuery(q: PageQuery = {}): Record<string, number> {
  const out: Record<string, number> = {};
  if (q.page !== undefined) out.page = q.page;
  if (q.page_size !== undefined) out.page_size = q.page_size;
  return out;
}

export function emptyPage<T>(): Page<T> {
  return { items: [], page: 1, page_size: 0, total_pages: 0, total_items: 0 };
}

export function isLastPage<T>(p: Page<T>): boolean {
  return p.page >= p.total_pages;
}

/** History/feeds: `?after=<id>&limit=` keyset, newest first, NO totals. */
export function keysetQuery(
  q: KeysetQuery = {},
  defaultLimit = 50,
): Record<string, number> {
  const out: Record<string, number> = { limit: q.limit ?? defaultLimit };
  if (q.after !== undefined) out.after = q.after;
  return out;
}

/** Cursor for "load more": the id of the last row you already hold. */
export function nextCursor<T extends { id: number }>(
  rows: T[],
  fallback?: number,
): number | undefined {
  const last = rows[rows.length - 1];
  return last ? last.id : fallback;
}
