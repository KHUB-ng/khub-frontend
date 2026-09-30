import { useState, type FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { admin, ApiError } from "@/api";
import { Shield, Search, Loader2, AlertTriangle } from "lucide-react";

type EscrowRow = Record<string, unknown>;

function str(v: unknown): string {
  if (v === null || v === undefined) return "-";
  return String(v);
}

function shortPid(v: unknown): string {
  const s = str(v);
  return s.length > 12 ? `${s.slice(0, 8)}...` : s;
}

/**
 * Admin escrow oversight. There is no user-facing escrow table on the
 * backend — escrow state lives inside orders/rides/deliveries — so this
 * lists the admin oversight endpoint `GET /api/admin/escrows` instead of
 * the old Supabase `escrow_holds` table. Release/reject actions do not
 * exist here; frozen funds are settled via the Disputes tab
 * (`admin.resolveOrder/Ride/Delivery`).
 */
export const AdminEscrowManager: FC = () => {
  const [status, setStatus] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  const escrowsQuery = useQuery({
    queryKey: ["admin", "escrows", appliedStatus ?? "all"],
    queryFn: () => admin.escrows(appliedStatus ? { status: appliedStatus } : {}),
  });

  const rows = ((escrowsQuery.data ?? []) as EscrowRow[]).filter((row) => {
    if (!searchTerm) return true;
    const haystack =
      `${str(row.pid)} ${str(row.kind)} ${str(row.status)}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const err = escrowsQuery.error as ApiError | null;
  const forbidden = err instanceof ApiError && err.status === 403;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-500" />
          Escrow Oversight
        </h1>
        <p className="text-gray-600">
          Admin-only view of funds held in escrow inside orders, rides and deliveries.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Tracked holds</p>
          <p className="text-2xl font-bold">{escrowsQuery.data?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Matching filter</p>
          <p className="text-2xl font-bold">{rows.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <form
          className="flex flex-col md:flex-row gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedStatus(status.trim() ? status.trim() : undefined);
          }}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by reference, kind or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md input-field"
            />
          </div>
          <input
            type="text"
            placeholder="Status filter (blank = all)"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border rounded-md input-field md:w-56"
          />
          <button type="submit" className="px-4 py-2 border rounded-md hover:bg-gray-50">
            Apply
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kind</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {escrowsQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : forbidden ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Admin role required.
                  </td>
                </tr>
              ) : escrowsQuery.isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    Could not load escrow holds. Please try again.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No escrow holds found.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={str(row.pid ?? row.id ?? i)} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm" title={str(row.pid)}>
                      {shortPid(row.pid ?? row.id)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">
                        {str(row.kind ?? row.entity_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {str(
                        row.amount_display ??
                          (row.amount_kobo !== null && row.amount_kobo !== undefined
                            ? `${str(row.amount_kobo)} kobo`
                            : "-"),
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs capitalize">
                        {str(row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {(row.updated_at ?? row.created_at)
                        ? new Date(str(row.updated_at ?? row.created_at)).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
