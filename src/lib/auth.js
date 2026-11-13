import { api, sessionTokens } from './api.js';

function normalizeLoginResponse(payload) {
  if (!payload?.token || !payload?.refresh_token) {
    throw new Error('The authentication API returned an incomplete session response.');
  }
  sessionTokens.set(payload);
  return payload.user || { pid: payload.pid, name: payload.name, is_verified: payload.is_verified };
}

export const authApi = {
  async signIn({ email, password }) {
    const result = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    }, { auth: false });
    const user = normalizeLoginResponse(result);
    const profile = await api.get('/user/profile');
    return profile?.user || profile;
  },

  async signInWithGoogle(id_token) {
    const result = await api.post('/auth/google', { id_token }, { auth: false });
    normalizeLoginResponse(result);
    const profile = await api.get('/user/profile');
    return profile?.user || profile;
  },

  async register({ name, email, password, referral_code }) {
    return api.post('/auth/register', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      ...(referral_code ? { referral_code: referral_code.trim() } : {}),
    }, { auth: false });
  },

  async verifyEmail(token) {
    return api.get('/auth/verify/' + encodeURIComponent(token), { auth: false });
  },

  async exchangeMagicLink(token) {
    const result = await api.get('/auth/magic-link/' + encodeURIComponent(token), { auth: false });
    normalizeLoginResponse(result);
    const profile = await api.get('/user/profile');
    return profile?.user || profile;
  },

  async requestPasswordReset(email) {
    return api.post('/auth/forgot', { email: email.trim().toLowerCase() }, { auth: false });
  },

  async resetPassword({ token, password }) {
    return api.post('/auth/reset', { token, password }, { auth: false });
  },

  async requestMagicLink(email) {
    return api.post('/auth/magic-link', { email: email.trim().toLowerCase() }, { auth: false });
  },

  async resendVerification(email) {
    return api.post('/auth/resend-verification-mail', { email: email.trim().toLowerCase() }, { auth: false });
  },

  async signOut() {
    const refresh_token = sessionTokens.getRefreshToken();
    try {
      if (refresh_token) await api.post('/auth/logout', { refresh_token });
    } finally {
      sessionTokens.clear();
    }
  },

  async getCurrentUser() {
    const token = sessionTokens.getAccessToken();
    if (!token) return null;
    const result = await api.get('/user/profile');
    return result?.user || result;
  },
};
