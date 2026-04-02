import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PAST_PAPERS, Question } from './past-papers';

// Helper function to extract question number from title (e.g., "Question 15" -> 15)
export function extractQuestionNumber(title: string): number {
  const match = title.match(/Question\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

// Compare function to sort questions by question number (1, 2, 3, etc.)
export function compareQuestionsByNumber(a: Question, b: Question): number {
  const numA = extractQuestionNumber(a.title);
  const numB = extractQuestionNumber(b.title);
  return numA - numB;
}

// Helper function to sort questions by year (descending) then question number (ascending)
function sortQuestions(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => {
    // First sort by year (descending - newest first)
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    // Then sort by question number (1, 2, 3, etc.)
    return compareQuestionsByNumber(a, b);
  });
}

interface QuestionContextType {
  questions: Question[];
  loading: boolean;
  addQuestion: (question: Question) => Promise<boolean>;
  updateQuestion: (question: Question) => Promise<boolean>;
  deleteQuestion: (id: string) => Promise<void>;
  getQuestion: (id: string) => Question | undefined;
  refreshQuestions: () => Promise<void>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export function QuestionProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async (isBackgroundRefresh = false) => {
    try {
      const headers: Record<string, string> = {};
      const teacherToken = localStorage.getItem("teacherToken");
      const studentToken = localStorage.getItem("studentToken");
      if (teacherToken) {
        headers["Authorization"] = `Bearer ${teacherToken}`;
      } else if (studentToken) {
        headers["Authorization"] = `Bearer ${studentToken}`;
      }
      const response = await fetch('/api/questions', { headers });
      if (response.ok) {
        const dbQuestions = await response.json();
        // Display whatever is in the database - no client-side seeding
        if (dbQuestions.length > 0) {
          setQuestions(sortQuestions(dbQuestions));
        } else if (!isBackgroundRefresh) {
          // If database is empty, show fallback (server should have seeded on startup)
          console.warn('Database empty - no questions loaded. This should only happen if seeding failed.');
          setQuestions(sortQuestions(PAST_PAPERS));
        }
      } else if (!isBackgroundRefresh) {
        console.error('Failed to fetch questions:', response.statusText);
        setQuestions(sortQuestions(PAST_PAPERS));
      }
    } catch (error) {
      if (!isBackgroundRefresh) {
        console.error('Failed to fetch questions:', error);
        setQuestions(sortQuestions(PAST_PAPERS));
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQuestions();
    
    // Auto-refresh questions every 30 seconds to pick up new questions added by teachers
    const refreshInterval = setInterval(() => {
      fetchQuestions(true); // Background refresh - silent errors
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const addQuestion = async (question: Question): Promise<boolean> => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question),
      });
      if (response.ok) {
        setQuestions((prev) => sortQuestions([...prev, question]));
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to add question:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('Failed to add question:', error);
      return false;
    }
  };

  const updateQuestion = async (updatedQuestion: Question): Promise<boolean> => {
    try {
      const response = await fetch(`/api/questions/${updatedQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuestion),
      });
      if (response.ok) {
        setQuestions((prev) => 
          sortQuestions(prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)))
        );
        return true;
      }
      console.error('Failed to update question: Server returned', response.status);
      return false;
    } catch (error) {
      console.error('Failed to update question:', error);
      return false;
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const getQuestion = (id: string) => {
    return questions.find((q) => q.id === id);
  };

  const refreshQuestions = async () => {
    setLoading(true);
    await fetchQuestions();
  };

  return (
    <QuestionContext.Provider value={{ questions, loading, addQuestion, updateQuestion, deleteQuestion, getQuestion, refreshQuestions }}>
      {children}
    </QuestionContext.Provider>
  );
}

export function useQuestions() {
  const context = useContext(QuestionContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionProvider');
  }
  return context;
}
