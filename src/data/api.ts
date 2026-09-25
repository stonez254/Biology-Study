const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type RemoteAccount = {
  id: string;
  studentName: string;
  username: string;
  email: string | null;
  createdAt: string;
};

export type AuthResponse = { token: string; account: RemoteAccount; progress: unknown | null; updatedAt: string | null };

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

export async function registerRemote(studentName: string, email: string, password: string, username?: string) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ studentName, email, username, password }),
  });
}

export async function loginRemote(password: string, emailOrLegacyUsername?: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: emailOrLegacyUsername, password }),
  });
}

export async function setAccountEmail(email: string) {
  return request<{ account: RemoteAccount }>("/api/auth/email", {
    method: "PUT",
    body: JSON.stringify({ email }),
  });
}

export async function claimAssessmentSession(type: "RAT" | "CAT" | "REVISION", sessionId: string) {
  return request<{ accepted: boolean; submittedAt: string | null }>("/api/assessment/claim", {
    method: "POST",
    body: JSON.stringify({ type, sessionId }),
  });
}

export type VerifiedAssessmentResult = {
  type: "RAT" | "CAT" | "REVISION";
  sessionId: string;
  questionIds: string[];
  correctQuestionIds: string[];
  missedQuestionIds: string[];
  correct: number;
  total: number;
  score: number;
  accuracy: number;
  passed: boolean;
};

export async function submitAssessment(
  type: "RAT" | "CAT" | "REVISION",
  sessionId: string,
  questionIds: string[],
  answers: Record<string, number>,
) {
  return request<{ accepted: boolean; duplicate: boolean; submittedAt: string; updatedAt: string; result: VerifiedAssessmentResult }>("/api/assessment/submit", {
    method: "POST",
    body: JSON.stringify({ type, sessionId, questionIds, answers }),
  });
}

export async function fetchRemoteProgress() {
  return request<{ progress: unknown | null; updatedAt: string | null }>("/api/progress");
}

export async function saveRemoteProgress(progress: unknown, expectedUpdatedAt: string | null = null) {
  return request<{ ok: true; updatedAt: string }>("/api/progress", {
    method: "PUT",
    body: JSON.stringify({ progress, expectedUpdatedAt }),
  });
}

export function clearRemoteSession() {
  localStorage.removeItem("biology-study:auth-token");
}

export function hasRemoteSession() {
  return Boolean(localStorage.getItem("biology-study:auth-token"));
}
