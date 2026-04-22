/**
 * Cross-tab "open tables" registry.
 *
 * Each browser tab/window registers the tables it currently has open (in a
 * Data View, Design View, etc). Other tabs can read this list to decide
 * whether an operation should be blocked because the table is being viewed
 * elsewhere.
 *
 * Backed by localStorage so it works across tabs in the same browser. Each
 * tab owns its own entry; entries are heartbeated and expire after a few
 * seconds so a closed/crashed tab is cleaned up automatically.
 */

const STORAGE_KEY = 'ds:openTables';
const HEARTBEAT_MS = 2000;
const STALE_AFTER_MS = 6000;

const TAB_ID =
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`;

type Entry = { tabId: string; databaseId: number; tableId: number; ts: number };

function readAll(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const cutoff = Date.now() - STALE_AFTER_MS;
    return list.filter((e: any): e is Entry =>
      e && typeof e.tabId === 'string'
      && typeof e.databaseId === 'number'
      && typeof e.tableId === 'number'
      && typeof e.ts === 'number'
      && e.ts >= cutoff
    );
  } catch { return []; }
}

function writeAll(list: Entry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

const localOpen = new Map<string, { databaseId: number; tableId: number }>();

function syncToStorage() {
  const others = readAll().filter(e => e.tabId !== TAB_ID);
  const mine: Entry[] = Array.from(localOpen.values()).map(v => ({
    tabId: TAB_ID, databaseId: v.databaseId, tableId: v.tableId, ts: Date.now(),
  }));
  writeAll([...others, ...mine]);
}

let heartbeat: ReturnType<typeof setInterval> | null = null;
function ensureHeartbeat() {
  if (heartbeat) return;
  heartbeat = setInterval(syncToStorage, HEARTBEAT_MS);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const others = readAll().filter(e => e.tabId !== TAB_ID);
    writeAll(others);
  });
}

/** Mark a (database, table) as open in this tab. Returns a release fn. */
export function registerOpenTable(databaseId: number, tableId: number): () => void {
  const key = `${databaseId}:${tableId}`;
  localOpen.set(key, { databaseId, tableId });
  syncToStorage();
  ensureHeartbeat();
  return () => {
    localOpen.delete(key);
    syncToStorage();
  };
}

/** True if some OTHER tab currently has this table open. */
export function isTableOpenElsewhere(databaseId: number, tableId: number): boolean {
  return readAll().some(e =>
    e.tabId !== TAB_ID && e.databaseId === databaseId && e.tableId === tableId
  );
}
