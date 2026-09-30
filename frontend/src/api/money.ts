/**
 * Money rules (docs/API.md → Conventions):
 *
 *   OUT (we send): a naira **string**, `"1500.05"` — never a JSON number.
 *                  The backend rejects floats in the money path.
 *   IN  (we get):  an integer **kobo** field (`balance_kobo`) plus a
 *                  preformatted `*_display` string ("₦1500.05").
 *
 * Never compute a payable total client-side from `*_kobo` — always use the
 * server's `*_display`, which already reflects configured rates and limits.
 */

const NAIRA = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Kobo → "₦1500.05" (fallback when the server omitted `*_display`). */
export function koboToNaira(kobo: number): string {
  return NAIRA.format(kobo / 100);
}

/**
 * Normalise user input into the exact naira string the API expects.
 * Returns null when the input isn't a valid positive amount.
 */
export function toNairaString(input: string | number): string | null {
  const cleaned = String(input).replace(/[,\s₦]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value.toFixed(2);
}

/** Whole naira only — `POST /api/wallet/withdraw` enforces this. */
export function toWholeNaira(input: string | number): string | null {
  const cleaned = String(input).replace(/[,\s₦]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return String(value);
}

/** Client-side sanity check only — limits are config-driven and the server
 *  quotes the real values in its 400 `description`. */
export function isValidNaira(input: string | number): boolean {
  return toNairaString(input) !== null;
}
