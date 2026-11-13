import { api, sessionTokens } from './api.js';

function normalizeLoginResponse(payload) {
  if (!payload?.token || !payload?.refresh_token || !payload?.user) {
    throw new Error('The authentication API returned an incomplete session response.');
  }
  sessionTokens.set(payload);
  return payload.user;
}

export const authApi = {
  async signIn({ email, password }) {
    const result = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    }, { auth: false });
    const user = normalizeLoginResponse(result);
    const current = await api.get('/auth/current');
    return current?.user || current;
  },

  async register({ name, email, password, referral_code }) {
    return api.post('/auth/register', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      ...(referral_code ? { referral_code: referral_code.trim() } : {}),
    }, { auth: false });
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
    const result = await api.get('/auth/current');
    return result?.user || result;
  },
};
