import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { auth, user as userApi, ApiError, loadTokens, clearTokens, onSessionExpired } from '@/api'
import type { User } from '../types'

/**
 * Auth against the KHUB Rust backend (JWT: 15-minute access token, rotating
 * refresh token) instead of Supabase.
 *
 * The exported contract is unchanged on purpose: 29 components call useAuth()
 * and read `user.id` / `user.email` / the four methods. The backend's `pid`
 * becomes `user.id`, and the backend's single role enum becomes the roles
 * array his UI expects, so call sites keep working untouched.
 */

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    roles: string[],
    opts?: { referral_code?: string },
  ) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type VerificationStatus = 'pending' | 'verified' | 'rejected'

interface ProfileShape {
  pid?: string
  name?: string | null
  email?: string
  role?: string
  phone?: string | null
  location?: string | null
  avatar_url?: string | null
}

interface KycShape {
  status?: string
}

/**
 * Backend shapes -> the app's User type. Fields the backend does not model
 * (bio, cover_url, trust_score, rating, created_at) are neutral rather than
 * invented, so no page can mistake them for real data.
 */
function toAppUser(
  profile: ProfileShape | null,
  kyc: KycShape | null,
): User {
  const pid = profile?.pid ?? ''
  const role = profile?.role
  const kycStatus = (kyc?.status ?? 'pending') as VerificationStatus

  return {
    id: pid,
    email: profile?.email ?? '',
    full_name: profile?.name ?? '',
    phone: profile?.phone ?? undefined,
    location: profile?.location ?? undefined,
    avatar_url: profile?.avatar_url ?? undefined,
    roles: role ? [role] : [],
    verification_status: kycStatus,
    rating: 0,
    trust_score: 0,
    referral_code: '',
    created_at: '',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Boot: restore tokens, then read the profile + KYC state that build the
  // User shape. A 401 here means the stored session is dead -> signed out.
  useEffect(() => {
    let cancelled = false

    async function boot() {
      const { refresh } = loadTokens()
      if (!refresh) {
        setLoading(false)
        return
      }
      try {
        // auth/current is the route that carries role + verification status;
        // profile carries the contact fields the edit form needs.
        const [current, profile, kyc] = await Promise.all([
          auth.currentUser().catch(() => null),
          userApi.profile(),
          userApi.kycStatus().catch(() => null),
        ])
        const merged = { ...(profile as ProfileShape), ...((current ?? {}) as ProfileShape) }
        if (!cancelled) setUser(toAppUser(merged, kyc as KycShape | null))
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearTokens()
          if (!cancelled) setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  // Refresh expiry / token-family burn -> drop to signed-out everywhere.
  useEffect(() => onSessionExpired(() => setUser(null)), [])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    _roles: string[],
    opts?: { referral_code?: string },
  ) => {
    // The backend always answers 200, even for a duplicate email
    // (anti-enumeration) — no "already taken" state exists to show.
    // `roles` is accepted for contract compatibility; role assignment happens
    // after KYC/admin review on the backend, not at registration.
    await auth.register({
      email,
      password,
      name: fullName,
      referral_code: opts?.referral_code,
    })
    toast.success('Account created! Please verify your email.')
  }

  const signIn = async (email: string, password: string) => {
    await auth.login(email, password)
    try {
      const [current, profile, kyc] = await Promise.all([
        auth.currentUser().catch(() => null),
        userApi.profile(),
        userApi.kycStatus().catch(() => null),
      ])
      const merged = { ...(profile as ProfileShape), ...((current ?? {}) as ProfileShape) }
      setUser(toAppUser(merged, kyc as KycShape | null))
    } catch {
      // Token is valid even if the profile read failed; keep the session.
      setUser((prev) => prev)
    }
    toast.success('Welcome back!')
  }

  const signOut = async () => {
    const { refresh } = loadTokens()
    try {
      if (refresh) await auth.logout(refresh)
      else clearTokens()
    } finally {
      setUser(null)
    }
    toast.success('Logged out successfully')
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return

    // Map the app's field names onto the backend PATCH contract. Fields the
    // backend does not model (bio, roles, trust_score, ...) are dropped here
    // rather than sent and rejected.
    const patch: Record<string, string> = {}
    if (data.full_name !== undefined) patch.name = data.full_name
    if (data.phone !== undefined) patch.phone = data.phone
    if (data.location !== undefined) patch.location = data.location
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url

    await userApi.updateProfile(patch)

    setUser({ ...user, ...data })
    toast.success('Profile updated!')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
