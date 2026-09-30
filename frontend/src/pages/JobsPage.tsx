import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Clock, Building2, Search, BadgeCheck, Filter, ChevronDown, ChevronUp, X, Bookmark, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listings, referrals, ApiError } from "@/api";
import type { ListingResponse } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const jobCategories = ["All", "Technology", "Marketing", "Design", "Finance", "Logistics", "Sales"];
const jobTypes = ["All", "Full-time", "Part-time", "Contract", "Freelance"];
const locations = ["All", "Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan"];

function apiMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.isForbidden)
      return "Your account lacks the jobposter role needed to post jobs. Roles are granted by an admin.";
    return err.description || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

const VALID_CV = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const JobsPage = () => {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [applyPid, setApplyPid] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [post, setPost] = useState({ title: "", description: "", category: "Technology", location: "", employment_type: "Full-time" });
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const onSearchChange = (v: string) => {
    setSearch(v);
    window.clearTimeout((onSearchChange as any)._t);
    (onSearchChange as any)._t = window.setTimeout(() => setDebounced(v.trim()), 400);
  };

  const jobsQuery = useQuery({
    queryKey: ["jobs", debounced, selectedCategory, selectedLocation],
    queryFn: () => {
      const base = {
        vertical: "job" as const,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        location: selectedLocation === "All" ? undefined : selectedLocation,
        page_size: 50,
      };
      return debounced ? listings.search(debounced, base) : listings.browse(base);
    },
  });
  const allJobs = jobsQuery.data?.items ?? [];
  const filtered = allJobs.filter((j) => {
    if (selectedType === "All") return true;
    const et = String((j.attributes as any)?.employment_type ?? (j.attributes as any)?.job_type ?? "");
    return et.toLowerCase() === selectedType.toLowerCase();
  });

  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: listings.wishlist,
    enabled: !!user,
  });
  const savedPids = new Set((wishlistQuery.data ?? []).map((w) => w.pid));

  const saveMutation = useMutation({
    mutationFn: (pid: string) => listings.toggleWishlist(pid),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(res.saved ? "Job saved!" : "Job removed from saved");
    },
    onError: (err) => toast.error(apiMsg(err, "Could not update saved jobs")),
  });

  const applyMutation = useMutation({
    mutationFn: () => {
      if (!applyPid) throw new Error("No job selected.");
      if (!coverNote.trim() && !cv) throw new Error("Add a cover note or attach your CV.");
      return referrals.apply(applyPid, { cv: cv ?? undefined, coverNote: coverNote.trim() || undefined });
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      setApplyPid(null);
      setCoverNote("");
      setCv(null);
    },
    onError: (err) => toast.error(apiMsg(err, "Failed to submit application")),
  });

  const postMutation = useMutation({
    mutationFn: () =>
      listings.create({
        vertical: "job",
        title: post.title.trim(),
        description: post.description.trim(),
        category: post.category,
        location: post.location.trim() || undefined,
        attributes: { employment_type: post.employment_type },
      }),
    onSuccess: () => {
      toast.success("Job posted!");
      setShowPost(false);
      setPost({ title: "", description: "", category: "Technology", location: "", employment_type: "Full-time" });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err) => toast.error(apiMsg(err, "Failed to post job.")),
  });

  const handleCv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!VALID_CV.includes(file.type)) {
      toast.error("CV must be PDF, DOC or DOCX.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("CV must be 5MB or less.");
      return;
    }
    setCv(file);
  };

  const activeFilters = [selectedCategory, selectedType, selectedLocation].filter(f => f !== "All").length;
  const clearFilters = () => { setSelectedCategory("All"); setSelectedType("All"); setSelectedLocation("All"); };

  const cardFor = (job: ListingResponse) => {
    const attrs = (job.attributes ?? {}) as any;
    return {
      company: attrs.company_name ?? "Employer",
      type: attrs.employment_type ?? attrs.job_type ?? "Full-time",
      salary: job.price_display ?? attrs.salary_range ?? "Competitive",
      posted: job.created_at ? new Date(String(job.created_at)).toLocaleDateString() : "Recently",
    };
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("jobs")}</h1>
          <p className="text-muted-foreground mt-1">Find your dream job or post opportunities</p>
        </div>
        <Button onClick={() => { if (!user) { toast.error("Please log in to post a job."); return; } setShowPost(true); }} className="gradient-purple text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Post a Job
        </Button>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search jobs by title or company..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`border-border text-foreground gap-2 ${activeFilters > 0 ? "border-primary text-primary" : ""}`}>
          <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="w-5 h-5 rounded-full gradient-purple text-primary-foreground text-xs flex items-center justify-center">{activeFilters}</span>}
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* Collapsible Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
            <div className="p-4 border border-border rounded-xl bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Filter Jobs</h3>
                {activeFilters > 0 && <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1"><X className="w-3 h-3" /> Clear all</button>}
              </div>

              {/* Category */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {jobCategories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat ? "gradient-purple text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Job Type</p>
                <div className="flex flex-wrap gap-2">
                  {jobTypes.map(type => (
                    <button key={type} onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedType === type ? "gradient-purple text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Location</p>
                <div className="flex flex-wrap gap-2">
                  {locations.map(loc => (
                    <button key={loc} onClick={() => setSelectedLocation(loc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedLocation === loc ? "gradient-purple text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {jobsQuery.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : jobsQuery.isError ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Could not load jobs. Please try again.</p>
          <Button variant="outline" onClick={() => jobsQuery.refetch()} className="mt-3 border-border text-foreground">Retry</Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{filtered.length} jobs found</p>

          {/* Job Cards */}
          <div className="space-y-4">
            {filtered.map((job, i) => {
              const c = cardFor(job);
              const saved = savedPids.has(job.pid);
              return (
                <motion.div
                  key={job.pid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 border border-border rounded-xl bg-card hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                        <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {c.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location || "Remote"}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.posted}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">{c.type}</span>
                        {job.category && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">{job.category}</span>}
                        <span className="flex items-center gap-1 text-sm font-medium text-foreground">{c.salary}</span>
                      </div>
                      {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Button onClick={() => { if (!user) { toast.error("Please log in to apply."); return; } setApplyPid(job.pid); }} className="gradient-purple text-primary-foreground">Apply Now</Button>
                      <Button variant="outline" onClick={() => { if (!user) { toast.error("Please log in to save jobs."); return; } saveMutation.mutate(job.pid); }} className="border-border text-foreground gap-1">
                        <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No jobs match your filters. Try adjusting your search.</p>
                <Button variant="outline" onClick={clearFilters} className="mt-3 border-border text-foreground">Clear Filters</Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Apply Modal */}
      {applyPid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-lg w-full p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground">Apply for this job</h2>
            <p className="text-sm text-muted-foreground mt-1">Add a cover note and/or attach your CV (PDF/DOC/DOCX, max 5MB).</p>
            <textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={5}
              className="w-full mt-4 border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Why are you a good fit?" />
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleCv} className="mt-3 text-sm text-muted-foreground" />
            {cv && <p className="text-xs text-muted-foreground mt-1">Selected: {cv.name}</p>}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => { setApplyPid(null); setCoverNote(""); setCv(null); }} className="flex-1 border-border text-foreground">Cancel</Button>
              <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending} className="flex-1 gradient-purple text-primary-foreground">
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {showPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-lg w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground">Post a Job</h2>
            <p className="text-sm text-muted-foreground mt-1">Posting requires the jobposter role — an admin grants it, not self-service.</p>
            <div className="space-y-3 mt-4">
              <input value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} placeholder="Job title"
                className="w-full border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <textarea value={post.description} onChange={(e) => setPost({ ...post, description: e.target.value })} rows={4} placeholder="Description, requirements, responsibilities..."
                className="w-full border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="grid grid-cols-2 gap-3">
                <select value={post.category} onChange={(e) => setPost({ ...post, category: e.target.value })}
                  className="border border-input rounded-lg p-3 bg-background text-sm text-foreground">
                  {jobCategories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={post.employment_type} onChange={(e) => setPost({ ...post, employment_type: e.target.value })}
                  className="border border-input rounded-lg p-3 bg-background text-sm text-foreground">
                  {jobTypes.filter(t => t !== "All").map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <input value={post.location} onChange={(e) => setPost({ ...post, location: e.target.value })} placeholder="Location (e.g. Lagos)"
                className="w-full border border-input rounded-lg p-3 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowPost(false)} className="flex-1 border-border text-foreground">Cancel</Button>
              <Button onClick={() => postMutation.mutate()} disabled={postMutation.isPending || !post.title.trim() || !post.description.trim()} className="flex-1 gradient-purple text-primary-foreground">
                {postMutation.isPending ? "Posting..." : "Post Job"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
