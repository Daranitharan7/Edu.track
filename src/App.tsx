import { useCallback, useState } from 'react';
import { AppShell } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { AssignmentsView } from './components/AssignmentsView';
import { AiAssistantView } from './components/AiAssistantView';
import { FacultyPortalView } from './components/FacultyPortalView';
import { NoticesView } from './components/NoticesView';
import {
  AcademicDocumentsView,
  CalendarPlannerView,
  SettingsView,
} from './components/SecondaryViews';
import {
  INITIAL_ASSIGNMENTS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_DOCUMENTS,
  INITIAL_FACULTY_TASKS,
  INITIAL_NOTICES,
  INITIAL_PLANNER_EVENTS,
  INITIAL_STUDY_DAYS,
} from './data/initialData';
import type {
  AcademicDocument,
  AppRoute,
  Assignment,
  ChatMessage,
  FacultyTask,
  Notice,
  PlannerEvent,
  StudyDay,
} from './types';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('dashboard');
  const [userRole, setUserRole] = useState<'student' | 'faculty'>('student');

  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [studyDays, setStudyDays] = useState<StudyDay[]>(INITIAL_STUDY_DAYS);
  const [studyGoalHours, setStudyGoalHours] = useState<number>(20);
  const [documents, setDocuments] = useState<AcademicDocument[]>(INITIAL_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>(INITIAL_DOCUMENTS[0].id);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [pendingAiPrompt, setPendingAiPrompt] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [facultyTasks, setFacultyTasks] = useState<FacultyTask[]>(INITIAL_FACULTY_TASKS);
  const [plannerEvents, setPlannerEvents] = useState<PlannerEvent[]>(INITIAL_PLANNER_EVENTS);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const handleNavigate = (route: AppRoute) => {
    setActiveRoute(route);
    if (route === 'faculty-portal') setUserRole('faculty');
    if (route === 'dashboard') setUserRole('student');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleRole = () => {
    if (userRole === 'student') {
      setUserRole('faculty');
      setActiveRoute('faculty-portal');
      showToast('Switched to Faculty Portal (Dr. Sarah Vance)');
    } else {
      setUserRole('student');
      setActiveRoute('dashboard');
      showToast('Switched to Student View (Alex Rivera)');
    }
  };

  const handleLogStudyHours = (dayIndex: number, delta: number) => {
    setStudyDays((prev) =>
      prev.map((d, idx) =>
        idx === dayIndex
          ? { ...d, hours: Number((d.hours + delta).toFixed(1)), completed: true }
          : d
      )
    );
    showToast(`Logged +${delta.toFixed(1)}h study focus`);
  };

  const handleToggleComplete = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const willComplete = a.status !== 'Completed';
        return {
          ...a,
          status: willComplete ? 'Completed' : 'In Progress',
          progress: willComplete ? 100 : 65,
          gradeScore: willComplete && !a.gradeScore ? 96 : a.gradeScore,
        };
      })
    );
    showToast('Assignment status updated');
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const clamped = Math.max(0, Math.min(100, progress));
        return {
          ...a,
          progress: clamped,
          status: clamped === 100 ? 'Completed' : clamped > 0 ? 'In Progress' : 'Pending',
        };
      })
    );
    showToast(`Progress updated to ${progress}%`);
  };

  const handleAddAssignment = (newItem: Omit<Assignment, 'id'>) => {
    const created: Assignment = {
      ...newItem,
      id: `a-${Date.now()}`,
    };
    setAssignments((prev) => [created, ...prev]);
    showToast(`Added "${created.title}"`);
  };

  const handleAskAiAboutAssignment = (assignment: Assignment) => {
    setPendingAiPrompt(
      `Help me plan and tackle "${assignment.title}" for ${assignment.courseCode} (${assignment.dueLabel}). What are the key steps I should focus on first?`
    );
    setActiveRoute('ai-assistant');
  };

  const handleSaveMessageToNotes = (msg: ChatMessage) => {
    setChatMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, savedToNotes: true } : m))
    );
    const activeDoc = documents.find((d) => d.id === activeDocId);
    const noteDoc: AcademicDocument = {
      id: `note-${Date.now()}`,
      name: `${msg.structured?.title || 'AI Study Note'}.md`,
      courseCode: activeDoc?.courseCode || 'CS-402',
      sizeLabel: '12 KB',
      slidesLabel: 'Saved AI summary',
      uploadedAt: 'Just now',
      summary: msg.structured?.intro || msg.text || 'Saved Academic Copilot summary',
      isSavedNote: true,
    };
    setDocuments((prev) => [noteDoc, ...prev]);
    showToast('Saved summary to Academic Documents');
  };

  const handlePublishNotice = (
    notice: Omit<Notice, 'id' | 'views' | 'timeAgo' | 'unread'>
  ) => {
    const created: Notice = {
      ...notice,
      id: `n-${Date.now()}`,
      timeAgo: 'Just now',
      views: 1,
      unread: true,
    };
    setNotices((prev) => [created, ...prev]);
    showToast(`Published notice: "${created.title}"`);
  };

  const handleGradeSubmission = (taskId: string, submissionId: string, score: number) => {
    setFacultyTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const target = t.submissions.find((s) => s.id === submissionId);
        const alreadyGraded = target?.status === 'Graded';
        return {
          ...t,
          gradedCount: alreadyGraded ? t.gradedCount : Math.min(t.submittedCount, t.gradedCount + 1),
          submissions: t.submissions.map((s) =>
            s.id === submissionId ? { ...s, status: 'Graded', score } : s
          ),
        };
      })
    );
    showToast(`Recorded grade ${score}/100`);
  };

  const unreadNoticesCount = notices.filter((n) => n.unread).length;

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={handleNavigate}
      unreadNoticesCount={unreadNoticesCount}
      userRole={userRole}
      onToggleRole={handleToggleRole}
      toastMessage={toastMessage}
    >
      {activeRoute === 'dashboard' && (
        <DashboardView
          assignments={assignments}
          studyDays={studyDays}
          studyGoalHours={studyGoalHours}
          notices={notices}
          onNavigate={handleNavigate}
          onLogStudyHours={handleLogStudyHours}
          onUpdateAssignmentProgress={handleUpdateProgress}
          onAskAiAboutAssignment={handleAskAiAboutAssignment}
        />
      )}

      {activeRoute === 'assignments' && (
        <AssignmentsView
          assignments={assignments}
          onToggleComplete={handleToggleComplete}
          onUpdateProgress={handleUpdateProgress}
          onAddAssignment={handleAddAssignment}
          onAskAi={handleAskAiAboutAssignment}
          onShowToast={showToast}
        />
      )}

      {activeRoute === 'ai-assistant' && (
        <AiAssistantView
          messages={chatMessages}
          documents={documents}
          activeDocId={activeDocId}
          assignments={assignments}
          pendingPrompt={pendingAiPrompt}
          onClearPendingPrompt={() => setPendingAiPrompt(null)}
          onSelectDoc={setActiveDocId}
          onAppendMessage={(msg) => setChatMessages((prev) => [...prev, msg])}
          onToggleMessageLike={(id) =>
            setChatMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, liked: !m.liked } : m))
            )
          }
          onSaveMessageToNotes={handleSaveMessageToNotes}
          onShowToast={showToast}
        />
      )}

      {activeRoute === 'announcements' && (
        <NoticesView
          notices={notices}
          onMarkRead={(id) =>
            setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
          }
          onMarkAllRead={() =>
            setNotices((prev) => prev.map((n) => ({ ...n, unread: false })))
          }
          onAddNoticeToPlanner={(notice) => {
            setPlannerEvents((prev) => [
              {
                id: `ev-${Date.now()}`,
                dayLabel: 'Upcoming',
                timeRange: 'Scheduled',
                title: notice.title,
                courseCode: notice.tag,
                type: 'Office Hour',
              },
              ...prev,
            ]);
            showToast('Added notice reminder to Planner');
          }}
        />
      )}

      {activeRoute === 'faculty-portal' && (
        <FacultyPortalView
          facultyTasks={facultyTasks}
          notices={notices}
          onSwitchToStudentView={() => {
            setUserRole('student');
            setActiveRoute('dashboard');
          }}
          onPublishAssignment={handleAddAssignment}
          onPublishNotice={handlePublishNotice}
          onGradeSubmission={handleGradeSubmission}
          onShowToast={showToast}
        />
      )}

      {activeRoute === 'calendar-and-planner' && (
        <CalendarPlannerView
          events={plannerEvents}
          onAddEvent={(ev) => {
            setPlannerEvents((prev) => [{ ...ev, id: `ev-${Date.now()}` }, ...prev]);
            showToast('Added study block to planner');
          }}
          onNavigate={handleNavigate}
        />
      )}

      {activeRoute === 'academic-documents' && (
        <AcademicDocumentsView
          documents={documents}
          activeDocId={activeDocId}
          onSelectForCopilot={(docId) => {
            setActiveDocId(docId);
            setActiveRoute('ai-assistant');
            showToast('Loaded document into Academic Copilot');
          }}
          onAddDocument={(doc) => {
            const created = { ...doc, id: `doc-${Date.now()}` };
            setDocuments((prev) => [created, ...prev]);
            setActiveDocId(created.id);
            showToast(`Indexed ${created.name}`);
          }}
        />
      )}

      {activeRoute === 'settings' && (
        <SettingsView
          userRole={userRole}
          studyGoalHours={studyGoalHours}
          onChangeStudyGoal={setStudyGoalHours}
          onToggleRole={handleToggleRole}
          onShowToast={showToast}
        />
      )}
    </AppShell>
  );
}
