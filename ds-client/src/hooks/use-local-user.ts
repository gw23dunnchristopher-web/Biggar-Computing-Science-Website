import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useLocalUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
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
