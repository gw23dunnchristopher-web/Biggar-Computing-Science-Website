import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const WORKSPACE_FLAG_KEY = 'ds_workspace_mode';
const WORKSPACE_USER_KEY = 'student_workspace_id';

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

export function useLocalUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (detectWorkspaceMode()) {
      let wsId = localStorage.getItem(WORKSPACE_USER_KEY);
      if (!wsId) {
        wsId = `student-workspace-${uuidv4()}`;
        localStorage.setItem(WORKSPACE_USER_KEY, wsId);
      }
      setUserId(wsId);
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
  }, []);

  return userId;
}
