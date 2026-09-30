import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, absoluteUrl, listings, toNairaString } from "@/api";
import type { CreateListingInput } from "@/api/listings";
import type { Vertical } from "@/api";
import {
  Badge,
  buttonClass,
  Card,
  EmptyState,
  ErrorState,
  Field,
  inputClass,
  Loading,
  Money,
  PageHeader,
  secondaryButtonClass,
  statusTone,
} from "@/components/ui/primitives";

const VERTICALS: Vertical[] = ["product", "service", "job", "rental"];

const ROLE_NOTE: Record<Vertical, string> = {
  product: "Requires the seller role.",
  rental: "Requires the seller role.",
  service: "Requires the service_provider role.",
  job: "Requires the jobposter role (price not required for jobs).",
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return `${err.status} ${err.code}: ${err.description}`;
  return err instanceof Error ? err.message : String(err);
}

function CreateForm({ onCreated }: { onCreated: (pid: string) => void }) {
  const queryClient = useQueryClient();
  const [vertical, setVertical] = useState<Vertical>("product");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const createM = useMutation({
    mutationFn: () => {
      const input: CreateListingInput = {
        vertical,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
      };
      if (location.trim()) input.location = location.trim();
      if (vertical !== "job") {
        const naira = toNairaString(price.trim());
        if (!naira) throw new Error("Price must be a valid positive naira amount (e.g. 1500.00).");
        input.price = naira;
      } else if (price.trim()) {
        const naira = toNairaString(price.trim());
        if (naira) input.price = naira;
      }
      if (quantity.trim()) {
        const qty = Number.parseInt(quantity.trim(), 10);
        if (Number.isFinite(qty) && qty > 0) input.quantity = qty;
      }
      return listings.create(input);
    },
    onSuccess: (res) => {
      toast.success("Listing created");
      setTitle("");
      setDescription("");
      setCategory("");
      setLocation("");
      setPrice("");
      setQuantity("");
      void queryClient.invalidateQueries({ queryKey: ["listings", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["listings", "browse"] });
      onCreated(res.pid);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card title="Create a listing">
      <p className="text-xs text-muted-foreground">
        Listing creation is role-gated per vertical: product/rental → seller, service →
        service_provider, job → jobposter. A 403 here means the wrong role — roles are granted
        via <code>POST /api/admin/users/{"{pid}"}/role</code>. Money goes out as a naira string.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Vertical" required>
          <select className={inputClass} value={vertical} onChange={(e) => setVertical(e.target.value as Vertical)}>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <p className="text-xs text-muted-foreground">{ROLE_NOTE[vertical]}</p>
        </div>
        <Field label="Title" required>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. iPhone 13, 128GB" />
        </Field>
        <Field label="Category" required>
          <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. phones" />
        </Field>
        <Field label="Location">
          <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos" />
        </Field>
        <Field
          label={vertical === "job" ? "Salary (optional)" : "Price (₦)"}
          required={vertical !== "job"}
          hint="Naira string on the wire — e.g. 1500.00"
        >
          <input className={inputClass} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500.00" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" required>
            <textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, what's included, delivery…" />
          </Field>
        </div>
        <Field label="Quantity" hint="Products only; forced to 1 for other verticals at order time.">
          <input className={inputClass} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
        </Field>
      </div>
      <div className="mt-3">
        <button
          type="button"
          className={buttonClass}
          disabled={createM.isPending || !title.trim() || !description.trim() || !category.trim()}
          onClick={() => createM.mutate()}
        >
          {createM.isPending ? "Creating…" : "Create listing"}
        </button>
      </div>
      {createM.error && (
        <div className="mt-3">
          <ErrorState error={createM.error} />
          {createM.error instanceof ApiError && createM.error.status === 403 && (
            <p className="mt-2 text-xs text-muted-foreground">
              403 = wrong role for this vertical. Ask a superadmin to grant it via{" "}
              <code>POST /api/admin/users/{"{pid}"}/role</code>.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function ManageRow({ pid }: { pid: string }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const detailQ = useQuery({
    queryKey: ["listings", "detail", pid],
    queryFn: () => listings.get(pid),
  });

  // ListingDetail.images is a string[] of URLs — derive the image pid from the
  // trailing path segment for the DELETE route.
  function imagePidFor(url: string): string | null {
    try {
      const clean = url.split("?")[0] ?? url;
      const parts = clean.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      return last && last.length > 0 ? last : null;
    } catch {
      return null;
    }
  }

  const uploadM = useMutation({
    mutationFn: (f: File) => listings.addImage(pid, f),
    onSuccess: () => {
      toast.success("Image added");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["listings", "detail", pid] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const removeImageM = useMutation({
    mutationFn: (imagePid: string) => listings.removeImage(pid, imagePid),
    onSuccess: () => {
      toast.success("Image removed");
      void queryClient.invalidateQueries({ queryKey: ["listings", "detail", pid] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const statusM = useMutation({
    mutationFn: (status: "paused" | "active" | "archived") => listings.setStatus(pid, status),
    onSuccess: () => {
      toast.success("Status updated");
      void queryClient.invalidateQueries({ queryKey: ["listings", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["listings", "detail", pid] });
      void queryClient.invalidateQueries({ queryKey: ["listings", "browse"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // PATCH /api/listings/{pid} — partial update, revalidated server-side as a
  // merged set. Price goes in as a naira string, never a number.
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eCat, setECat] = useState("");
  const [ePrice, setEPrice] = useState("");

  const updateM = useMutation({
    mutationFn: () =>
      listings.update(pid, {
        title: eTitle.trim() || undefined,
        description: eDesc.trim() || undefined,
        category: eCat.trim() || undefined,
        ...(ePrice.trim() ? { price: toNairaString(ePrice) ?? undefined } : {}),
      }),
    onSuccess: () => {
      toast.success("Listing updated");
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  function beginEdit() {
    const l = detailQ.data?.listing;
    setETitle(l?.title ?? "");
    setEDesc(l?.description ?? "");
    setECat(l?.category ?? "");
    setEPrice(
      typeof l?.price_kobo === "number" && l.price_kobo > 0
        ? (l.price_kobo / 100).toFixed(2)
        : "",
    );
    setEditing(true);
  }

  return (
    <div className="mt-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap gap-2">
        {(["paused", "active", "archived"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={secondaryButtonClass}
            disabled={statusM.isPending}
            onClick={() => {
              if (s === "archived" && !window.confirm("Archive this listing? It will leave the public browse.")) return;
              statusM.mutate(s);
            }}
          >
            {s === "paused" ? "Pause" : s === "active" ? "Activate" : "Archive"}
          </button>
        ))}
        <Link to={`/marketplace/${pid}`} className={secondaryButtonClass}>
          View
        </Link>
        <button type="button" className={secondaryButtonClass} onClick={() => (editing ? setEditing(false) : beginEdit())}>
          {editing ? "Close editor" : "Edit details"}
        </button>
      </div>

      {editing && (
        <form
          className="mt-3 grid gap-3 rounded-lg border border-border bg-background p-3"
          onSubmit={(e) => {
            e.preventDefault();
            updateM.mutate();
          }}
        >
          <label className="block text-xs">
            <span className="font-medium">Title</span>
            <input value={eTitle} onChange={(e) => setETitle(e.target.value)} className="input-field mt-1" />
          </label>
          <label className="block text-xs">
            <span className="font-medium">Description</span>
            <textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} rows={3} className="input-field mt-1" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="font-medium">Category</span>
              <input value={eCat} onChange={(e) => setECat(e.target.value)} className="input-field mt-1" />
            </label>
            <label className="block text-xs">
              <span className="font-medium">Price (naira)</span>
              <input value={ePrice} onChange={(e) => setEPrice(e.target.value)} placeholder="1500.00" className="input-field mt-1" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass} disabled={updateM.isPending}>
              {updateM.isPending ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
          {updateM.error && <ErrorState error={updateM.error as unknown} />}
        </form>
      )}

      <div className="mt-3">
        <p className="text-xs font-medium">Images (jpg/png/webp, ≤ 5 MB, max 6)</p>
        {detailQ.isLoading && <Loading label="Loading images…" />}
        {detailQ.error && (
          <p className="mt-1 text-xs text-muted-foreground">
            Images unavailable for archived listings (detail is public-only).
          </p>
        )}
        {detailQ.data && detailQ.data.images.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">No images yet.</p>
        )}
        {detailQ.data && detailQ.data.images.length > 0 && (
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {detailQ.data.images.map((url, i) => (
              <li key={`${url}-${i}`} className="relative overflow-hidden rounded border border-border">
                <img src={absoluteUrl(url)} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  className="absolute bottom-1 right-1 rounded bg-destructive px-1.5 py-0.5 text-[11px] text-white disabled:opacity-50"
                  disabled={removeImageM.isPending}
                  onClick={() => {
                    const imagePid = imagePidFor(url);
                    if (!imagePid) {
                      toast.error("Could not determine the image id from its URL.");
                      return;
                    }
                    if (window.confirm("Remove this image?")) removeImageM.mutate(imagePid);
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-xs"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f ?? null);
            }}
          />
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!file || uploadM.isPending}
            onClick={() => {
              if (file) uploadM.mutate(file);
            }}
          >
            {uploadM.isPending ? "Uploading…" : "Upload image"}
          </button>
        </div>
        {(uploadM.error ?? removeImageM.error) && (
          <div className="mt-2">
            <ErrorState error={(uploadM.error ?? removeImageM.error) as unknown} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [highlight, setHighlight] = useState<string | null>(null);

  const mineQ = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: listings.mine,
  });

  const items = (mineQ.data ?? []).filter(
    (l) => statusFilter === "all" || (l.status ?? "") === statusFilter,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <PageHeader
        title="My listings"
        subtitle="Everything you've published, in any status."
        actions={
          <Link to="/marketplace" className={secondaryButtonClass}>
            Browse marketplace
          </Link>
        }
      />

      <CreateForm onCreated={(pid) => setHighlight(pid)} />

      <Card title="Published">
        <div className="flex flex-wrap gap-3">
          <Field label="Status">
            <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>

        <div className="mt-3">
          {mineQ.isLoading && <Loading label="Loading your listings…" />}
          {mineQ.error && <ErrorState error={mineQ.error} />}
          {mineQ.data && items.length === 0 && (
            <EmptyState
              title={mineQ.data.length === 0 ? "No listings yet" : "Nothing with this status"}
              hint="Create your first listing with the form above. Remember the vertical→role gate."
            />
          )}
          {items.length > 0 && (
            <ul className="space-y-3">
              {items.map((l) => (
                <li
                  key={l.pid}
                  className={`rounded-lg border p-3 ${highlight === l.pid ? "border-primary" : "border-border"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/marketplace/${l.pid}`} className="font-medium hover:underline">
                      {l.title}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge>{l.vertical}</Badge>
                      {l.status && <Badge tone={statusTone(l.status)}>{l.status}</Badge>}
                    </div>
                  </div>
                  <p className="mt-1 text-sm font-semibold">
                    <Money display={l.price_display} kobo={l.price_kobo} />
                  </p>
                  <ManageRow pid={l.pid} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
