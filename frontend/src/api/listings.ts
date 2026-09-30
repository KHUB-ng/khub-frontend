import { request, upload } from "./client";
import { pageQuery } from "./pagination";
import type {
  ListingDetail,
  ListingResponse,
  Page,
  Pid,
  Review,
  Vertical,
  WishlistItem,
} from "./types";
import type { PageQuery } from "./pagination";

/**
 * `/api/listings` — marketplace core, four verticals.
 *
 * Role gate is PER VERTICAL and there is no self-service role upgrade, so a
 * plain buyer gets 403 on create. Roles are granted by a superadmin via
 * `POST /api/admin/users/{pid}/role` (or the CLI task).
 */

export type ListingSort = "newest" | "price_asc" | "price_desc";

export interface CreateListingInput {
  vertical: Vertical;
  title: string;
  description: string;
  category: string;
  location?: string;
  /** Naira string — required for every vertical except `job`. */
  price?: string;
  quantity?: number;
  discount_percent?: number;
  attributes?: Record<string, unknown>;
}

export interface BrowseFilters extends PageQuery {
  vertical?: Vertical;
  category?: string;
  location?: string;
  min_price?: string;
  max_price?: string;
  sort?: ListingSort;
}

export function create(input: CreateListingInput): Promise<ListingResponse> {
  return request<ListingResponse>("/api/listings", { method: "POST", body: input });
}

/** Public, ACTIVE only → `Page` envelope. */
export function browse(filters: BrowseFilters = {}): Promise<Page<ListingResponse>> {
  const { page, page_size, ...rest } = filters;
  return request<Page<ListingResponse>>("/api/listings", {
    query: { ...pageQuery({ page, page_size }), ...rest },
    auth: false,
  });
}

/** FTS5 bm25-ranked; `q` is required and sanitized server-side. */
export function search(
  q: string,
  filters: BrowseFilters = {},
): Promise<Page<ListingResponse>> {
  const { page, page_size, ...rest } = filters;
  return request<Page<ListingResponse>>("/api/listings/search", {
    query: { q, ...pageQuery({ page, page_size }), ...rest },
    auth: false,
  });
}

export function get(pid: string): Promise<ListingDetail> {
  return request<ListingDetail>(`/api/listings/${pid}`, { auth: false });
}

export function update(
  pid: string,
  patch: Partial<CreateListingInput>,
): Promise<ListingResponse> {
  return request<ListingResponse>(`/api/listings/${pid}`, { method: "PATCH", body: patch });
}

/** Soft-archive (owner only). */
export function remove(pid: string): Promise<unknown> {
  return request<unknown>(`/api/listings/${pid}`, { method: "DELETE" });
}

/** Owner transitions only: pause | activate | archive. */
export function setStatus(pid: string, status: "paused" | "active" | "archived") {
  return request<ListingResponse>(`/api/listings/${pid}/status`, {
    method: "PATCH",
    body: { status },
  });
}

/** All statuses, newest first. */
export function mine(): Promise<ListingResponse[]> {
  return request<ListingResponse[]>("/api/my/listings");
}

// ── Images (owner-gated; multipart field name is `image`) ───────────────────

export function addImage(pid: string, file: File): Promise<{ pid: Pid; url: string }> {
  const fd = new FormData();
  fd.append("image", file);
  return upload<{ pid: Pid; url: string }>(`/api/listings/${pid}/images`, fd);
}

export function removeImage(pid: string, imagePid: string): Promise<unknown> {
  return request<unknown>(`/api/listings/${pid}/images/${imagePid}`, {
    method: "DELETE",
  });
}

// ── Reviews (public read) ───────────────────────────────────────────────────

export function reviews(listingPid: string): Promise<Review[]> {
  return request<Review[]>(`/api/listings/${listingPid}/reviews`, { auth: false });
}

// ── Wishlist (idempotent toggle) ────────────────────────────────────────────

export function toggleWishlist(pid: string): Promise<{ saved: boolean; action: string }> {
  return request<{ saved: boolean; action: string }>(`/api/wishlist/${pid}`, {
    method: "POST",
  });
}

export function wishlist(): Promise<WishlistItem[]> {
  return request<WishlistItem[]>("/api/my/wishlist");
}
