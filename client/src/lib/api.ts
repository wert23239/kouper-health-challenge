const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

import type { Upload, Discharge, Stats, Enrichment } from '../types';

export const api = {
  // Stats
  getStats: () => request<Stats>('/discharges/stats'),

  // Uploads
  getUploads: () => request<Upload[]>('/uploads'),
  getUpload: (id: number) => request<Upload>(`/uploads/${id}`),
  uploadFile: async (file: File, uploadedBy: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('uploadedBy', uploadedBy);
    const res = await fetch(`${BASE}/uploads`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  // Discharges
  getDischarges: (params?: { status?: string; uploadId?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.uploadId) qs.set('uploadId', String(params.uploadId));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return request<{ data: Discharge[]; total: number }>(`/discharges${query ? `?${query}` : ''}`).then(r => r.data);
  },
  getDischarge: (id: number) => request<Discharge>(`/discharges/${id}`),
  editDischarge: (id: number, fields: Record<string, string>, editedBy: string, reason?: string) =>
    request<Discharge>(`/discharges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields, editedBy, reason }),
    }),
  reviewDischarge: (id: number, status: 'APPROVED' | 'REJECTED', reviewedBy: string) =>
    request<Discharge>(`/discharges/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewedBy }),
    }),
  enrichDischarge: (id: number) =>
    request<Enrichment[]>(`/discharges/${id}/enrich`, { method: 'POST' }),
};
