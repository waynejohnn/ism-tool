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

export async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error('Request failed');
  }
  return response.json();
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error('Request failed');
  }
  return response.json();
}

export async function apiPut(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error('Request failed');
  }
  return response.json();
}

export async function apiPatch(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error('Request failed');
  }
  return response.json();
}

export async function apiDelete(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Request failed');
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}
