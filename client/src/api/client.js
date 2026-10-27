import axios from 'axios';

// Resolve and normalize the API Base URL
const rawApiUrl = import.meta.env.VITE_API_URL || '';

let resolvedBaseURL = '/api';
if (rawApiUrl) {
  const clean = rawApiUrl.trim().replace(/\/+$/, '');
  resolvedBaseURL = clean.endsWith('/api') ? clean : `${clean}/api`;
}

export const api = axios.create({
  baseURL: resolvedBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to format errors consistently and warn if API endpoint is misconfigured
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detect 405 Method Not Allowed (indicates requests hit a static host instead of the API)
    if (error.response?.status === 405) {
      console.error(
        '[SyncForge Config Error] Received 405 Method Not Allowed. The frontend is sending API requests to a static server instead of the backend API. Please ensure VITE_API_URL is set in your Vercel frontend project settings and points to your deployed backend URL (e.g. https://your-backend.vercel.app/api).'
      );
      return Promise.reject(
        new Error(
          'API endpoint misconfigured (405). Please verify VITE_API_URL points to your backend Vercel service.'
        )
      );
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
