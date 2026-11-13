import { api } from './api.js';

export const walletApi = {
  summary: () => api.get('/wallet/'),
  entries: (after) => api.get('/wallet/entries' + (after ? `?after=${encodeURIComponent(after)}` : '')),
  fund: (amount) => api.post('/wallet/fund', { amount }),
  fundingStatus: (pid) => api.get(`/wallet/fund/${encodeURIComponent(pid)}`),
  withdraw: (payload) => api.post('/wallet/withdraw', payload),
  withdrawals: () => api.get('/wallet/withdrawals'),
  banks: () => api.get('/wallet/banks'),
  transfer: (payload) => api.post('/wallet/transfer', payload),
};
