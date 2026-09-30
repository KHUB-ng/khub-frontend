/**
 * API coverage manifest — the definition of done for "expose every single API".
 *
 * Source of truth for `docs/API_COVERAGE.md`; regenerate with
 * `npm run coverage:md`. Every route in `khub-backend/docs/API.md` must appear
 * here exactly once with one of these statuses:
 *
 *   wired     – typed client function exists and is called from the UI
 *   client    – typed client function exists, no UI surface yet
 *   deferred  – cannot be called from the browser yet (reason required)
 *   ops       – server-to-server / ops only; the frontend never calls it
 */

export type RouteStatus = "wired" | "client" | "deferred" | "ops";

export interface RouteEntry {
  method: string;
  path: string;
  status: RouteStatus;
  /** Required when status is `deferred`. */
  note?: string;
  /** Name of the exported function in `src/api/*`. */
  fn?: string;
}

export interface RouteGroup {
  group: string;
  routes: RouteEntry[];
}

export const COVERAGE: RouteGroup[] = [
  {
    group: "Framework status",
    routes: [
      { method: "GET", path: "/_ping", status: "ops" },
      { method: "GET", path: "/_health", status: "ops" },
      { method: "GET", path: "/_readiness", status: "ops" },
    ],
  },
  {
    group: "Auth — /api/auth",
    routes: [
      { method: "POST", path: "/api/auth/register", status: "wired", fn: "auth.register" },
      { method: "GET", path: "/api/auth/verify/{token}", status: "wired", fn: "auth.verifyEmail" },
      { method: "POST", path: "/api/auth/login", status: "wired", fn: "auth.login" },
      { method: "POST", path: "/api/auth/google", status: "client", fn: "auth.loginWithGoogle" },
      { method: "POST", path: "/api/auth/refresh", status: "wired", fn: "auth.refresh (client.ts)" },
      { method: "POST", path: "/api/auth/logout", status: "wired", fn: "auth.logout" },
      { method: "GET", path: "/api/auth/sessions", status: "wired", fn: "auth.sessions" },
      {
        method: "DELETE",
        path: "/api/auth/sessions/{session_id}",
        status: "wired",
        fn: "auth.revokeSession",
      },
      { method: "POST", path: "/api/auth/forgot", status: "wired", fn: "auth.forgotPassword" },
      { method: "POST", path: "/api/auth/reset", status: "wired", fn: "auth.resetPassword" },
      { method: "GET", path: "/api/auth/current", status: "wired", fn: "auth.currentUser" },
      { method: "POST", path: "/api/auth/magic-link", status: "wired", fn: "auth.magicLink" },
      {
        method: "GET",
        path: "/api/auth/magic-link/{token}",
        status: "wired",
        fn: "auth.redeemMagicLink",
      },
      {
        method: "POST",
        path: "/api/auth/resend-verification-mail",
        status: "wired",
        fn: "auth.resendVerification",
      },
    ],
  },
  {
    group: "User — /api/user",
    routes: [
      { method: "GET", path: "/api/user/profile", status: "wired", fn: "user.profile" },
      { method: "PATCH", path: "/api/user/profile", status: "wired", fn: "user.updateProfile" },
      { method: "GET", path: "/api/user/kyc", status: "wired", fn: "user.kycStatus" },
      { method: "POST", path: "/api/user/kyc", status: "wired", fn: "user.submitKyc" },
    ],
  },
  {
    group: "Wallet — /api/wallet",
    routes: [
      { method: "GET", path: "/api/wallet", status: "wired", fn: "wallet.get" },
      { method: "GET", path: "/api/wallet/entries", status: "wired", fn: "wallet.entries" },
      { method: "POST", path: "/api/wallet/fund", status: "wired", fn: "wallet.fund" },
      { method: "GET", path: "/api/wallet/fund/{pid}", status: "wired", fn: "wallet.getFundIntent" },
      { method: "POST", path: "/api/wallet/withdraw", status: "wired", fn: "wallet.withdraw" },
      { method: "GET", path: "/api/wallet/withdrawals", status: "wired", fn: "wallet.withdrawals" },
      { method: "POST", path: "/api/wallet/transfer", status: "wired", fn: "wallet.transfer" },
      { method: "GET", path: "/api/wallet/banks", status: "wired", fn: "wallet.banks" },
    ],
  },
  {
    group: "Payments webhook",
    routes: [
      {
        method: "POST",
        path: "/webhooks/flutterwave",
        status: "ops",
        note: "Flutterwave → server; verified by verif-hash header",
      },
    ],
  },
  {
    group: "Listings — /api/listings",
    routes: [
      { method: "POST", path: "/api/listings", status: "wired", fn: "listings.create" },
      { method: "GET", path: "/api/listings", status: "wired", fn: "listings.browse" },
      { method: "GET", path: "/api/listings/search", status: "wired", fn: "listings.search" },
      { method: "GET", path: "/api/listings/{pid}", status: "wired", fn: "listings.get" },
      { method: "PATCH", path: "/api/listings/{pid}", status: "wired", fn: "listings.update" },
      { method: "DELETE", path: "/api/listings/{pid}", status: "wired", fn: "listings.remove" },
      {
        method: "PATCH",
        path: "/api/listings/{pid}/status",
        status: "wired",
        fn: "listings.setStatus",
      },
      { method: "GET", path: "/api/my/listings", status: "wired", fn: "listings.mine" },
      {
        method: "POST",
        path: "/api/listings/{pid}/images",
        status: "wired",
        fn: "listings.addImage",
      },
      {
        method: "DELETE",
        path: "/api/listings/{pid}/images/{image_pid}",
        status: "wired",
        fn: "listings.removeImage",
      },
    ],
  },
  {
    group: "Orders, reviews, wishlist — /api",
    routes: [
      { method: "POST", path: "/api/orders", status: "wired", fn: "orders.create" },
      { method: "GET", path: "/api/orders", status: "wired", fn: "orders.list" },
      { method: "GET", path: "/api/orders/{pid}", status: "wired", fn: "orders.get" },
      { method: "POST", path: "/api/orders/{pid}/deliver", status: "wired", fn: "orders.markDelivered" },
      { method: "POST", path: "/api/orders/{pid}/confirm", status: "wired", fn: "orders.confirm" },
      { method: "POST", path: "/api/orders/{pid}/cancel", status: "wired", fn: "orders.cancel" },
      { method: "POST", path: "/api/orders/{pid}/dispute", status: "wired", fn: "orders.dispute" },
      { method: "POST", path: "/api/orders/{pid}/review", status: "wired", fn: "orders.review" },
      { method: "GET", path: "/api/listings/{pid}/reviews", status: "wired", fn: "listings.reviews" },
      { method: "POST", path: "/api/wishlist/{pid}", status: "wired", fn: "listings.toggleWishlist" },
      { method: "GET", path: "/api/my/wishlist", status: "wired", fn: "listings.wishlist" },
    ],
  },
  {
    group: "Rides — /api/rides",
    routes: [
      { method: "POST", path: "/api/rides/estimate", status: "wired", fn: "rides.estimate" },
      { method: "POST", path: "/api/rides", status: "wired", fn: "rides.requestRide" },
      { method: "GET", path: "/api/rides/mine", status: "wired", fn: "rides.mine" },
      { method: "GET", path: "/api/rides/{pid}", status: "wired", fn: "rides.get" },
      {
        method: "GET",
        path: "/api/rides/{pid}/track",
        status: "deferred",
        note: "WebSocket, header-only auth — browsers cannot set WS headers",
      },
      { method: "POST", path: "/api/rides/{pid}/cancel", status: "wired", fn: "rides.cancel" },
      { method: "POST", path: "/api/rides/{pid}/dispute", status: "wired", fn: "rides.dispute" },
      { method: "POST", path: "/api/rides/{pid}/rate", status: "wired", fn: "rides.rate" },
    ],
  },
  {
    group: "Driver — /api/driver",
    routes: [
      { method: "POST", path: "/api/driver/apply", status: "wired", fn: "driver.apply" },
      { method: "GET", path: "/api/driver/me", status: "wired", fn: "driver.me" },
      {
        method: "GET",
        path: "/api/driver/socket",
        status: "deferred",
        note: "WebSocket, header-only auth — browsers cannot set WS headers",
      },
      { method: "GET", path: "/api/driver/requests", status: "wired", fn: "driver.requests" },
      { method: "GET", path: "/api/driver/rides", status: "wired", fn: "driver.rides" },
      { method: "GET", path: "/api/driver/earnings", status: "wired", fn: "driver.earnings" },
      { method: "GET", path: "/api/driver/{pid}/rating", status: "wired", fn: "driver.rating" },
      { method: "POST", path: "/api/driver/rides/{pid}/accept", status: "wired", fn: "driver.accept" },
      { method: "POST", path: "/api/driver/rides/{pid}/arriving", status: "wired", fn: "driver.arriving" },
      { method: "POST", path: "/api/driver/rides/{pid}/start", status: "wired", fn: "driver.start" },
      { method: "POST", path: "/api/driver/rides/{pid}/complete", status: "wired", fn: "driver.complete" },
    ],
  },
  {
    group: "Deliveries — /api/deliveries",
    routes: [
      { method: "POST", path: "/api/deliveries/estimate", status: "wired", fn: "deliveries.estimate" },
      { method: "POST", path: "/api/deliveries", status: "wired", fn: "deliveries.requestDelivery" },
      { method: "GET", path: "/api/deliveries/mine", status: "wired", fn: "deliveries.mine" },
      { method: "GET", path: "/api/deliveries/{pid}", status: "wired", fn: "deliveries.get" },
      {
        method: "GET",
        path: "/api/deliveries/{pid}/track",
        status: "deferred",
        note: "WebSocket, header-only auth — browsers cannot set WS headers",
      },
      { method: "POST", path: "/api/deliveries/{pid}/cancel", status: "wired", fn: "deliveries.cancel" },
      { method: "POST", path: "/api/deliveries/{pid}/dispute", status: "wired", fn: "deliveries.dispute" },
      { method: "POST", path: "/api/deliveries/{pid}/rate", status: "wired", fn: "deliveries.rate" },
      {
        method: "GET",
        path: "/api/deliveries/public/{code}",
        status: "wired",
        fn: "deliveries.publicTracker",
      },
    ],
  },
  {
    group: "Delivery agent — /api/agent",
    routes: [
      { method: "POST", path: "/api/agent/apply", status: "wired", fn: "agent.apply" },
      { method: "GET", path: "/api/agent/me", status: "wired", fn: "agent.me" },
      {
        method: "GET",
        path: "/api/agent/socket",
        status: "deferred",
        note: "WebSocket, header-only auth — browsers cannot set WS headers",
      },
      { method: "GET", path: "/api/agent/requests", status: "wired", fn: "agent.requests" },
      { method: "GET", path: "/api/agent/deliveries", status: "wired", fn: "agent.deliveries" },
      { method: "GET", path: "/api/agent/earnings", status: "wired", fn: "agent.earnings" },
      { method: "GET", path: "/api/agent/{pid}/rating", status: "wired", fn: "agent.rating" },
      { method: "POST", path: "/api/agent/deliveries/{pid}/accept", status: "wired", fn: "agent.accept" },
      { method: "POST", path: "/api/agent/deliveries/{pid}/pickup", status: "wired", fn: "agent.pickup" },
      { method: "POST", path: "/api/agent/deliveries/{pid}/transit", status: "wired", fn: "agent.transit" },
      { method: "POST", path: "/api/agent/deliveries/{pid}/complete", status: "wired", fn: "agent.complete" },
    ],
  },
  {
    group: "Job applications — /api",
    routes: [
      {
        method: "POST",
        path: "/api/listings/{pid}/applications",
        status: "wired",
        fn: "referrals.apply",
      },
      {
        method: "GET",
        path: "/api/listings/{pid}/applications/list",
        status: "wired",
        fn: "referrals.applicantsFor",
      },
      { method: "GET", path: "/api/my/applications", status: "wired", fn: "referrals.myApplications" },
      {
        method: "POST",
        path: "/api/applications/{pid}/status",
        status: "wired",
        fn: "referrals.setStatus",
      },
    ],
  },
  {
    group: "Chat — /api/conversations",
    routes: [
      { method: "POST", path: "/api/conversations", status: "wired", fn: "conversations.getOrCreate" },
      { method: "GET", path: "/api/conversations", status: "wired", fn: "conversations.list" },
      { method: "GET", path: "/api/conversations/{pid}", status: "wired", fn: "conversations.get" },
      {
        method: "GET",
        path: "/api/conversations/{pid}/messages",
        status: "wired",
        fn: "conversations.messages",
      },
      { method: "POST", path: "/api/conversations/{pid}/messages", status: "wired", fn: "conversations.send" },
      { method: "POST", path: "/api/conversations/{pid}/read", status: "wired", fn: "conversations.markRead" },
      {
        method: "POST",
        path: "/api/conversations/{pid}/attachments",
        status: "wired",
        fn: "conversations.uploadAttachment",
      },
    ],
  },
  {
    group: "Chat WebSocket",
    routes: [
      { method: "GET", path: "/api/ws", status: "wired", note: "ChatSocket in api/ws.ts", fn: "ws.ChatSocket" },
      {
        method: "GET",
        path: "/api/chat/ws",
        status: "wired",
        note: "alias of /api/ws",
        fn: "ws.ChatSocket",
      },
    ],
  },
  {
    group: "Notifications — /api/notifications",
    routes: [
      { method: "GET", path: "/api/notifications", status: "wired", fn: "notifications.list" },
      { method: "GET", path: "/api/notifications/unread_count", status: "wired", fn: "notifications.unreadCount" },
      { method: "POST", path: "/api/notifications/{pid}/read", status: "wired", fn: "notifications.markRead" },
      { method: "POST", path: "/api/notifications/read_all", status: "wired", fn: "notifications.markAllRead" },
    ],
  },
  {
    group: "Referrals — /api/referrals",
    routes: [{ method: "GET", path: "/api/referrals", status: "wired", fn: "referrals.dashboard" }],
  },
  {
    group: "Admin — /api/admin (30)",
    routes: [
      { method: "GET", path: "/api/admin/heartbeat", status: "wired", fn: "admin.heartbeat" },
      { method: "GET", path: "/api/admin/withdrawals", status: "wired", fn: "admin.withdrawals" },
      { method: "POST", path: "/api/admin/withdrawals/{pid}/approve", status: "wired", fn: "admin.approveWithdrawal" },
      { method: "POST", path: "/api/admin/withdrawals/{pid}/reject", status: "wired", fn: "admin.rejectWithdrawal" },
      { method: "POST", path: "/api/admin/orders/{pid}/resolve", status: "wired", fn: "admin.resolveOrder" },
      { method: "POST", path: "/api/admin/rides/{pid}/resolve", status: "wired", fn: "admin.resolveRide" },
      { method: "POST", path: "/api/admin/deliveries/{pid}/resolve", status: "wired", fn: "admin.resolveDelivery" },
      { method: "POST", path: "/api/admin/listings/{pid}/remove", status: "wired", fn: "admin.removeListing" },
      { method: "POST", path: "/api/admin/listings/{pid}/reactivate", status: "wired", fn: "admin.reactivateListing" },
      { method: "GET", path: "/api/admin/drivers", status: "wired", fn: "admin.drivers" },
      { method: "POST", path: "/api/admin/drivers/{pid}/verify", status: "wired", fn: "admin.verifyDriver" },
      { method: "POST", path: "/api/admin/drivers/{pid}/reject", status: "wired", fn: "admin.rejectDriver" },
      { method: "POST", path: "/api/admin/drivers/{pid}/suspend", status: "wired", fn: "admin.suspendDriver" },
      { method: "GET", path: "/api/admin/delivery-agents", status: "wired", fn: "admin.deliveryAgents" },
      { method: "POST", path: "/api/admin/delivery-agents/{pid}/verify", status: "wired", fn: "admin.verifyAgent" },
      { method: "POST", path: "/api/admin/delivery-agents/{pid}/reject", status: "wired", fn: "admin.rejectAgent" },
      { method: "POST", path: "/api/admin/delivery-agents/{pid}/suspend", status: "wired", fn: "admin.suspendAgent" },
      { method: "GET", path: "/api/admin/audit", status: "wired", fn: "admin.audit" },
      { method: "GET", path: "/api/admin/kyc", status: "wired", fn: "admin.kycQueue" },
      { method: "POST", path: "/api/admin/kyc/{user_pid}/{doc_type}/approve", status: "wired", fn: "admin.approveKyc" },
      { method: "POST", path: "/api/admin/kyc/{user_pid}/{doc_type}/reject", status: "wired", fn: "admin.rejectKyc" },
      { method: "GET", path: "/api/admin/users", status: "wired", fn: "admin.users" },
      { method: "POST", path: "/api/admin/users/{pid}/role", status: "wired", fn: "admin.setUserRole" },
      { method: "POST", path: "/api/admin/users/{pid}/block", status: "wired", fn: "admin.blockUser" },
      { method: "POST", path: "/api/admin/users/{pid}/unblock", status: "wired", fn: "admin.unblockUser" },
      { method: "GET", path: "/api/admin/escrows", status: "wired", fn: "admin.escrows" },
      { method: "GET", path: "/api/admin/wallets", status: "wired", fn: "admin.wallets" },
      { method: "GET", path: "/api/admin/users/{pid}/wallet", status: "wired", fn: "admin.userWallet" },
      { method: "GET", path: "/api/admin/stats", status: "wired", fn: "admin.stats" },
      { method: "GET", path: "/api/admin/monitor", status: "wired", fn: "admin.monitor" },
    ],
  },
];

export interface CoverageTotals {
  total: number;
  wired: number;
  client: number;
  deferred: number;
  ops: number;
}

export function totals(): CoverageTotals {
  const all = COVERAGE.flatMap((g) => g.routes);
  const count = (s: RouteStatus) => all.filter((r) => r.status === s).length;
  return {
    total: all.length,
    wired: count("wired"),
    client: count("client"),
    deferred: count("deferred"),
    ops: count("ops"),
  };
}
