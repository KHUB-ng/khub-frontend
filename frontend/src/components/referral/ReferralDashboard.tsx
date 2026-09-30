import { useState, type FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { referrals } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Share2,
  Copy,
  Check,
  Users,
  DollarSign,
  Gift,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Referral dashboard on `GET /api/referrals`. The code is issued lazily on
 * first read; referee identities are never exposed by the backend, so the
 * history shows status/reward/date only. All money uses the server's
 * `*_display` strings.
 */
export const ReferralDashboard: FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const query = useQuery({
    queryKey: ["referrals"],
    queryFn: referrals.dashboard,
    enabled: !!user,
    retry: false,
  });

  if (!user) {
    return <div className="flex justify-center p-8 text-gray-500">Please log in to view referrals.</div>;
  }

  if (query.isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="max-w-6xl mx-auto p-4 text-center">
        <p className="text-gray-600 mb-4">Could not load referral data.</p>
        <button
          onClick={() => query.refetch()}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
        >
          Try again
        </button>
      </div>
    );
  }

  const data = query.data;
  const referralLink = `${window.location.origin}/register?ref=${data.code}`;

  const copyReferralLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Join KHUB using my referral link and earn rewards! ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnTwitter = () => {
    const text = `Join KHUB using my referral link and earn rewards!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Referral Program</h1>
        <p className="text-gray-600">Invite friends and earn rewards when they join KHUB</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <Users className="w-6 h-6" />
            <span className="text-2xl font-bold">{data.stats.total}</span>
          </div>
          <p className="text-purple-100">Total Referrals</p>
          <p className="text-sm text-purple-200">
            {data.stats.rewarded} rewarded · {data.stats.pending} pending
            {data.stats.rejected > 0 && ` · ${data.stats.rejected} rejected`}
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <DollarSign className="w-6 h-6" />
            <span className="text-2xl font-bold">{data.stats.earned_display}</span>
          </div>
          <p className="text-green-100">Total Earnings</p>
          <p className="text-sm text-green-200">Lifetime rewards</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <Clock className="w-6 h-6" />
            <span className="text-2xl font-bold">{data.stats.pending}</span>
          </div>
          <p className="text-blue-100">Pending Rewards</p>
          <p className="text-sm text-blue-200">Awaiting verification</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <Gift className="w-6 h-6" />
            <span className="text-2xl font-bold">{data.reward_naira_display}</span>
          </div>
          <p className="text-orange-100">Per Referral</p>
          <p className="text-sm text-orange-200">Reward per verified signup</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
            {referralLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={shareOnTwitter}
              className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition-colors"
            >
              Twitter
            </button>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="font-semibold mb-2">1. Share Your Link</h3>
            <p className="text-sm text-gray-600">Share your unique referral link with friends</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="font-semibold mb-2">2. Friend Joins</h3>
            <p className="text-sm text-gray-600">They sign up using your link</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
            <p className="text-sm text-gray-600">Earn {data.reward_naira_display} when they verify</p>
          </div>
        </div>
      </div>

      {/* Referral History — referee identities are never exposed by the backend */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Referral History</h2>
        </div>

        {data.referrals.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No referrals yet</p>
            <p className="text-sm">Share your link to start earning!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.referrals.map((referral, i) => (
              <div key={i} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    referral.status === "rewarded" ? "bg-green-500" : referral.status === "rejected" ? "bg-red-400" : "bg-yellow-500"
                  }`} />
                  <div>
                    <p className="font-medium capitalize">{referral.status}</p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                      {referral.rewarded_at && ` · rewarded ${new Date(referral.rewarded_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {referral.status === "rewarded" ? (
                    <p className="font-semibold text-green-600">
                      +{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(referral.reward_kobo / 100)}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm capitalize">{referral.status}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
