import { useQuery } from "@tanstack/react-query";
import { Copy, Share2, Gift, Users, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { referrals } from "@/api";
import { toast } from "sonner";

const ReferralCard = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["referrals"],
    queryFn: referrals.dashboard,
    enabled: !!user,
    retry: false,
  });

  if (!user) return null;

  if (query.isLoading) {
    return (
      <div className="p-5 border border-border rounded-xl flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-5 border border-border rounded-xl bg-gradient-to-br from-primary/5 to-accent/30">
        <p className="text-sm text-muted-foreground mb-3">Could not load your referral info.</p>
        <Button onClick={() => query.refetch()} variant="outline" size="sm" className="text-xs h-8">
          Try again
        </Button>
      </div>
    );
  }

  const data = query.data;
  const referralLink = `${window.location.origin}/register?ref=${data.code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Khub",
          text: "Nigeria's all-in-one marketplace. Sign up with my link!",
          url: referralLink,
        });
      } catch {/* user cancelled */}
    } else {
      copy();
    }
  };

  return (
    <div className="p-5 border border-border rounded-xl bg-gradient-to-br from-primary/5 to-accent/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Refer & Earn</h3>
          <p className="text-xs text-muted-foreground">{data.reward_naira_display} per referral</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-lg bg-card border border-border">
          <Users className="w-4 h-4 text-muted-foreground mb-1" />
          <p className="text-lg font-bold text-foreground leading-none">{data.stats.total}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Referrals</p>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border">
          <Wallet className="w-4 h-4 text-primary mb-1" />
          <p className="text-lg font-bold text-foreground leading-none">{data.stats.earned_display}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Earned</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border mb-3">
        <code className="text-xs text-foreground flex-1 truncate">{data.code}</code>
      </div>

      <div className="flex gap-2">
        <Button onClick={copy} variant="outline" size="sm" className="flex-1 text-xs h-8">
          <Copy className="w-3 h-3 mr-1" /> Copy Link
        </Button>
        <Button onClick={share} size="sm" className="flex-1 text-xs h-8 gradient-purple text-primary-foreground">
          <Share2 className="w-3 h-3 mr-1" /> Share
        </Button>
      </div>
    </div>
  );
};

export default ReferralCard;
