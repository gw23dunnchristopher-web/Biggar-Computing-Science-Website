// Lightweight module-level guard so navigation away from a "dirty"
// Table Design View can prompt the user to save / discard / cancel.
//
// TableDesignView registers a Guard while it has unsaved changes.
// Sidebar / tab bar navigation calls `guardedNavigate(...)`, which
// pops a 3-button dialog (Save / Discard / Cancel) before continuing.

export type DesignGuard = {
  isDirty: boolean;
  save: () => Promise<boolean>;
  discard: () => void;
};

let registered: DesignGuard | null = null;

let pendingResolver: ((a: 'save' | 'discard' | 'cancel') => void) | null = null;
const pendingListeners = new Set<(open: boolean) => void>();

export function setDesignGuard(g: DesignGuard | null) {
  registered = g;
}

export function hasDirtyDesign(): boolean {
  return !!registered?.isDirty;
}

export function subscribePending(fn: (open: boolean) => void): () => void {
  pendingListeners.add(fn);
  return () => { pendingListeners.delete(fn); };
}

function requestUserChoice(): Promise<'save' | 'discard' | 'cancel'> {
  return new Promise((resolve) => {
    pendingResolver = resolve;
    pendingListeners.forEach(l => l(true));
  });
}

export function resolveUserChoice(action: 'save' | 'discard' | 'cancel') {
  const r = pendingResolver;
  pendingResolver = null;
  pendingListeners.forEach(l => l(false));
  if (r) r(action);
}

export async function guardedNavigate(
  navigate: (href: string) => void,
  href: string,
): Promise<void> {
  if (!hasDirtyDesign()) {
    navigate(href);
    return;
  }
  const choice = await requestUserChoice();
  const g = registered;
  if (choice === 'cancel') return;
  if (choice === 'save' && g) {
    const ok = await g.save();
    if (!ok) return; // save failed; stay put
  } else if (choice === 'discard' && g) {
    g.discard();
  }
  registered = null;
  navigate(href);
}
