const trimUrl = (url) => (url ? url.replace(/\/$/, '') : '');

const apiOrigin = trimUrl(import.meta.env.VITE_API_URL);
const socketOrigin = trimUrl(import.meta.env.VITE_SOCKET_URL) || apiOrigin;

export const API_BASE_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : apiOrigin
      ? `${apiOrigin}/api`
      : '/api';

export const SOCKET_URL = import.meta.env.DEV
    ? 'http://localhost:5000'
    : socketOrigin || '/';
