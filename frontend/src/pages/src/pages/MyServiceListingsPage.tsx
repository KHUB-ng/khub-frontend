import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listings, ApiError, toNairaString } from "@/api";
import type { ListingResponse } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowLeft, Trash2, Pause, Play, Archive } from "lucide-react";

function apiMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.isForbidden)
      return "Your account lacks the service_provider role. Roles are granted by an admin.";
    return err.description || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

const statusBadge = (s?: string) => {
  switch (s) {
    case "active":
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>;
    case "paused":
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Paused</span>;
    case "archived":
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Archived</span>;
    default:
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s || "Unknown"}</span>;
  }
};

const MyServiceListingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  const [openPost, setOpenPost] = useState(false);
  const [post, setPost] = useState({ title: "", description: "", category: "General", location: "", price: "" });

  const mineQuery = useQuery({
    queryKey: ["my-listings"],
    queryFn: listings.mine,
    enabled: isAuthenticated,
  });
  const services = (mineQuery.data ?? []).filter((l) => l.vertical === "service");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["my-listings"] });

  const statusMutation = useMutation({
    mutationFn: ({ pid, status }: { pid: string; status: "paused" | "active" | "archived" }) =>
      listings.setStatus(pid, status),
    onSuccess: (_, v) => {
      toast.success(v.status === "active" ? "Listing activated." : v.status === "paused" ? "Listing paused." : "Listing archived.");
      invalidate();
    },
    onError: (err) => toast.error(apiMsg(err, "Could not update status.")),
  });

  const removeMutation = useMutation({
    mutationFn: (pid: string) => listings.remove(pid),
    onSuccess: () => {
      toast.success("Listing removed.");
      invalidate();
    },
    onError: (err) => toast.error(apiMsg(err, "Could not remove listing.")),
  });

  const postMutation = useMutation({
    mutationFn: () => {
      const price = toNairaString(post.price);
      if (!price) throw new Error("Enter a valid price in naira.");
      return listings.create({
        vertical: "service",
        title: post.title.trim(),
        description: post.description.trim(),
        category: post.category.trim() || "General",
        location: post.location.trim() || undefined,
        price,
      });
    },
    onSuccess: () => {
      toast.success("Service posted!");
      setOpenPost(false);
      setPost({ title: "", description: "", category: "General", location: "", price: "" });
      invalidate();
    },
    onError: (err) => toast.error(apiMsg(err, "Failed to post service.")),
  });

  if (authLoading) return <div className="container py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
  if (!isAuthenticated) return (
    <div className="container py-20 text-center">
      <p>Please log in to view your listings.</p>
      <Link to="/login"><Button className="mt-4 gradient-purple text-primary-foreground">Login</Button></Link>
    </div>
  );

  return (
    <div className="container py-6 px-4">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <Link to="/dashboard" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-1"><ArrowLeft className="w-3 h-3" /> Dashboard</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Service Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage status and availability of each listing.</p>
        </div>
        <Button onClick={() => setOpenPost(true)} className="gradient-purple text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Post a Service
        </Button>
      </div>

      {mineQuery.isLoading ? (
        <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : mineQuery.isError ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          <p>Could not load your listings.</p>
          <Button onClick={() => mineQuery.refetch()} variant="outline" className="mt-4 border-border text-foreground">Retry</Button>
        </div>
      ) : services.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          <p>You haven't posted any services yet.</p>
          <Button onClick={() => setOpenPost(true)} className="mt-4 gradient-purple text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Post your first service
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s: ListingResponse) => (
            <div key={s.pid} className="border border-border rounded-xl p-4 bg-card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    {s.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s.category}</span>}
                    {statusBadge(s.status)}
                  </div>
                  {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {s.location || "Nigeria"} · {s.price_display ?? "Contact for price"}
                    {s.created_at ? ` · posted ${new Date(String(s.created_at)).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {s.status === "paused" ? (
                  <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ pid: s.pid, status: "active" })} className="border-border text-foreground gap-1">
                    <Play className="w-3.5 h-3.5" /> Activate
                  </Button>
                ) : s.status !== "archived" ? (
                  <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ pid: s.pid, status: "paused" })} className="border-border text-foreground gap-1">
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </Button>
                ) : null}
                {s.status !== "archived" && (
                  <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ pid: s.pid, status: "archived" })} className="border-border text-foreground gap-1">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => { if (window.confirm("Remove this listing?")) removeMutation.mutate(s.pid); }} className="border-destructive/30 text-destructive gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-lg w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground">Post a Service</h2>
            <p className="text-xs text-muted-foreground mt-1">Posting requires the service_provider role — an admin grants it, not self-service.</p>
            <div className="space-y-3 mt-4">
              <input value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} placeholder="Service title"
                className="w-full border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <textarea value={post.description} onChange={(e) => setPost({ ...post, description: e.target.value })} rows={4}
                placeholder="Describe your service..."
                className="w-full border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="grid grid-cols-2 gap-3">
                <input value={post.category} onChange={(e) => setPost({ ...post, category: e.target.value })} placeholder="Category"
                  className="border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                <input value={post.price} onChange={(e) => setPost({ ...post, price: e.target.value })} placeholder="Price (₦)"
                  inputMode="decimal" className="border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <input value={post.location} onChange={(e) => setPost({ ...post, location: e.target.value })} placeholder="Location"
                className="w-full border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setOpenPost(false)} className="flex-1 border-border text-foreground">Cancel</Button>
              <Button onClick={() => postMutation.mutate()} disabled={postMutation.isPending || !post.title.trim() || !post.description.trim()} className="flex-1 gradient-purple text-primary-foreground">
                {postMutation.isPending ? "Posting..." : "Post Service"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyServiceListingsPage;
