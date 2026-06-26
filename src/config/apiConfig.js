const DEFAULT_BACKEND_URL =
  'http://127.0.0.1:8000';

function trimTrailingSlash(value) {
  return String(value || '')
    .replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  const configuredApiUrl =
    trimTrailingSlash(
      import.meta.env.VITE_API_URL
    );

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  const backendUrl =
    trimTrailingSlash(
      import.meta.env.VITE_BACKEND_URL ||
        DEFAULT_BACKEND_URL
    );

  return `${backendUrl}/api`;
}

export function getBackendBaseUrl() {
  const configuredBackendUrl =
    trimTrailingSlash(
      import.meta.env.VITE_BACKEND_URL
    );

  if (configuredBackendUrl) {
    return configuredBackendUrl;
  }

  return getApiBaseUrl()
    .replace(/\/api$/, '');
}

export function getApiUrl(path = '') {
  const normalizedPath =
    String(path || '')
      .replace(/^\/+/, '');

  return normalizedPath
    ? `${getApiBaseUrl()}/${normalizedPath}`
    : getApiBaseUrl();
}
