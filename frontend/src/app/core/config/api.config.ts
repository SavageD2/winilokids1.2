type WiniloRuntimeConfig = {
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    __WINILO_CONFIG__?: WiniloRuntimeConfig;
  }
}

function resolveDefaultApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/api';
  }

  const { hostname, origin, port } = window.location;

  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '4200') {
    return 'http://localhost:3000/api';
  }

  return `${origin}/api`;
}

export const API_BASE_URL =
  window.__WINILO_CONFIG__?.apiBaseUrl?.trim() || resolveDefaultApiBaseUrl();
