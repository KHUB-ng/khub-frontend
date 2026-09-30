import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listings, referrals, ApiError } from '@/api'
import type { ListingResponse } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import {
  Loader2,
  Briefcase,
  MapPin,
  Bookmark,
  SlidersHorizontal,
  X,
  TrendingUp,
  Star,
  Building2,
  Search
} from 'lucide-react'

function apiMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.description || fallback
  return err instanceof Error ? err.message : fallback
}

const VALID_CV = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote']

export const JobListingPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [location, setLocation] = useState('')
  const [debouncedLoc, setDebouncedLoc] = useState('')
  const [category, setCategory] = useState('')
  const [jobType, setJobType] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSavedJobs, setShowSavedJobs] = useState(false)
  const [sortBy, setSortBy] = useState('relevance') // relevance, newest, salary_high, salary_low
  const [page, setPage] = useState(1)
  const [applyPid, setApplyPid] = useState<string | null>(null)
  const [coverNote, setCoverNote] = useState('')
  const [cv, setCv] = useState<File | null>(null)
  const [trendingSearches] = useState([
    'Software Engineer', 'Product Manager', 'Data Analyst', 'Sales Executive', 'Customer Support'
  ])

  const onKeyword = (v: string) => {
    setKeyword(v)
    setPage(1)
    window.clearTimeout((onKeyword as any)._t)
    ;(onKeyword as any)._t = window.setTimeout(() => setDebounced(v.trim()), 400)
  }
  const onLocation = (v: string) => {
    setLocation(v)
    setPage(1)
    window.clearTimeout((onLocation as any)._t)
    ;(onLocation as any)._t = window.setTimeout(() => setDebouncedLoc(v.trim()), 400)
  }

  const sortParam = sortBy === 'newest' ? 'newest' : sortBy === 'salary_high' ? 'price_desc' : sortBy === 'salary_low' ? 'price_asc' : undefined

  const jobsQuery = useQuery({
    queryKey: ['job-browse', debounced, debouncedLoc, category, sortParam, page],
    queryFn: () => {
      const base = {
        vertical: 'job' as const,
        category: category || undefined,
        location: debouncedLoc || undefined,
        sort: sortParam as import('@/api/listings').ListingSort | undefined,
        page,
        page_size: 20,
      }
      return debounced ? listings.search(debounced, base) : listings.browse(base)
    },
  })
  const items = jobsQuery.data?.items ?? []
  const jobs = items.filter((j) => {
    if (jobType) {
      const et = String((j.attributes as any)?.employment_type ?? (j.attributes as any)?.job_type ?? '')
      if (et.toLowerCase() !== jobType.toLowerCase()) return false
    }
    if (isRemote) {
      const attrs = (j.attributes ?? {}) as any
      if (!attrs.is_remote && !(j.location || '').toLowerCase().includes('remote')) return false
    }
    return true
  })
  const totalJobs = jobsQuery.data?.total_items ?? jobs.length
  const hasMore = (jobsQuery.data?.page ?? 1) < (jobsQuery.data?.total_pages ?? 1)

  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: listings.wishlist,
    enabled: !!user,
  })
  const savedPids = new Set((wishlistQuery.data ?? []).map((w) => w.pid))

  const saveMutation = useMutation({
    mutationFn: (pid: string) => listings.toggleWishlist(pid),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success(res.saved ? 'Job saved to your list' : 'Job removed from saved')
    },
    onError: (err) => toast.error(apiMsg(err, 'Could not save job')),
  })

  const applyMutation = useMutation({
    mutationFn: () => {
      if (!applyPid) throw new Error('No job selected.')
      if (!coverNote.trim() && !cv) throw new Error('Add a cover note or attach your CV.')
      return referrals.apply(applyPid, { cv: cv ?? undefined, coverNote: coverNote.trim() || undefined })
    },
    onSuccess: () => {
      toast.success('Application submitted successfully!')
      setApplyPid(null)
      setCoverNote('')
      setCv(null)
    },
    onError: (err) => toast.error(apiMsg(err, 'Failed to submit application')),
  })

  const handleCv = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const saveJob = (jobId: string) => {
    if (!user) {
      toast.error('Please log in to save jobs.')
      return
    }
    saveMutation.mutate(jobId)
  }

  const resetFilters = () => {
    setKeyword('')
    setDebounced('')
    setLocation('')
    setDebouncedLoc('')
    setCategory('')
    setJobType('')
    setIsRemote(false)
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Find Your Dream Job</h1>
        <p className="text-primary-100 mb-6">Discover thousands of opportunities across Nigeria</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeyword(e.target.value)}
              placeholder="Job title, keyword or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm text-gray-900 focus:outline-none"
            />
          </div>
          <div className="relative sm:w-64">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => onLocation(e.target.value)}
              placeholder="Location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm text-gray-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowFilters(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 bg-primary-500 text-white p-3 rounded-full shadow-lg"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Filters Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:w-72
          ${showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b flex justify-between items-center md:hidden">
            <h2 className="font-semibold">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">Category</p>
              <input
                type="text"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                placeholder="e.g. Technology"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Job type</p>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="jobtype" checked={jobType === ''} onChange={() => setJobType('')} />
                  All types
                </label>
                {jobTypeOptions.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="jobtype" checked={jobType === t} onChange={() => setJobType(t)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} />
              Remote only
            </label>
            <button onClick={resetFilters} className="text-sm text-primary-500 hover:underline">
              Clear all filters
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div>
              <p className="text-gray-600">{totalJobs.toLocaleString()} jobs found</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="salary_high">Highest Salary</option>
                <option value="salary_low">Lowest Salary</option>
              </select>

              <button
                onClick={() => setShowSavedJobs(true)}
                className="px-3 py-2 border rounded-md text-sm flex items-center gap-2 hover:bg-gray-50"
              >
                <Bookmark className="w-4 h-4" />
                Saved
              </button>
            </div>
          </div>

          {/* Trending Searches */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => onKeyword(term)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs List */}
          {jobsQuery.isLoading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : jobsQuery.isError ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Could not load jobs.</p>
              <button onClick={() => jobsQuery.refetch()} className="mt-3 text-sm text-primary-500 hover:underline">Retry</button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.pid}
                    job={job}
                    saved={savedPids.has(job.pid)}
                    onSave={() => saveJob(job.pid)}
                    onApply={() => {
                      if (!user) {
                        toast.error('Please log in to apply.')
                        return
                      }
                      setApplyPid(job.pid)
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-center items-center gap-3 py-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <button
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowFilters(false)} />
      )}

      {showSavedJobs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Saved Jobs</h2>
              <button onClick={() => setShowSavedJobs(false)}><X className="w-5 h-5" /></button>
            </div>
            {!user ? (
              <p className="text-sm text-gray-600">Please log in to view saved jobs.</p>
            ) : wishlistQuery.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (wishlistQuery.data ?? []).filter((w) => w.vertical === 'job').length === 0 ? (
              <p className="text-sm text-gray-600">You haven't saved any jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {(wishlistQuery.data ?? []).filter((w) => w.vertical === 'job').map((w) => (
                  <div key={w.pid} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{w.title}</p>
                    <a href={`/jobs/${w.pid}`} className="text-sm text-primary-500 hover:underline shrink-0">View</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {applyPid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold">Apply for this job</h2>
            <p className="text-sm text-gray-600 mt-1">Add a cover note and/or attach your CV (PDF/DOC/DOCX, max 5MB).</p>
            <textarea
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              rows={5}
              className="w-full mt-4 border rounded-md p-3 text-sm"
              placeholder="Why are you a good fit?"
            />
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleCv} className="mt-3 text-sm" />
            {cv && <p className="text-xs text-gray-600 mt-1">Selected: {cv.name}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setApplyPid(null); setCoverNote(''); setCv(null) }} className="flex-1 px-4 py-2 border rounded-md text-sm">Cancel</button>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-md text-sm disabled:opacity-50"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JobCard({ job, saved, onSave, onApply }: { job: ListingResponse; saved: boolean; onSave: () => void; onApply: () => void }) {
  const attrs = (job.attributes ?? {}) as any
  const company = attrs.company_name ?? 'Employer'
  const type = attrs.employment_type ?? attrs.job_type ?? 'Full-time'
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{job.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {company}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{type}</span>
            {job.category && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{job.category}</span>}
            {job.price_display && <span className="text-sm font-medium">{job.price_display}</span>}
          </div>
          {job.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>}
        </div>
        <button
          onClick={onSave}
          className={`p-2 rounded-full border shrink-0 ${saved ? 'bg-primary-500 text-white border-primary-500' : 'hover:bg-gray-50'}`}
          aria-label="Save job"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <a href={`/jobs/${job.pid}`} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">View Details</a>
        <button onClick={onApply} className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600">Apply Now</button>
      </div>
    </div>
  )
}

