import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Clock, FileText, Play, PauseCircle, CheckCircle2 } from "lucide-react";

interface Assignment {
  id: string;
  year: number;
  title: string;
  totalMarks: number;
  totalTimeMinutes: number;
  isPublished: boolean;
}

interface AssignmentAttempt {
  id: string;
  assignmentId: string;
  localStudentId: string;
  chosenOptionalSection: string;
  status: string;
  timeRemainingSeconds: number;
  currentSectionId: string | null;
  currentPartId: string | null;
  completedPartIds: string[];
}

export default function StudentAssignments() {
  const [, setLocation] = useLocation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Map<string, AssignmentAttempt>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/n5/assignments/active");
      if (!response.ok) throw new Error("Failed to fetch assignments");
      const data = await response.json();
      setAssignments(data);

      const localStudentId = getOrCreateStudentId();
      const attemptMap = new Map<string, AssignmentAttempt>();
      
      try {
        const attemptsResponse = await fetch(`/api/n5/assignment-attempts/student/${localStudentId}`);
        if (attemptsResponse.ok) {
          const serverAttempts = await attemptsResponse.json();
          for (const attempt of serverAttempts) {
            if (attempt.status === "cancelled") continue;
            attemptMap.set(attempt.assignmentId, attempt);
            localStorage.setItem(`assignment_attempt_${attempt.assignmentId}`, JSON.stringify(attempt));
          }
        }
      } catch (e) {
        console.warn("Failed to fetch server attempts, using localStorage:", e);
        for (const assignment of data) {
          const attemptKey = `assignment_attempt_${assignment.id}`;
          const stored = localStorage.getItem(attemptKey);
          if (stored) {
            try {
              const attemptData = JSON.parse(stored);
              attemptMap.set(assignment.id, attemptData);
            } catch {}
          }
        }
      }
      
      setAttempts(attemptMap);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateStudentId = (): string => {
    let studentId = localStorage.getItem("local_student_id");
    if (!studentId) {
      studentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("local_student_id", studentId);
    }
    return studentId;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} hours ${mins > 0 ? `${mins} minutes` : ""}` : `${mins} minutes`;
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
  };

  const handleStartAssignment = (assignmentId: string) => {
    setLocation(`/assignment/${assignmentId}`);
  };

  const handleContinueAssignment = (assignmentId: string) => {
    setLocation(`/assignment/${assignmentId}`);
  };

  const getAttemptStatus = (assignment: Assignment): { status: "not_started" | "in_progress" | "paused" | "completed"; attempt?: AssignmentAttempt } => {
    const attempt = attempts.get(assignment.id);
    if (!attempt || attempt.status === "cancelled") return { status: "not_started" };
    
    return {
      status: attempt.status as "in_progress" | "paused" | "completed",
      attempt,
    };
  };

  const sortedAssignments = [...assignments].sort((a, b) => b.year - a.year);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="back-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              N5 Coursework Assignments
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Complete your coursework assignment worth 40 marks (6 hours)
            </p>
          </div>
        </div>

        <Card className="mb-8 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Assignment Information
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>The assignment is worth 40 marks and you have 6 hours to complete it.</li>
              <li>There are three sections - SDD, DDD, and WDD.</li>
              <li>You must complete the Software Design and Development Section.</li>
              <li>You can then choose ONE of: Database Design and Development OR Web Design and Development.</li>
              <li>Each section is divided into parts, once you complete a part and move on you cannot go back to is.</li>
              <li>You can pause and resume at any time - your progress is saved.</li>
            </ul>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
              <h3 className="text-lg font-medium mb-2">No Assignments Available</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Check back later for available assignments
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
                  {sortedAssignments.map(assignment => {
                    const { status, attempt } = getAttemptStatus(assignment);
                    
                    return (
                      <Card key={assignment.id} data-testid={`assignment-card-${assignment.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{assignment.year} - Assignment</CardTitle>
                              <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(assignment.totalTimeMinutes)}
                                </span>
                                <span>{assignment.totalMarks} marks</span>
                              </CardDescription>
                            </div>
                            
                            {status === "not_started" && (
                              <Button
                                onClick={() => handleStartAssignment(assignment.id)}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`start-assignment-${assignment.id}`}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Assignment
                              </Button>
                            )}
                            
                            {status === "in_progress" && (
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTimeRemaining(attempt!.timeRemainingSeconds)}
                                </div>
                                <Button
                                  onClick={() => handleContinueAssignment(assignment.id)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                  data-testid={`continue-assignment-${assignment.id}`}
                                >
                                  Continue
                                </Button>
                              </div>
                            )}
                            
                            {status === "paused" && (
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                  <PauseCircle className="h-4 w-4" />
                                  Paused - {formatTimeRemaining(attempt!.timeRemainingSeconds)}
                                </div>
                                <Button
                                  onClick={() => handleContinueAssignment(assignment.id)}
                                  variant="outline"
                                  data-testid={`resume-assignment-${assignment.id}`}
                                >
                                  Resume
                                </Button>
                              </div>
                            )}
                            
                            {status === "completed" && (
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium">Completed</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        {(status === "in_progress" || status === "paused") && attempt && (
                          <CardContent className="pt-0 border-t">
                            <div className="flex items-center gap-4 text-sm pt-4">
                              <span className="text-neutral-600 dark:text-neutral-400">
                                Optional section: <span className="font-medium capitalize">{attempt.chosenOptionalSection}</span>
                              </span>
                              <span className="text-neutral-600 dark:text-neutral-400">
                                Parts completed: {attempt.completedPartIds?.length || 0}
                              </span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
          </div>
        )}
      </div>
    </div>
  );
}
