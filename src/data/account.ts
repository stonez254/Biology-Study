import { backendEnabled, clearRemoteSession, fetchRemoteProgress, loginRemote, registerRemote, saveRemoteProgress } from "./api";

export type LocalAccount = { id: string; studentName: string; username: string; passwordHash?: string; createdAt: string; };

const ACCOUNT_KEY = "biology-study:account";
const COOKIE_CONSENT = "biology-study-cookie-consent";

export function getAccount(): LocalAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const account = JSON.parse(raw) as Partial<LocalAccount>;
    if (!account.studentName || !account.username || !account.createdAt || !account.id) return null;
    return account as LocalAccount;
  } catch { return null; }
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function saveAccount(account: LocalAccount) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  return account;
}

export async function createLocalAccount(studentName: string, password: string): Promise<LocalAccount> {
  const cleanName = studentName.trim();
  if (!cleanName || password.length < 6) throw new Error("Name and a password of at least 6 characters are required.");

  if (backendEnabled()) {
    const response = await registerRemote(cleanName, password);
    localStorage.setItem("biology-study:auth-token", response.token);
    if (response.progress) localStorage.setItem("biology-study:remote-progress", JSON.stringify(response.progress));
    return saveAccount(response.account);
  }

  const account: LocalAccount = { id: crypto.randomUUID(), studentName: cleanName, username: cleanName, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
  return saveAccount(account);
}

export async function verifyLocalPassword(password: string, username?: string): Promise<boolean> {
  if (backendEnabled()) {
    try {
      const response = await loginRemote(password, username || getAccount()?.username);
      localStorage.setItem("biology-study:auth-token", response.token);
      saveAccount(response.account);
      if (response.progress) localStorage.setItem("biology-study:remote-progress", JSON.stringify(response.progress));
      return true;
    } catch {
      return false;
    }
  }
  const account = getAccount();
  return Boolean(account?.passwordHash && (await hashPassword(password)) === account.passwordHash);
}

export function hasRemoteSession(): boolean { return Boolean(localStorage.getItem("biology-study:auth-token")); }

export async function hydrateRemoteProgress(): Promise<unknown | null> {
  if (!backendEnabled() || !hasRemoteSession()) return null;
  try {
    const response = await fetchRemoteProgress();
    return response.progress;
  } catch {
    clearRemoteSession();
    return null;
  }
}

export async function syncProgressToServer(progress: unknown) {
  if (!backendEnabled() || !hasRemoteSession()) return;
  try { await saveRemoteProgress(progress); } catch { /* local-first: keep working offline */ }
}

export function hasCookieConsent(): boolean { return document.cookie.split("; ").some(c => c === COOKIE_CONSENT + "=accepted"); }
export function acceptCookieConsent() { document.cookie = COOKIE_CONSENT + "=accepted; max-age=31536000; path=/; SameSite=Lax"; }
export function clearLocalAccount() { clearRemoteSession(); localStorage.removeItem(ACCOUNT_KEY); }

const ACCOUNT_DATA_KEYS = [
  "biology-study:progress",
  "biology-study:active-rat",
  "biology-study:active-cat",
  "biology-study:active-revision",
  "biology-study:nodes",
  "biology-study:validation-queue",
] as const;

export function clearAccountStudyData(accountId: string): void {
  for (const key of ACCOUNT_DATA_KEYS) localStorage.removeItem(key + ":" + accountId);
  localStorage.removeItem("biology-study:progress");
  localStorage.removeItem("biology-study:nodes");
  localStorage.removeItem("biology-study:validation-queue");
}
