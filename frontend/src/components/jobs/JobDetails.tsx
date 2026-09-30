import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listings, referrals, ApiError } from '@/api'
import type { ListingResponse } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import {
  Building2, MapPin, DollarSign, Clock, Briefcase,
  Bookmark, Share2, CheckCircle, Star, Users,
  TrendingUp, Award, Globe, Mail, Phone, Calendar,
  FileText, Send, Loader2, AlertCircle, ChevronRight
} from 'lucide-react'

function apiMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.description || fallback
  return err instanceof Error ? err.message : fallback
}

const VALID_CV = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export const JobDetails: React.FC = () => {
  const { slug } = useParams()
  const pid = slug ?? ''
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [cv, setCv] = useState<File | null>(null)

  const detailQuery = useQuery({
    queryKey: ['listing', pid],
    queryFn: () => listings.get(pid),
    enabled: !!pid,
  })
  const job: ListingResponse | undefined = detailQuery.data?.listing
  const images = detailQuery.data?.images ?? []
  const attrs = (job?.attributes ?? {}) as Record<string, any>

  const similarQuery = useQuery({
    queryFn: () =>
      listings.browse({
        vertical: 'job',
        category: job?.category ?? undefined,
        page_size: 6,
      }),
    queryKey: ['similar-jobs', job?.category],
    enabled: !!job,
  })
  const similarJobs = (similarQuery.data?.items ?? []).filter((j) => j.pid !== pid).slice(0, 5)

  const appsQuery = useQuery({
    queryFn: referrals.myApplications,
    queryKey: ['my-applications'],
    enabled: !!user,
  })
  const hasApplied = (appsQuery.data ?? []).some(
    (a) => (a as any).listing_pid === pid || (a as any).job_pid === pid,
  )

  const wishlistQuery = useQuery({
    queryFn: listings.wishlist,
    queryKey: ['wishlist'],
    enabled: !!user,
  })
  const isSaved = (wishlistQuery.data ?? []).some((w) => w.pid === pid)

  useEffect(() => {
    if (!pid) detailQuery.refetch?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid])

  const applyMutation = useMutation({
    mutationFn: () => {
      if (!coverNote.trim() && !cv) throw new Error('Add a cover note or attach your CV.')
      return referrals.apply(pid, { cv: cv ?? undefined, coverNote: coverNote.trim() || undefined })
    },
    onSuccess: () => {
      toast.success('Application submitted successfully!')
      setShowApplyForm(false)
      setCoverNote('')
      setCv(null)
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
    },
    onError: (err) => toast.error(apiMsg(err, 'Failed to submit application')),
  })

  const saveMutation = useMutation({
    mutationFn: () => listings.toggleWishlist(pid),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success(res.saved ? 'Job saved!' : 'Job removed from saved')
    },
    onError: (err) => toast.error(apiMsg(err, 'Could not update saved jobs')),
  })

  const handleApply = () => {
    if (!user) {
      toast.error('Please login to apply for this job')
      navigate('/login')
      return
    }
    setShowApplyForm(true)
  }

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!VALID_CV.includes(file.type)) {
      toast.error('CV must be PDF, DOC or DOCX.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('CV must be 5MB or less.')
      return
    }
    setCv(file)
  }

  const toggleSave = () => {
    if (!user) {
      toast.error('Please login to save jobs')
      return
    }
    saveMutation.mutate()
  }

  const copyJobLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Job link copied!')
  }

  if (detailQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (detailQuery.isError || !job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
        <p className="text-gray-500">The job you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  const requirements: string[] = Array.isArray(attrs.requirements) ? attrs.requirements : []
  const responsibilities: string[] = Array.isArray(attrs.responsibilities) ? attrs.responsibilities : []
  const benefits: string[] = Array.isArray(attrs.benefits) ? attrs.benefits : []
  const skills: string[] = Array.isArray(attrs.skills) ? attrs.skills : []
  const employmentType: string | undefined = attrs.employment_type ?? attrs.job_type
  const companyName: string = attrs.company_name ?? 'Employer'
  const salaryText: string = job.price_display ?? attrs.salary_range ?? 'Competitive Salary'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Job Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{companyName}</span>
                  <span className="text-gray-300">|</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{attrs.rating || 'New'}</span>
                  <span className="text-gray-500">({attrs.total_reviews ?? 0} reviews)</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location || 'Remote'}{attrs.is_remote ? ' (Remote)' : ''}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {salaryText}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Posted {job.created_at ? new Date(job.created_at as string).toLocaleDateString() : 'recently'}
                  </div>
                  {employmentType && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {String(employmentType).replace('-', ' ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleSave}
                  className={`p-2 rounded-full border transition-colors ${
                    isSaved ? 'bg-primary-500 text-white border-primary-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                <button
                  onClick={copyJobLink}
                  className="p-2 rounded-full border hover:bg-gray-50"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              {hasApplied ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Application Submitted!</p>
                    <p className="text-sm text-green-700">The employer will review your application and contact you</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Apply Now
                </button>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2">
                {requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {responsibilities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2">
                {responsibilities.map((resp, index) => (
                  <li key={index} className="text-gray-700">{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Benefits</h2>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">About the Company</h3>
            {images[0] ? (
              <img src={images[0]} alt={companyName} className="w-20 h-20 object-contain mb-4" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <h4 className="font-semibold">{companyName}</h4>
            {attrs.company_description && (
              <p className="text-sm text-gray-600 mt-2">{attrs.company_description}</p>
            )}

            <div className="mt-4 space-y-2 text-sm">
              {attrs.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={attrs.website} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">
                    {attrs.website}
                  </a>
                </div>
              )}
              {attrs.headquarters && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{attrs.headquarters}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{attrs.company_size || 'N/A'} employees</span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Experience Level</span>
                <span className="font-medium capitalize">{attrs.experience_level ? String(attrs.experience_level).replace('-', ' ') : 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Education Level</span>
                <span className="font-medium">{attrs.education_level || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Job Type</span>
                <span className="font-medium capitalize">{employmentType || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Work Location</span>
                <span className="font-medium capitalize">{attrs.work_location || 'On-site'}</span>
              </div>
              {attrs.application_deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Application Deadline</span>
                  <span className="font-medium text-red-600">
                    {new Date(attrs.application_deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Skills Required */}
          {skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-3">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Similar Jobs</h2>
          <div className="grid gap-4">
            {similarJobs.map((similarJob) => (
              <SimilarJobCard key={similarJob.pid} job={similarJob} />
            ))}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Apply for {job.title}</h2>
              <p className="text-sm text-gray-600 mt-1">at {companyName}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Cover Note</label>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  rows={6}
                  className="w-full border rounded-md p-3 focus:ring-2 focus:ring-primary-500"
                  placeholder="Why are you interested in this position? What makes you a good fit?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CV upload (PDF/DOC/DOCX, max 5MB)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCvChange}
                  className="w-full border rounded-md p-3"
                />
                {cv && <p className="text-xs text-gray-600 mt-1">Selected: {cv.name}</p>}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowApplyForm(false)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-md hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SimilarJobCard({ job }: { job: ListingResponse }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold truncate">{job.title}</p>
        <p className="text-sm text-gray-500 truncate">{job.location || 'Remote'} · {job.category || 'General'}</p>
      </div>
      <a href={`/jobs/${job.pid}`} className="text-sm text-primary-500 hover:underline shrink-0">
        View
      </a>
    </div>
  )
}
