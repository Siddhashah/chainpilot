import { api } from './client';
import type { Material, Product, Prediction, CalendarEvent } from '../types';

interface UsageEntry {
  id: string;
  materialId: string;
  date: string;
  quantity: number;
  notes: string;
  source: string;
}

export const materialsApi = {
  list: () => api.get<{ data: Material[] }>('/materials').then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Material }>(`/materials/${id}`).then((r) => r.data.data),
  create: (data: Partial<Material>) =>
    api.post<{ data: Material }>('/materials', data).then((r) => r.data.data),
  update: (id: string, data: Partial<Material>) =>
    api.put<{ data: Material }>(`/materials/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/materials/${id}`),
  updateStock: (id: string, data: Record<string, number>) =>
    api.patch<{ data: Material }>(`/materials/${id}/stock`, data).then((r) => r.data.data),
};

export const productsApi = {
  list: () => api.get<{ data: Product[] }>('/products').then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Product }>(`/products/${id}`).then((r) => r.data.data),
  create: (data: Partial<Product>) =>
    api.post<{ data: Product }>('/products', data).then((r) => r.data.data),
  update: (id: string, data: Partial<Product>) =>
    api.put<{ data: Product }>(`/products/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/products/${id}`),
};

export const usageApi = {
  list: (materialId: string) =>
    api.get<{ data: UsageEntry[] }>(`/usage/${materialId}`).then((r) => r.data.data),
  log: (data: { materialId: string; date: string; quantity: number; notes?: string }) =>
    api.post<{ data: UsageEntry }>('/usage', data).then((r) => r.data.data),
  upload: (materialId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/usage/upload/${materialId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const predictionsApi = {
  list: () => api.get<{ data: Prediction[] }>('/predictions').then((r) => r.data.data),
  generate: (materialId: string) =>
    api.post<{ data: Prediction }>(`/predictions/generate/${materialId}`).then((r) => r.data.data),
};

export const calendarApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ data: CalendarEvent[] }>('/calendar', { params }).then((r) => r.data.data),
  create: (data: Partial<CalendarEvent>) =>
    api.post<{ data: CalendarEvent }>('/calendar', data).then((r) => r.data.data),
  update: (id: string, data: Partial<CalendarEvent>) =>
    api.put<{ data: CalendarEvent }>(`/calendar/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/calendar/${id}`),
};
