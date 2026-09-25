const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\\/$/, "");

export type RemoteAccount = {
  id: string;
  studentName: string;
  username: string;
  createdAt: string;
};

export type AuthResponse = { token: string; account: RemoteAccount; progress: unknown | null };

function enabled() {
  return Boolean(API_URL);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!enabled()) throw new Error("Remote backend is not configured.");
  const token = localStorage.getItem("biology-study:auth-token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body as T;
}

export function backendEnabled() { return enabled(); }

export async function registerRemote(studentName: string, password: string) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ studentName, password }),
  });
}

export async function loginRemote(password: string, username?: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchRemoteProgress() {
  return request<{ progress: unknown | null }>("/api/progress");
}

export async function saveRemoteProgress(progress: unknown) {
  return request<{ ok: true }>("/api/progress", {
    method: "PUT",
    body: JSON.stringify({ progress }),
  });
}

export function clearRemoteSession() {
  localStorage.removeItem("biology-study:auth-token");
}

export function hasRemoteSession() {
  return Boolean(localStorage.getItem("biology-study:auth-token"));
}
