
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import styles from './AccountPage.module.css';
import hero from './assets/hero.jpg';

const roles = ['User', 'Seller', 'Service Provider', 'Driver / Dispatch Rider', 'Job poster', 'Rental Agent'];
const STORAGE_KEY = 'khub_demo_accounts';

const readAccounts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveAccounts = (accounts) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

export default function AccountPage({
  onHome = () => {},
  onAccountCreated = () => {},
}) {
  const [view, setView] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [role, setRole] = useState('Buyer');
  const [remember, setRemember] = useState(true);
  const [agreed, setAgreed] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const switchView = (next) => {
    setError('');
    setMessage('');
    setView(next);
  };

  const validEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const validPassword = (value) =>
    value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value);

  const submit = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (view === 'signup') {
      if (!name.trim()) {
        return setError('Enter your full name.');
      }

      if (!validEmail(email)) {
        return setError('Enter a valid email address.');
      }

      if (!phone.trim()) {
        return setError('Enter your phone number.');
      }

      if (!roles.includes(role)) {
        return setError('Choose a starting role.');
      }

      if (!validPassword(password)) {
        return setError(
          'Use at least 12 characters, including an uppercase letter and a number.'
        );
      }

      if (!agreed) {
        return setError(
          'Please agree to the Terms and Privacy Policy to continue.'
        );
      }

      const accounts = readAccounts();
      const existing = accounts.find(
        (account) =>
          account.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (existing) {
        return setError(
          'An account with this email already exists. Please sign in instead.'
        );
      }

      setCode(['', '', '', '', '', '']);
      setMessage(
        'Demo verification is ready. Enter any 6 digits to continue.'
      );
      setView('verify');
      return;
    }

    if (view === 'signin') {
      if (!email.trim() || !password) {
        return setError('Enter your email address and password.');
      }

      const accounts = readAccounts();
      const account = accounts.find(
        (item) =>
          item.email.toLowerCase() === email.trim().toLowerCase() &&
          item.password === password
      );

      if (!account) {
        return setError(
          'No matching demo account was found. Check your details or create an account first.'
        );
      }

      const signedInUser = {
        name: account.name,
        email: account.email,
        phone: account.phone,
        role: account.role,
      };

      if (remember) {
        localStorage.setItem(
          'khub_demo_current_user',
          JSON.stringify(signedInUser)
        );
      } else {
        sessionStorage.setItem(
          'khub_demo_current_user',
          JSON.stringify(signedInUser)
        );
      }

      setMessage(
        `Welcome back, ${account.name}! Opening your ${account.role} dashboard.`
      );

      onAccountCreated(signedInUser);
      return;
    }

    // UPDATED PHONE VERIFICATION AND ACCOUNT CREATION
    if (view === 'verify') {
      if (code.some((digit) => !digit)) {
        return setError(
          'Enter all 6 digits of the verification code.'
        );
      }

      const accounts = readAccounts();
      const existing = accounts.find(
        (account) =>
          account.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (existing) {
        return setError(
          'An account with this email already exists. Please sign in instead.'
        );
      }

      const newAccount = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
        createdAt: new Date().toISOString(),
      };

      try {
        saveAccounts([...accounts, newAccount]);

        const user = {
          name: newAccount.name,
          email: newAccount.email,
          phone: newAccount.phone,
          role: newAccount.role,
        };

        localStorage.setItem(
          'khub_demo_current_user',
          JSON.stringify(user)
        );

        setMessage(
          'Demo code accepted. Your number is verified in this preview.'
        );

        onAccountCreated(user);
      } catch {
        setError(
          'Unable to save this demo account in your browser. Check your browser storage settings.'
        );
      }

      return;
    }

    if (view === 'forgot') {
      if (!validEmail(email)) {
        return setError(
          'Enter a complete email address, such as name@example.com.'
        );
      }

      const account = readAccounts().find(
        (item) =>
          item.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (account) {
        setMessage(
          'This frontend demo does not send reset emails. You can return to sign in or create a new demo account using another email.'
        );
      } else {
        setMessage(
          'No demo account was found for that email. Check the address or create an account.'
        );
      }

      return;
    }

    if (view === 'reset') {
      if (!validPassword(password)) {
        return setError(
          'Use at least 12 characters, including an uppercase letter and a number.'
        );
      }

      if (password !== confirmPassword) {
        return setError('Your passwords do not match.');
      }

      const accounts = readAccounts();
      const accountIndex = accounts.findIndex(
        (item) =>
          item.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (accountIndex === -1) {
        return setError(
          'No demo account was found for this email address.'
        );
      }

      accounts[accountIndex] = {
        ...accounts[accountIndex],
        password,
      };

      try {
        saveAccounts(accounts);
        setPassword('');
        setConfirmPassword('');
        setMessage(
          'Demo password updated. You can now sign in with your new password.'
        );
        setView('signin');
      } catch {
        setError(
          'Unable to update the demo password in browser storage.'
        );
      }
    }
  };

  const title = {
    signin: ['Welcome back.', 'Sign in to your everyday hub.'],
    signup: [
      'Start something good.',
      'Create one account. Choose how you’ll use KHUB.',
    ],
    verify: [
      'Verify your number',
      'A little check to keep your account yours.',
    ],
    forgot: [
      'Let’s get you back in.',
      'Reset your password securely.',
    ],
    reset: [
      'Choose a new password.',
      'Make it strong, unique and easy for you to remember.',
    ],
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
            <img
              className={styles.heroImage}
              src={hero}
              alt="A professional working at a laptop in a bright, plant-filled workspace"
            />

            <h2>One account. More possibilities.</h2>

            <p>
              Shop a space. Hire a skill. Find your next opportunity. Move
              through your city with KHUB.
            </p>

            <div className={styles.notice}>
              <span>Your account, your control</span>
              <p>
                Manage roles in one place. Verification is separate from
                advertised listings.
              </p>
            </div>
          </section>

          <section className={styles.formCard} aria-label="Account form">
            {view === 'verify' && (
              <p className={styles.formLead}>
                Demo verification for {phone}. No SMS will actually be sent.
              </p>
            )}

            <form onSubmit={submit} noValidate>
              {view === 'signin' && (
                <>
                  <label className={styles.field}>
                    <span>Email address</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Password</span>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me on this device
                  </label>

                  <button className={styles.primary} type="submit">
                    Sign in
                  </button>

                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => switchView('forgot')}
                  >
                    Forgot password?
                  </button>

                  <div className={styles.notice}>
                    <span>Keep your account safe</span>
                    <p>
                      This is a local demo. Do not use a real password or
                      sensitive personal information.
                    </p>
                  </div>

                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() =>
                      setMessage(
                        'Google sign-in is not connected in this demo.'
                      )
                    }
                  >
                    Continue with Google
                  </button>

                  <p className={styles.switchText}>
                    New here?{' '}
                    <button
                      type="button"
                      onClick={() => switchView('signup')}
                    >
                      Create an account <ArrowRight size={14} />
                    </button>
                  </p>
                </>
              )}

              {view === 'signup' && (
                <>
                  <label className={styles.field}>
                    <span>Full name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="Your full name"
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Email address</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Phone number</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="+234..."
                      required
                    />
                    <small>
                      Demo mode: no verification SMS will be sent.
                    </small>
                  </label>

                  <div className={styles.roleGroup}>
                    <strong>Choose your starting role</strong>

                    <div className={styles.roles}>
                      {roles.map((item) => (
                        <button
                          type="button"
                          key={item}
                          className={
                            role === item ? styles.roleActive : styles.role
                          }
                          onClick={() => setRole(item)}
                          aria-pressed={role === item}
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    <small>
                      You can add more roles later. Driver and business tools
                      may require additional verification.
                    </small>
                  </div>

                  <label className={styles.field}>
                    <span>Create password</span>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <small>
                      At least 12 characters, including an uppercase letter
                      and a number.
                    </small>
                  </label>

                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    I agree to the Terms and Privacy Policy.
                  </label>

                  <button className={styles.primary} type="submit">
                    Create account
                  </button>

                  <div className={styles.notice}>
                    <span>Already have an account?</span>
                    <p>
                      Sign in to continue. You don’t need a separate account
                      for each role.
                    </p>
                  </div>

                  <p className={styles.switchText}>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => switchView('signin')}
                    >
                      Sign in <ArrowRight size={14} />
                    </button>
                  </p>
                </>
              )}

              {view === 'verify' && (
                <>
                  <strong className={styles.labelTitle}>
                    Demo verification code
                  </strong>

                  <div className={styles.codeGrid}>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        aria-label={`Verification digit ${index + 1}`}
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          setCode((old) =>
                            old.map((value, i) =>
                              i === index
                                ? e.target.value.replace(/\D/g, '').slice(-1)
                                : value
                            )
                          )
                        }
                      />
                    ))}
                  </div>

                  <small className={styles.muted}>
                    Enter any six digits to complete the frontend demo.
                  </small>

                  <button className={styles.primary} type="submit">
                    Verify and create account
                  </button>

                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() => switchView('signup')}
                  >
                    Change account details
                  </button>

                  <div className={styles.notice}>
                    <span>Demo verification</span>
                    <p>
                      This step does not verify ownership of a real phone
                      number. It is only for testing the account flow.
                    </p>
                  </div>
                </>
              )}

              {view === 'forgot' && (
                <>
                  <label className={styles.field}>
                    <span>Account email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <button className={styles.primary} type="submit">
                    Check demo account
                  </button>

                  <div className={styles.notice}>
                    <span>Password recovery</span>
                    <p>
                      Email delivery is not connected. If you have a demo
                      account, you can try updating its password below.
                    </p>
                  </div>

                  <label className={styles.field}>
                    <span>New password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Confirm new password</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </label>

                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() => switchView('reset')}
                  >
                    Update demo password
                  </button>

                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => switchView('signin')}
                  >
                    <ArrowLeft size={14} /> Back to sign in
                  </button>
                </>
              )}

              {view === 'reset' && (
                <>
                  <label className={styles.field}>
                    <span>New password</span>
                    <div className={styles.passwordInput}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <small>
                      At least 12 characters, including an uppercase letter
                      and a number.
                    </small>
                  </label>

                  <label className={styles.field}>
                    <span>Confirm new password</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </label>

                  <button className={styles.primary} type="submit">
                    Update password
                  </button>

                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => switchView('signin')}
                  >
                    <ArrowLeft size={14} /> Back to sign in
                  </button>
                </>
              )}

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              {message && (
                <div className={styles.success} role="status">
                  <CheckCircle2 size={17} />
                  <span>{message}</span>
                </div>
              )}

              <p className={styles.legal}>
                Frontend demo only. Real authentication, email delivery, and
                phone verification are not connected.
              </p>
            </form>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>
          © KHUB · Privacy · Terms · Illustrative marketplace content
        </span>

        <span>
          <button
            type="button"
            onClick={() =>
              setMessage(
                'Trust & safety support is not connected in this demo.'
              )
            }
          >
            Trust &amp; safety
          </button>
          {'　/　'}
          <button
            type="button"
            onClick={() =>
              setMessage('Contact support is not connected in this demo.')
            }
          >
            Contact support
          </button>
        </span>
      </footer>
    </div>
  );
}
