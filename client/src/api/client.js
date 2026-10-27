import axios from 'axios';

// Smart resolution and normalization of the API Base URL
let rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

if (rawApiUrl) {
  // If user entered e.g. "sync-forge-serverside.vercel.app" without protocol, prepend https://
  if (
    !rawApiUrl.startsWith('http://') &&
    !rawApiUrl.startsWith('https://') &&
    !rawApiUrl.startsWith('/')
  ) {
    rawApiUrl = `https://${rawApiUrl}`;
  }
  rawApiUrl = rawApiUrl.replace(/\/+$/, '');
  if (!rawApiUrl.endsWith('/api') && !rawApiUrl.includes('/api/')) {
    rawApiUrl = `${rawApiUrl}/api`;
  }
}

// Fallback to '/api' which is automatically reverse-proxied to https://sync-forge-serverside.vercel.app by Vercel
const resolvedBaseURL = rawApiUrl || '/api';

export const api = axios.create({
  baseURL: resolvedBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to format errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
