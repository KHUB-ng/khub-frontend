import { useState } from "react";
import { Upload, Loader2, CheckCircle, Clock, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { user as userApi, ApiError } from "@/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

const KYCPage = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [docType, setDocType] = useState("nin");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);

  const { data: kyc, isLoading: kycLoading } = useQuery({
    queryKey: ["kyc"],
    queryFn: () => userApi.kycStatus(),
    enabled: !!user,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: ({ type, file }: { type: string; file: File }) =>
      userApi.submitKyc(type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc"] });
      setDocFile(null);
      setDocPreview(null);
      toast.success("Document submitted — your KYC is under review.");
    },
    onError: (err: any) => {
      const msg = err instanceof ApiError ? err.description : err?.message;
      toast.error(msg || "Upload failed. Please try again.");
    },
  });

  if (authLoading || kycLoading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-xl font-semibold text-foreground">Please login to verify your identity</h2>
        <Link to="/login"><Button className="mt-4 gradient-purple text-primary-foreground">Login</Button></Link>
      </div>
    );
  }

  const status = kyc?.status?.toLowerCase();
  const documents = kyc?.documents ?? [];

  if (status === "verified" || status === "approved") {
    return (
      <div className="container py-16 max-w-md text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground">Identity Verified</h1>
        <p className="text-muted-foreground mt-2">Your KYC verification is complete. You have full access to all platform features.</p>
        <Link to="/dashboard"><Button className="mt-6 gradient-purple text-primary-foreground">Go to Dashboard</Button></Link>
      </div>
    );
  }

  if (status === "pending" && documents.length > 0) {
    return (
      <div className="container py-16 max-w-md text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-warning" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground">Verification Pending</h1>
        <p className="text-muted-foreground mt-2">Your documents are being reviewed. This usually takes 24-48 hours.</p>
        <div className="mt-4 space-y-2 text-left">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2 bg-card">
              <span className="font-medium text-foreground">{doc.doc_type}</span>
              <span className="text-muted-foreground">{doc.status}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Need to replace a document? Use the form below to re-submit — a new upload replaces the previous one.
        </p>
        <Link to="/dashboard"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Unsupported file type — use JPG, PNG, WebP or PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large — max 5MB allowed.");
      return;
    }
    setDocFile(file);
    setDocPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = () => {
    if (!docFile) {
      toast.error("Please upload your ID document first.");
      return;
    }
    submitMutation.mutate({ type: docType, file: docFile });
  };

  const submitting = submitMutation.isPending;

  return (
    <div className="container py-8 max-w-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Verify your identity to unlock selling, withdrawals, and driver/agent onboarding.
          KYC approval is required before you can withdraw funds or apply as a driver or agent.
        </p>
      </div>

      {status === "rejected" && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Your previous submission was rejected. Please upload a clearer document below to try again.
          </p>
        </div>
      )}

      <div className="space-y-6 border border-border rounded-2xl bg-card p-6">
        {/* Doc Type */}
        <div>
          <Label>Document Type</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nin">National ID (NIN)</SelectItem>
              <SelectItem value="voters_card">Voter's Card</SelectItem>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="passport">International Passport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Document Upload */}
        <div>
          <Label>Upload ID Document</Label>
          <div className="mt-2">
            {docFile ? (
              <div className="relative">
                {docPreview ? (
                  <img src={docPreview} alt="Document Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="w-full h-24 rounded-lg border border-border bg-accent/20 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">{docFile.name}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => { setDocFile(null); setDocPreview(null); }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-accent/20">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload your ID</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP or PDF (max 5MB)</span>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 rounded-lg bg-accent/50 border border-border">
          <p className="text-xs font-medium text-foreground mb-1">Tips for fast approval:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ensure your ID is clear and not expired</li>
            <li>• Good lighting, no blurry images</li>
            <li>• Re-submitting replaces your previous document</li>
          </ul>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!docFile || submitting}
          className="w-full gradient-purple text-primary-foreground"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</>
          ) : documents.length > 0 ? (
            <><RefreshCw className="w-4 h-4 mr-2" /> Re-submit for Verification</>
          ) : (
            "Submit for Verification"
          )}
        </Button>
      </div>
    </div>
  );
};

export default KYCPage;
