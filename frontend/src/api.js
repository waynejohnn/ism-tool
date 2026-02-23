function resolveApiBase() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname.includes('frontend')) {
      return `${protocol}//${hostname.replace('frontend', 'backend')}`;
    }
  }

  return 'http://localhost:5000';
}

const API_BASE = resolveApiBase();

async function parseError(response) {
  let details = '';
  try {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        details = parsed?.error || text;
      } catch {
        details = text;
      }
    }
  } catch {
    details = '';
  }

  return `Request failed (${response.status}${details ? `): ${details}` : ')'}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export async function apiGet(path) {
  return requestJson(path);
}

export async function apiPost(path, body) {
  return requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function apiPut(path, body) {
  return requestJson(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function apiPatch(path, body) {
  return requestJson(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function apiDelete(path) {
  return requestJson(path, {
    method: 'DELETE'
  });
}
