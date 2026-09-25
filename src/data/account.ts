import { backendEnabled, clearRemoteSession, fetchRemoteProgress, loginRemote, registerRemote, saveRemoteProgress } from "./api";

export type LocalAccount = { id: string; studentName: string; username: string; passwordHash?: string; createdAt: string; };

const ACCOUNT_KEY = "biology-study:account";
const SAVED_ACCOUNTS_KEY = "biology-study:saved-accounts";
const COOKIE_CONSENT = "biology-study-cookie-consent";
const CLOUD_UPDATED_AT_KEY = "biology-study:cloud-updated-at";
function cloudKey(){const account=getAccount();return account?`${CLOUD_UPDATED_AT_KEY}:${account.id}`:CLOUD_UPDATED_AT_KEY;}
function getCloudUpdatedAt(){return localStorage.getItem(cloudKey());}
function setCloudUpdatedAt(value:string|null){if(value)localStorage.setItem(cloudKey(),value);else localStorage.removeItem(cloudKey());}

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
  rememberAccount(account);
  return account;
}

function rememberAccount(account: LocalAccount) {
  const accounts = getSavedAccounts().filter(item => item.id !== account.id && item.username !== account.username);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify([account, ...accounts].slice(0, 10)));
}

export function getSavedAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const accounts = JSON.parse(raw) as Partial<LocalAccount>[];
    return accounts.filter(item => Boolean(item?.id && item?.studentName && item?.username && item?.createdAt)) as LocalAccount[];
  } catch {
    return [];
  }
}

export function removeSavedAccount(accountId: string) {
  const accounts = getSavedAccounts().filter(item => item.id !== accountId);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function clearLocalAccount() {
  clearRemoteSession();
  const current = getAccount();
  if (current) removeSavedAccount(current.id);
  localStorage.removeItem(ACCOUNT_KEY);
}

export async function createLocalAccount(studentName: string, password: string): Promise<LocalAccount> {
  const cleanName = studentName.trim();
  if (!cleanName || password.length < 6) throw new Error("Name and a password of at least 6 characters are required.");

  if (backendEnabled()) {
    const response = await registerRemote(cleanName, password);
    localStorage.setItem("biology-study:auth-token", response.token);
    if (response.progress) localStorage.setItem("biology-study:remote-progress", JSON.stringify(response.progress));
    setCloudUpdatedAt(response.updatedAt);
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
      setCloudUpdatedAt(response.updatedAt);
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
    setCloudUpdatedAt(response.updatedAt);
    if (response.progress) localStorage.setItem("biology-study:remote-progress", JSON.stringify(response.progress));
    return response.progress;
  } catch (error) {
    if (error instanceof Error && error.message.includes("401")) clearRemoteSession();
    return null;
  }
}

export async function syncProgressToServer(progress: unknown) {
  if (!backendEnabled() || !hasRemoteSession()) return false;
  try {
    const latest = await fetchRemoteProgress();
    const knownAt = getCloudUpdatedAt();
    const serverAt = latest.updatedAt;
    if (knownAt && serverAt && knownAt !== serverAt) {
      setCloudUpdatedAt(serverAt);
      if (latest.progress) localStorage.setItem("biology-study:remote-progress", JSON.stringify(latest.progress));
      return false;
    }
    const response = await saveRemoteProgress(progress, knownAt);
    setCloudUpdatedAt(response.updatedAt);
    localStorage.setItem("biology-study:remote-progress", JSON.stringify(progress));
    return true;
  } catch (error) {
    return false;
  }
}

export function hasCookieConsent(): boolean { return document.cookie.split("; ").some(c => c === COOKIE_CONSENT + "=accepted"); }
export function acceptCookieConsent() { document.cookie = COOKIE_CONSENT + "=accepted; max-age=31536000; path=/; SameSite=Lax"; }
const ACCOUNT_DATA_KEYS = [
  "biology-study:progress",
  "biology-study:active-rat",
  "biology-study:active-cat",
  "biology-study:active-revision",
  "biology-study:nodes",
  "biology-study:validation-queue",
] as const;

export async function clearAccountStudyData(accountId: string): Promise<void> {
  for (const key of ACCOUNT_DATA_KEYS) localStorage.removeItem(key + ":" + accountId);
  localStorage.removeItem("biology-study:progress");
  localStorage.removeItem("biology-study:nodes");
  localStorage.removeItem("biology-study:validation-queue");
  if (backendEnabled() && hasRemoteSession()) {
    const emptyProgress = {
      points: 0,
      streak: 0,
      lastStudyDate: null,
      attempts: [],
      missedQuestionIds: [],
      revisionAttempts: [],
      lessonReadDate: null,
      lessonReadId: null,
      ratRetakeDate: null,
      completedLessonIds: [],
      lessonHistory: [],
      practiceSessions: [],
    };
    try {
      const response = await saveRemoteProgress(emptyProgress, getCloudUpdatedAt());
      setCloudUpdatedAt(response.updatedAt);
      localStorage.setItem("biology-study:remote-progress", JSON.stringify(emptyProgress));
    } catch {
      // Keep the local reset, but do not pretend the cloud reset succeeded.
    }
  }
}
