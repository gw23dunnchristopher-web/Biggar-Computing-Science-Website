import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const WORKSPACE_FLAG_KEY = 'ds_workspace_mode';
const WORKSPACE_USER_KEY = 'student_workspace_id';
const STUDENT_TOKEN_KEY = 'studentToken';

function detectWorkspaceMode(): boolean {
    try {
        const url = new URLSearchParams(window.location.search);
        if (url.get('workspace') === '1') {
            sessionStorage.setItem(WORKSPACE_FLAG_KEY, '1');
            return true;
        }
        return sessionStorage.getItem(WORKSPACE_FLAG_KEY) === '1';
    } catch {
        return false;
    }
}

export function useIsWorkspaceMode() {
    const [isWorkspace, setIsWorkspace] = useState(false);
    useEffect(() => {
        setIsWorkspace(detectWorkspaceMode());
    }, []);
    return isWorkspace;
}

function readStudentToken(): string | null {
    try { return localStorage.getItem(STUDENT_TOKEN_KEY); }
    catch { return null; }
}

async function verifyStudentToken(token: string): Promise<{ studentId: string; username: string } | null> {
    try {
        const res = await fetch('/api/student/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.valid) return null;
        return { studentId: String(data.studentId), username: String(data.username) };
    } catch {
        return null;
    }
}

function ensureWorkspaceUuid(): string {
    let wsId = localStorage.getItem(WORKSPACE_USER_KEY);
    if (!wsId) {
        wsId = `student-workspace-${uuidv4()}`;
        localStorage.setItem(WORKSPACE_USER_KEY, wsId);
    }
    return wsId;
}

/* The active userId.

   In workspace mode (the embed used by the Database Sandbox tool page) we
   first look for a `studentToken` in localStorage — if the student is signed
   in to the main site we use `student-<studentId>` so the same dashboard
   follows them across devices.  Otherwise we fall back to the per-browser
   `student-workspace-<uuid>` id used by guests.

   In teacher mode the existing behaviour is unchanged.
*/
export function useLocalUser() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const resolve = async () => {
            if (detectWorkspaceMode()) {
                const token = readStudentToken();
                if (token) {
                    const info = await verifyStudentToken(token);
                    if (cancelled) return;
                    if (info) {
                        setUserId(`student-${info.studentId}`);
                        return;
                    }
                }
                setUserId(ensureWorkspaceUuid());
                return;
            }

            const teacherToken = localStorage.getItem('teacher_token') || localStorage.getItem('teacherToken');
            if (teacherToken) {
                localStorage.setItem('access_teacher_id', 'bhs-n5-access-teacher');
                setUserId('bhs-n5-access-teacher');
                return;
            }

            let id = localStorage.getItem('access_teacher_id');
            if (!id) {
                id = `teacher-${uuidv4()}`;
                localStorage.setItem('access_teacher_id', id);
            }
            setUserId(id);
        };

        resolve();

        // React to login / logout in another tab (same origin) so the
        // dashboard reloads under the new identity.
        const onStorage = (e: StorageEvent) => {
            if (e.key === STUDENT_TOKEN_KEY) {
                resolve();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => {
            cancelled = true;
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    return userId;
}

/* Tracks whether a logged-in student in workspace mode has guest databases
   sitting under their old `student-workspace-<uuid>` id that could be
   imported into their account.  Returns null while we're still checking,
   `{ count: 0 }` when nothing needs importing, or
   `{ count: N, fromUserId, doImport, skip }` when there's something to ask
   the student about.

   The session-storage flag prevents the prompt from re-appearing once the
   student has answered it for this tab.
*/
const TRANSFER_FLAG_KEY = 'ds_workspace_transfer_handled';

export interface PendingTransfer {
    count: number;
    fromUserId: string;
    doImport: () => Promise<number>;
    skip: () => void;
}

export function useWorkspaceTransfer(activeUserId: string | null): PendingTransfer | null {
    const [pending, setPending] = useState<PendingTransfer | null>(null);

    useEffect(() => {
        if (!activeUserId || !activeUserId.startsWith('student-')) return;
        if (activeUserId.startsWith('student-workspace-')) return;
        const fromUserId = localStorage.getItem(WORKSPACE_USER_KEY);
        if (!fromUserId || !fromUserId.startsWith('student-workspace-')) return;
        try { if (sessionStorage.getItem(TRANSFER_FLAG_KEY) === '1') return; } catch {}

        const token = readStudentToken();
        if (!token) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(
                    `/api/ds/workspace/transfer-info?fromUserId=${encodeURIComponent(fromUserId)}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled || !data?.count) return;
                setPending({
                    count: data.count,
                    fromUserId,
                    doImport: async () => {
                        try { sessionStorage.setItem(TRANSFER_FLAG_KEY, '1'); } catch {}
                        const r = await fetch('/api/ds/workspace/transfer', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ fromUserId }),
                        });
                        const out = await r.json();
                        // Clear the guest workspace id so we don't re-prompt next session.
                        localStorage.removeItem(WORKSPACE_USER_KEY);
                        setPending(null);
                        return Number(out?.transferred || 0);
                    },
                    skip: () => {
                        try { sessionStorage.setItem(TRANSFER_FLAG_KEY, '1'); } catch {}
                        setPending(null);
                    },
                });
            } catch {
                /* silent — student can refresh to retry */
            }
        })();

        return () => { cancelled = true; };
    }, [activeUserId]);

    return pending;
}
