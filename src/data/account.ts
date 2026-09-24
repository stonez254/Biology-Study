export type LocalAccount = { studentName: string; username: string; passwordHash: string; createdAt: string; };

const ACCOUNT_KEY = "biology-study:account";
const COOKIE_CONSENT = "biology-study-cookie-consent";

export function getAccount(): LocalAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) as LocalAccount : null;
  } catch { return null; }
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createLocalAccount(studentName: string, password: string): Promise<LocalAccount> {
  const cleanName = studentName.trim();
  if (!cleanName || password.length < 6) throw new Error("Name and a password of at least 6 characters are required.");
  const account: LocalAccount = { studentName: cleanName, username: cleanName, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  return account;
}

export async function verifyLocalPassword(password: string): Promise<boolean> {
  const account = getAccount();
  return Boolean(account && (await hashPassword(password)) === account.passwordHash);
}

export function hasCookieConsent(): boolean { return document.cookie.split("; ").some(c => c === COOKIE_CONSENT + "=accepted"); }
export function acceptCookieConsent() { document.cookie = COOKIE_CONSENT + "=accepted; max-age=31536000; path=/; SameSite=Lax"; }
export function clearLocalAccount() { localStorage.removeItem(ACCOUNT_KEY); }
