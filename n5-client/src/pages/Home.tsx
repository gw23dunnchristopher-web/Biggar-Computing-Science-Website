import { Link, useLocation } from "wouter";
import { TOPICS, Topic, Question } from "@/lib/past-papers";
import { Shuffle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/components/StudentAuthContext";

const S: Record<string, React.CSSProperties> = {
  sidebarLink: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    color: "#fff",
    textDecoration: "none",
    backgroundColor: "#333333",
    fontSize: "16px",
    cursor: "pointer",
    borderBottom: "1px solid #3a3a3a",
    transition: "background-color 0.15s",
  },
  contentHeading: {
    fontFamily: "arial",
    marginBottom: "20px",
    color: "#17479b",
    backgroundColor: "#c5f1ff",
    textAlign: "center",
    border: "solid #376cfd",
    borderWidth: "1px 0",
    padding: "8px",
  },
  h2: {
    textAlign: "left",
    color: "#0c3f71",
    borderBottom: "solid #5252c8",
    fontSize: "25px",
    margin: "20px 0",
    padding: "4px 0",
  },
  th: {
    border: "1px solid black",
    padding: "10px",
    backgroundColor: "lightblue",
    textAlign: "center",
  },
  td: {
    border: "1px solid black",
    padding: "10px",
  },
  actionBtn: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#030346",
    color: "white",
    textDecoration: "none",
    borderRadius: "3px",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    border: "none",
    fontFamily: "Arial, sans-serif",
  },
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const studentAuth = useStudentAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [randomQuizOpen, setRandomQuizOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["sdcs", "dd", "wd"]);
  const [questionCount, setQuestionCount] = useState(5);
  const [hasPublishedAssignments, setHasPublishedAssignments] = useState(true);

  useEffect(() => {
    setIsTeacherLoggedIn(!!localStorage.getItem("teacherToken"));
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const headers: Record<string, string> = {};
        const studentToken = localStorage.getItem("studentToken");
        if (studentToken) headers["Authorization"] = `Bearer ${studentToken}`;
        const response = await fetch('/api/questions', { headers });
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.filter((q: Question) => !q.isQuizOnly));
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    const checkPublishedAssignments = async () => {
      try {
        const response = await fetch('/api/assignments');
        if (response.ok) {
          const data = await response.json();
          setHasPublishedAssignments(data.filter((a: { isPublished: boolean }) => a.isPublished).length > 0);
        }
      } catch {}
    };
    checkPublishedAssignments();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherTokenExpires");
    setIsTeacherLoggedIn(false);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
    );
  };

  const getAvailableQuestionCount = () =>
    questions.filter(q => selectedTopics.includes(q.topic)).length;

  const calculateTotalMarks = (questionList: Question[]): number => {
    let total = 0;
    for (const question of questionList) {
      for (const sq of question.subQuestions) {
        if (sq.subParts && sq.subParts.length > 0) {
          for (const part of sq.subParts) total += part.maxMarks || 0;
        } else { total += sq.maxMarks || 0; }
      }
    }
    return total;
  };

  const getEstimatedTime = (): number => {
    const available = questions.filter(q => selectedTopics.includes(q.topic));
    const count = Math.min(questionCount, available.length);
    const sampleQuestions = available.slice(0, count);
    return Math.ceil(calculateTotalMarks(sampleQuestions) * 1.125);
  };

  const questionsByTopic = TOPICS.reduce((acc, topic) => {
    acc[topic.id] = questions.filter(q => q.topic === topic.id);
    return acc;
  }, {} as Record<string, Question[]>);

  const maxQuestions = getAvailableQuestionCount();

  const startRandomQuiz = () => {
    const available = questions.filter(q => selectedTopics.includes(q.topic));
    if (available.length === 0) {
      toast({ title: "No questions available", description: "Please select at least one topic with questions.", variant: "destructive" });
      return;
    }
    const count = Math.min(questionCount, available.length);
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, count);
    const totalMarks = calculateTotalMarks(selectedQuestions);
    const quizId = `random-${Date.now()}`;
    localStorage.setItem("student_current_quiz", JSON.stringify({
      id: quizId,
      name: `Random Quiz (${count} questions)`,
      questionIds: selectedQuestions.map(q => q.id),
      questions: selectedQuestions,
      timeLimit: Math.ceil(totalMarks * 1.125),
      createdAt: new Date().toISOString(),
    }));
    setRandomQuizOpen(false);
    setLocation(`/timed-exam/student-quiz/${quizId}`);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh" }}>

      {/* Fixed black header */}
      <header style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100px",
        backgroundColor: "black", zIndex: 100, display: "flex", alignItems: "center", overflow: "hidden",
      }}>
        <h1 style={{ color: "white", padding: "0 30px", fontSize: "30px", fontFamily: "Arial", fontWeight: "bold", whiteSpace: "nowrap" }}>
          BHS Computing Science
        </h1>
        <img src="/Images/Header/banner.png" alt="" style={{ height: "100px", marginLeft: "auto" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </header>

      {/* Fixed navy sub-header */}
      <div style={{
        position: "fixed", top: "100px", left: 0, width: "100%",
        backgroundColor: "#030346", color: "white", fontFamily: "arial",
        textAlign: "center", padding: "10px", zIndex: 100,
      }}>
        <h1 style={{ fontSize: "22px", fontWeight: "normal" }}>National 5 CS Revision Tool</h1>
      </div>

      {/* Fixed footer */}
      <footer style={{
        position: "fixed", bottom: 0, left: 0, width: "100%",
        backgroundColor: "black", height: "50px", display: "flex",
        alignItems: "center", zIndex: 100, padding: "0 20px",
      }}>
        <div style={{ color: "lightgrey", fontSize: "10px", fontFamily: "arial" }}>
          Biggar High School &nbsp;&nbsp; Market Rd, Biggar &nbsp;&nbsp; ML12 6AG
        </div>
        <div style={{ marginLeft: "auto", color: "lightgrey", fontSize: "10px", fontFamily: "arial" }}>
          ©C Dunn, 2025
        </div>
      </footer>

      {/* Main layout */}
      <div style={{ display: "flex", marginTop: "150px", marginBottom: "50px", minHeight: "calc(100vh - 200px)" }}>

        {/* Fixed sidebar */}
        <div style={{
          position: "fixed", top: "150px", left: 0, width: "320px",
          backgroundColor: "#333333", height: "calc(100vh - 200px)", overflowY: "auto",
        }}>
          <div style={{ padding: "10px", backgroundColor: "#2a2a2a", borderBottom: "1px solid #444" }}>
            <input type="text" placeholder="Search N5 pages..."
              style={{
                width: "100%", padding: "8px 12px", border: "1px solid #555",
                borderRadius: "4px", backgroundColor: "#1a1a1a", color: "#fff",
                fontSize: "14px", boxSizing: "border-box",
              }} readOnly />
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li>
              <Link href="/">
                <a style={S.sidebarLink}><span>Home</span></a>
              </Link>
            </li>
            <li>
              <a href="/HTML/N5/N5Home.html" style={S.sidebarLink}><span>Main Website</span></a>
            </li>
            <li style={{ borderTop: "1px solid #555" }}>
              <div style={{ ...S.sidebarLink, backgroundColor: "#2a2a2a", fontSize: "12px", color: "#aaa", cursor: "default", textTransform: "uppercase", letterSpacing: "1px" }}>
                Revision Topics
              </div>
            </li>
            {TOPICS.map(topic => (
              <li key={topic.id}>
                <Link href={`/revise/${topic.id}`}>
                  <a style={S.sidebarLink}>
                    <span>{topic.name}</span>
                    <span style={{ fontSize: "11px" }}>&#9654;</span>
                  </a>
                </Link>
              </li>
            ))}
            <li style={{ borderTop: "1px solid #555" }}>
              <div style={{ ...S.sidebarLink, backgroundColor: "#2a2a2a", fontSize: "12px", color: "#aaa", cursor: "default", textTransform: "uppercase", letterSpacing: "1px" }}>
                Tools
              </div>
            </li>
            <li>
              <Link href="/timed-mode">
                <a style={S.sidebarLink}><span>Past Papers</span></a>
              </Link>
            </li>
            <li>
              <a style={S.sidebarLink} onClick={() => setRandomQuizOpen(true)} data-testid="button-random-quiz">
                <span>Random Quiz</span>
              </a>
            </li>
            <li>
              <Link href="/my-quizzes">
                <a style={S.sidebarLink}><span>My Quizzes</span></a>
              </Link>
            </li>
            {hasPublishedAssignments && (
              <li>
                <Link href="/assignments">
                  <a style={S.sidebarLink}><span>Coursework Assignment</span></a>
                </Link>
              </li>
            )}
            <li style={{ borderTop: "1px solid #555" }}>
              <div style={{ ...S.sidebarLink, backgroundColor: "#2a2a2a", fontSize: "12px", color: "#aaa", cursor: "default", textTransform: "uppercase", letterSpacing: "1px" }}>
                Account
              </div>
            </li>
            {studentAuth.isLoggedIn ? (
              <>
                <li>
                  <div style={{ ...S.sidebarLink, backgroundColor: "#1a3a5c", cursor: "default" }}>
                    <span data-testid="text-student-username">&#128393; {studentAuth.username}</span>
                  </div>
                </li>
                <li>
                  <Link href="/my-progress">
                    <a style={{ ...S.sidebarLink, paddingLeft: "20px" }} data-testid="link-my-progress"><span>My Progress</span></a>
                  </Link>
                </li>
                <li>
                  <a style={{ ...S.sidebarLink, paddingLeft: "20px" }} onClick={() => studentAuth.logout()} data-testid="button-student-logout">
                    <span>Logout</span>
                  </a>
                </li>
              </>
            ) : (
              <li>
                <Link href="/student/login">
                  <a style={S.sidebarLink} data-testid="link-student-login"><span>Student Login</span></a>
                </Link>
              </li>
            )}
            {isTeacherLoggedIn ? (
              <>
                <li>
                  <Link href="/teacher/dashboard">
                    <a style={S.sidebarLink}><span>Teacher Dashboard</span></a>
                  </Link>
                </li>
                <li>
                  <a style={{ ...S.sidebarLink, paddingLeft: "20px" }} onClick={handleLogout}>
                    <span>Teacher Logout</span>
                  </a>
                </li>
              </>
            ) : (
              <li>
                <Link href="/teacher/login">
                  <a style={S.sidebarLink}><span>Teacher Access</span></a>
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Content area */}
        <div style={{ marginLeft: "320px", width: "calc(100% - 320px)", backgroundColor: "white", padding: "10px 10px 60px" }}>

          <div style={S.contentHeading as React.CSSProperties}>
            <h1 style={{ fontSize: "28px" }}>Course Overview</h1>
          </div>

          <div style={{ maxWidth: "1400px", margin: "auto", padding: "10px", textAlign: "left" }}>
            <p style={{ textAlign: "center", fontSize: "18px", padding: "10px" }}>
              <b>Use the sidebar to select a topic or action to get started with your National 5 Computing Science revision!</b>
            </p>

            <h2 style={S.h2 as React.CSSProperties}>Revision Topics</h2>
            <p style={{ fontSize: "18px", padding: "10px" }}>
              Select a topic from the sidebar or the table below to practise past paper questions with AI-powered marking and feedback.
            </p>

            <table style={{ borderCollapse: "collapse", margin: "20px auto", width: "100%", border: "1px solid black" }}>
              <thead>
                <tr>
                  <th style={S.th as React.CSSProperties}>Topic</th>
                  <th style={S.th as React.CSSProperties}>Description</th>
                  <th style={S.th as React.CSSProperties}>Questions</th>
                  <th style={S.th as React.CSSProperties}>Action</th>
                </tr>
              </thead>
              <tbody>
                {TOPICS.map(topic => (
                  <tr key={topic.id}>
                    <td style={{ ...S.td, fontWeight: "bold" } as React.CSSProperties}>{topic.name}</td>
                    <td style={S.td as React.CSSProperties}>{topic.description}</td>
                    <td style={{ ...S.td, textAlign: "center" } as React.CSSProperties}>
                      {questionsByTopic[topic.id]?.length || 0}
                    </td>
                    <td style={{ ...S.td, textAlign: "center" } as React.CSSProperties}>
                      <Link href={`/revise/${topic.id}`}>
                        <a style={{ color: "#17479b", textDecoration: "underline", fontWeight: "bold" }}>
                          Revise &#9654;
                        </a>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={S.h2 as React.CSSProperties}>Quick Actions</h2>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", padding: "10px 0" }}>
              <Link href="/timed-mode">
                <a style={S.actionBtn as React.CSSProperties}>&#9654; Past Papers</a>
              </Link>
              <a style={S.actionBtn as React.CSSProperties} onClick={() => setRandomQuizOpen(true)} data-testid="button-random-quiz-content">
                &#9654; Random Quiz
              </a>
              <Link href="/my-quizzes">
                <a style={{ ...S.actionBtn, backgroundColor: "#17479b" } as React.CSSProperties}>&#9654; My Quizzes</a>
              </Link>
              {hasPublishedAssignments && (
                <Link href="/assignments">
                  <a style={{ ...S.actionBtn, backgroundColor: "#2d4ba4" } as React.CSSProperties}>&#9654; Coursework Assignment</a>
                </Link>
              )}
            </div>

            <h2 style={S.h2 as React.CSSProperties}>About This Tool</h2>
            <p style={{ fontSize: "18px", padding: "10px" }}>
              This revision tool provides access to National 5 Computing Science past paper questions with AI-powered marking and feedback.
              Work through questions topic by topic, or try a timed past paper to practise exam conditions.
            </p>
            <ul style={{ listStyleType: "circle", marginLeft: "30px", fontSize: "18px" }}>
              <li style={{ marginBottom: "10px", padding: "5px" }}>Practice questions from past SQA exam papers</li>
              <li style={{ marginBottom: "10px", padding: "5px" }}>AI-marked responses with detailed feedback</li>
              <li style={{ marginBottom: "10px", padding: "5px" }}>Timed past paper mode to simulate exam conditions</li>
              <li style={{ marginBottom: "10px", padding: "5px" }}>Save your own quizzes and track your progress</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Random Quiz Dialog */}
      <Dialog open={randomQuizOpen} onOpenChange={setRandomQuizOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5" />
              Random Quiz
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="block text-sm font-medium mb-3">Select Topics</label>
              <div className="space-y-2">
                {TOPICS.map(topic => {
                  const count = questionsByTopic[topic.id]?.length || 0;
                  return (
                    <div
                      key={topic.id}
                      className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer"
                      onClick={() => toggleTopic(topic.id)}
                    >
                      <Checkbox
                        checked={selectedTopics.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                      />
                      <span className="flex-1 font-medium">{topic.name}</span>
                      <span className="text-sm text-neutral-500">{count} questions</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, maxQuestions)))}
                  className="w-24"
                  min={1}
                  max={maxQuestions}
                />
                <span className="text-sm text-neutral-500">Max: {maxQuestions} available</span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Estimated time:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~{getEstimatedTime()} minutes
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRandomQuizOpen(false)}>Cancel</Button>
            <Button
              onClick={startRandomQuiz}
              style={{ backgroundColor: "#030346" }}
              disabled={selectedTopics.length === 0 || getAvailableQuestionCount() === 0}
              data-testid="button-start-random-quiz"
            >
              Start Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
