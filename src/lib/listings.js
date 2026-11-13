import { api } from './api.js';

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export const listingsApi = {
  browse(params = {}) {
    return api.get(`/listings${queryString(params)}`, { auth: false });
  },
  search(params = {}) {
    return api.get(`/listings/search${queryString(params)}`, { auth: false });
  },
  detail(pid) {
    return api.get(`/listings/${encodeURIComponent(pid)}`, { auth: false });
  },
  mine() {
    return api.get('/my/listings');
  },
  create(payload) {
    return api.post('/listings', payload);
  },
  update(pid, payload) {
    return api.patch(`/listings/${encodeURIComponent(pid)}`, payload);
  },
  updateStatus(pid, status) {
    return api.patch(`/listings/${encodeURIComponent(pid)}/status`, { status });
  },
  archive(pid) {
    return api.delete(`/listings/${encodeURIComponent(pid)}`);
  },
  uploadImage(pid, file) {
    const data = new FormData();
    data.append('image', file);
    return api.upload(`/listings/${encodeURIComponent(pid)}/images`, data);
  },
  deleteImage(pid, imagePid) {
    return api.delete(`/listings/${encodeURIComponent(pid)}/images/${encodeURIComponent(imagePid)}`);
  },
};
