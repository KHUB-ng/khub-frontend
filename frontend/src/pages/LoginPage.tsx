import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { auth, ApiError } from '@/api'
import { toast } from 'sonner'
import { Mail, Lock, LogIn, Send } from 'lucide-react'
import { isGoogleConfigured, signInWithGoogle } from '@/lib/googleAuth'

// Public client id, injected at build time. Public by design — it ships in
// every page offering Google sign-in and authorises nothing on its own.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [resending, setResending] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleGoogle = async () => {
    setGoogleBusy(true)
    try {
      // Google issues the ID token; the backend verifies it server-side
      // against Google's JWKS. No redirect URI is involved anywhere.
      const idToken = await signInWithGoogle(GOOGLE_CLIENT_ID)
      await auth.loginWithGoogle(idToken)
      toast.success('Signed in with Google')
      navigate('/dashboard')
    } catch (error: any) {
      const msg =
        error instanceof ApiError
          ? error.description
          : error?.message || 'Google sign-in failed.'
      // A dismissed chooser is not worth an error toast.
      if (!/cancelled/i.test(msg)) toast.error(msg)
    } finally {
      setGoogleBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFailed(false)
    try {
      await signIn(email.trim(), password)
      navigate('/dashboard')
    } catch (error: any) {
      setFailed(true)
      const msg = error instanceof ApiError ? error.description : error?.message
      toast.error(msg || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address first')
      return
    }
    setResending(true)
    try {
      await auth.resendVerification(email.trim())
      toast.success('If that address is registered, a verification email is on its way.')
    } catch (error: any) {
      toast.error(error?.message || 'Could not resend the verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your KHUB account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Google first — one click, no password. */}
          {isGoogleConfigured(GOOGLE_CLIENT_ID) ? (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleBusy}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {googleBusy ? 'Opening Google…' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  or
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-12"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-12"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? 'Signing in...' : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>

          {failed && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm text-gray-700">
                This can also mean your email is not verified yet.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
