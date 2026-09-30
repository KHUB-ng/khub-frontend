import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, MapPin, Mail, Phone, BadgeCheck, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { user as userApi, wallet, ApiError } from '@/api'

/**
 * Profile display + edit against the real backend.
 *
 * The old version also rendered skills / experiences / education / languages
 * from Supabase tables — the backend does not model those, so per the swap
 * rule ("anything the old backend has that we don't have, get deleted") they
 * are gone. What remains is everything the backend actually knows: identity,
 * KYC state, role, contact details, avatar, wallet balance.
 */

const UserProfile: React.FC = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  // /profile/:userId shows another user's public identity; /profile shows
  // your own with edit rights. The backend exposes other users only in
  // support/admin contexts, so a foreign pid renders limited info.
  const isSelf = !userId || userId === user?.id

  const profileQ = useQuery({
    queryKey: ['profile', userId ?? 'me'],
    queryFn: () => userApi.profile(),
    enabled: isSelf,
  })

  const walletQ = useQuery({
    queryKey: ['wallet'],
    queryFn: wallet.get,
    enabled: isSelf,
  })

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        full_name: fullName || user?.full_name || '',
        phone: phone || user?.phone || '',
        location: location || user?.location || '',
      }),
    onSuccess: () => {
      toast.success('Profile updated!')
      setEditing(false)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.description : 'Update failed'),
  })

  function beginEdit() {
    setFullName(user?.full_name ?? '')
    setPhone(user?.phone ?? '')
    setLocation(user?.location ?? '')
    setEditing(true)
  }

  const name = profileQ.data?.name ?? user?.full_name ?? 'KHUB user'
  const email = profileQ.data?.email ?? user?.email ?? ''
  const role = user?.roles?.[0] ?? 'buyer'
  const verification = user?.verification_status ?? 'pending'

  return (
    <div className="py-10">
      <div className="container-custom max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Identity card */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-500">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <Camera className="h-5 w-5 text-gray-400 absolute -bottom-1 -right-1" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{name}</h1>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    verification === 'verified'
                      ? 'bg-emerald-100 text-emerald-700'
                      : verification === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {verification}
                </span>
              </div>
              <p className="text-sm text-gray-500 capitalize mt-0.5">{role}</p>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {email}
                  </p>
                )}
                {(profileQ.data?.phone || user?.phone) && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {profileQ.data?.phone || user?.phone}
                  </p>
                )}
                {(profileQ.data?.location || user?.location) && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {profileQ.data?.location || user?.location}
                  </p>
                )}
              </div>
            </div>

            {isSelf && !editing && (
              <button type="button" onClick={beginEdit} className="btn-secondary !px-4 !py-2 text-sm">
                Edit profile
              </button>
            )}
          </div>

          {isSelf && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                <BadgeCheck className="h-3.5 w-3.5 text-primary-500" />
                PID {user?.id?.slice(0, 8)}…
              </span>
              {walletQ.data && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                  Wallet {walletQ.data.balance_display}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Edit form */}
        {isSelf && editing && (
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Edit profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input
                  className="input-field mt-1"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  className="input-field mt-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input
                  className="input-field mt-1"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state"
                />
              </div>
              <p className="text-xs text-gray-500">
                Email and role are managed by the backend and cannot be edited here.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={save.isPending}
                  onClick={() => void save.mutateAsync()}
                >
                  {save.isPending ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification nudge */}
        {isSelf && verification !== 'verified' && (
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-semibold">Get verified</h2>
            <p className="mt-1 text-sm text-gray-600">
              Verification unlocks withdrawals and driver/agent onboarding.
              {verification === 'rejected' ? ' Your last submission was rejected — resubmit your documents.' : ''}
            </p>
            <button
              type="button"
              onClick={() => navigate('/kyc')}
              className="btn-primary mt-4"
            >
              Go to KYC
            </button>
          </div>
        )}

        {!isSelf && (
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-semibold">About this user</h2>
            <p className="mt-1 text-sm text-gray-600">
              Public profiles are limited to identity and verification state — the
              backend does not expose other users' wallets, orders or contact
              details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
