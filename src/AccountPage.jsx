import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, Mail } from 'lucide-react';
import styles from './AccountPage.module.css';
import hero from './assets/hero.jpg';
import { authApi } from './lib/auth.js';

export default function AccountPage({ onHome = () => {}, onAccountCreated = () => {} }) {
  const [view, setView] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token') || params.get('token');
    const referral = params.get('ref');
    if (referral) setReferralCode(referral);
    if (token) {
      setResetToken(token);
      setView('reset');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const switchView = (next) => {
    setError('');
    setMessage('');
    setView(next);
  };

  const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const validPassword = (value) => value.length >= 8;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (busy) return;
    setBusy(true);
    try {
      if (view === 'signup') {
        if (!name.trim()) throw new Error('Enter your full name.');
        if (!validEmail(email)) throw new Error('Enter a valid email address.');
        if (!validPassword(password)) throw new Error('Use at least 8 characters for your password.');
        if (!agreed) throw new Error('Please agree to the Terms and Privacy Policy to continue.');

        await authApi.register({
          name: name.trim(),
          email,
          password,
          referral_code: referralCode || undefined,
        });
        setPassword('');
        setMessage('If registration was accepted, KHUB has sent an email verification link. Open that link before signing in.');
        setView('verify');
        return;
      }

      if (view === 'signin') {
        if (!validEmail(email) || !password) throw new Error('Enter your email address and password.');
        const user = await authApi.signIn({ email, password });
        onAccountCreated(user);
        setMessage('You are signed in to KHUB.');
        return;
      }

      if (view === 'verify') {
        if (!validEmail(email)) throw new Error('Enter the email address you registered with.');
        await authApi.resendVerification(email);
        setMessage('If your account needs verification, a new verification email has been sent.');
        return;
      }

      if (view === 'forgot') {
        if (!validEmail(email)) throw new Error('Enter a valid email address.');
        await authApi.requestPasswordReset(email);
        setMessage('If an account exists for that email, password reset instructions will be sent.');
        return;
      }

      if (view === 'reset') {
        if (!resetToken) throw new Error('The password reset link is missing or invalid. Request a new reset email.');
        if (!validPassword(password)) throw new Error('Use at least 8 characters for your new password.');
        if (password !== confirmPassword) throw new Error('Your passwords do not match.');
        await authApi.resetPassword({ token: resetToken, password });
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        setMessage('Your password has been updated. Sign in with your new password.');
        setView('signin');
      }
    } catch (err) {
      setError(err?.message || 'The request could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const title = {
    signin: ['Welcome back.', 'Sign in to your everyday hub.'],
    signup: ['Start something good.', 'Create your KHUB account.'],
    verify: ['Verify your email.', 'Check your inbox for the KHUB verification link.'],
    forgot: ['Let’s get you back in.', 'Request a secure password reset link.'],
    reset: ['Choose a new password.', 'Set a new password for your KHUB account.'],
  }[view];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.pageHeading}>
          <span className={styles.eyebrow}>02 / ACCOUNT ACCESS</span>
          <h1>{title[0]}</h1>
          <p>{title[1]}</p>
        </div>

        <div className={styles.columns}>
          <section className={styles.intro}>
            <img className={styles.heroImage} src={hero} alt="A professional working at a laptop in a bright, plant-filled workspace" />
            <h2>One account. More possibilities.</h2>
            <p>Shop a space. Hire a skill. Find your next opportunity. Move through your city with KHUB.</p>
            <div className={styles.notice}>
              <span>Your account, your control</span>
              <p>KHUB manages your identity and permissions. Additional business and operational roles may require a separate application and verification.</p>
            </div>
          </section>

          <section className={styles.formCard} aria-label="Account form">
            {view === 'verify' && (
              <div className={styles.formLead}>
                <Mail size={18} />
                <span>Verification is completed through the secure link sent to your email. No six-digit browser code is used.</span>
              </div>
            )}

            <form onSubmit={submit} noValidate>
              {view === 'signin' && (
                <>
                  <label className={styles.field}>
                    <span>Email address</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="you@example.com" required />
                  </label>
                  <label className={styles.field}>
                    <span>Password</span>
                    <div className={styles.passwordInput}>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>
                  <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
                  <button className={styles.textButton} type="button" onClick={() => switchView('forgot')}>Forgot password?</button>
                  <p className={styles.switchText}>New here? <button type="button" onClick={() => switchView('signup')}>Create an account <ArrowRight size={14} /></button></p>
                </>
              )}

              {view === 'signup' && (
                <>
                  <label className={styles.field}>
                    <span>Full name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your full name" required />
                  </label>
                  <label className={styles.field}>
                    <span>Email address</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
                  </label>
                  <label className={styles.field}>
                    <span>Referral code (optional)</span>
                    <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} autoComplete="off" placeholder="Enter a referral code" />
                  </label>
                  <label className={styles.field}>
                    <span>Create password</span>
                    <div className={styles.passwordInput}>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}{showPassword ? 'Hide' : 'Show'}</button>
                    </div>
                    <small>Use at least 8 characters. KHUB securely hashes passwords on the server.</small>
                  </label>
                  <label className={styles.check}>
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    I agree to the Terms and Privacy Policy.
                  </label>
                  <div className={styles.notice}>
                    <span>One account, multiple opportunities</span>
                    <p>New accounts use the backend's default role. Seller, service provider, job poster, driver and other elevated roles are granted through protected workflows, not a signup dropdown.</p>
                  </div>
                  <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
                  <p className={styles.switchText}>Already registered? <button type="button" onClick={() => switchView('signin')}>Sign in <ArrowRight size={14} /></button></p>
                </>
              )}

              {view === 'verify' && (
                <>
                  <label className={styles.field}>
                    <span>Registered email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
                  </label>
                  <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Sending…' : 'Resend verification email'}</button>
                  <button className={styles.textButton} type="button" onClick={() => switchView('signin')}>Back to sign in</button>
                </>
              )}

              {view === 'forgot' && (
                <>
                  <label className={styles.field}>
                    <span>Account email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
                  </label>
                  <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Requesting…' : 'Send reset instructions'}</button>
                  <button className={styles.textButton} type="button" onClick={() => switchView('signin')}><ArrowLeft size={14} /> Back to sign in</button>
                </>
              )}

              {view === 'reset' && (
                <>
                  <label className={styles.field}>
                    <span>New password</span>
                    <div className={styles.passwordInput}>
                      <input type={showNewPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}{showNewPassword ? 'Hide' : 'Show'}</button>
                    </div>
                  </label>
                  <label className={styles.field}>
                    <span>Confirm new password</span>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                  </label>
                  <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
                  <button className={styles.textButton} type="button" onClick={() => switchView('forgot')}>Request another reset link</button>
                </>
              )}

              {error && <p className={styles.error} role="alert">{error}</p>}
              {message && <div className={styles.success} role="status"><CheckCircle2 size={17} /><span>{message}</span></div>}
              <p className={styles.legal}>Secure account operations are handled by the KHUB API. Never share your password or verification links.</p>
            </form>
          </section>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>© KHUB · Privacy · Terms</span>
        <span>
          <button type="button" onClick={onHome}>Return to KHUB</button>
        </span>
      </footer>
    </div>
  );
}
