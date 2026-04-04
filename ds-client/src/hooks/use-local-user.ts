import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useLocalUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('access_teacher_id');
    if (!id) {
      id = `teacher-${uuidv4()}`;
      localStorage.setItem('access_teacher_id', id);
    }
    setUserId(id);
  }, []);

  return userId;
}
