import React, { useState } from 'react';
import type { Assignment, FacultyTask, Notice, PriorityLevel } from '../types';
import { ASSETS } from '../data/initialData';
import { ModalSheet, ResilientImage } from './SharedUI';

interface FacultyPortalViewProps {
  facultyTasks: FacultyTask[];
  notices: Notice[];
  onSwitchToStudentView: () => void;
  onPublishAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  onPublishNotice: (notice: Omit<Notice, 'id' | 'views' | 'timeAgo' | 'unread'>) => void;
  onGradeSubmission: (taskId: string, submissionId: string, score: number) => void;
  onShowToast: (msg: string) => void;
}

export function FacultyPortalView({
  facultyTasks,
  notices,
  onSwitchToStudentView,
  onPublishAssignment,
  onPublishNotice,
  onGradeSubmission,
  onShowToast,
}: FacultyPortalViewProps) {
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Modals
  const [officeHourModalOpen, setOfficeHourModalOpen] = useState(false);
  const [officeHourSlot, setOfficeHourSlot] = useState('Tonight, 6:00 PM – 7:00 PM (Zoom + Hall 4B)');

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [taskCourse, setTaskCourse] = useState('CS-402');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>('High');

  const [announceOpen, setAnnounceOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const [gradingTask, setGradingTask] = useState<FacultyTask | null>(null);
  const [flagsTask, setFlagsTask] = useState<FacultyTask | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});

  // AI Analytics modal
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    headline: string;
    bottleneckAnalysis: string;
    recommendations: string[];
  } | null>(null);

  const totalAwaitingGrade = facultyTasks.reduce(
    (acc, t) => acc + Math.max(0, t.submittedCount - t.gradedCount),
    0
  );

  const displayedTasks = showAllTasks ? facultyTasks : facultyTasks.slice(0, 2);
  const deptNotice = notices.find((n) => n.tag === 'DEPT') || notices[0];

  const handleOpenAnalytics = async () => {
    setAnalyticsOpen(true);
    if (analyticsData) return;
    setAnalyticsLoading(true);
    try {
      const summary = facultyTasks
        .map(
          (t) =>
            `${t.courseCode} ${t.title}: ${t.submittedCount}/${t.totalStudents} submitted, ${t.gradedCount} graded, ${t.similarityFlags} flags`
        )
        .join('\n');
      const res = await fetch('/api/ai/faculty-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseCode: 'CS-402', submissionsSummary: summary }),
      });
      const data = await res.json();
      if (!res.ok || !data.insight) {
        throw new Error(data.error || 'Failed to compute analytics.');
      }
      setAnalyticsData(data.insight);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Unable to load AI Analytics');
      setAnalyticsOpen(false);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateOfficeHour = (e: React.FormEvent) => {
    e.preventDefault();
    onPublishNotice({
      tag: 'DEPT',
      title: 'CS-402 Drop-In Office Hour Scheduled',
      body: `Dr. Sarah Vance added a drop-in Raft heartbeat troubleshooting session: ${officeHourSlot}.`,
      author: 'Dr. Sarah Vance · CS Dept',
      audience: 'CS-402 Batch A & B',
      delivered: true,
    });
    setOfficeHourModalOpen(false);
    setAlertDismissed(true);
  };

  const handlePublishNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onPublishAssignment({
      courseCode: taskCourse,
      title: taskTitle.trim(),
      subtitle: 'Published from Faculty Portal',
      professor: 'Dr. Sarah Vance',
      assignedDate: 'Assigned Today',
      dueLabel: 'Due Nov 08',
      dueDateIso: '2024-11-08T23:59:00',
      priority: taskPriority,
      status: 'Pending',
      progress: 0,
      estimatedHours: 4.0,
      aiVelocityScore: 88,
    });
    setTaskTitle('');
    setNewTaskOpen(false);
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    onPublishNotice({
      tag: 'DEPT',
      title: noticeTitle.trim(),
      body: noticeBody.trim(),
      author: 'Dr. Sarah Vance · CS Dept',
      audience: 'All CS Sections',
      delivered: true,
    });
    setNoticeTitle('');
    setNoticeBody('');
    setAnnounceOpen(false);
  };

  return (
    <div className="px-4 lg:px-6 pt-3 pb-8 flex flex-col gap-4">
      {/* Faculty Context & Switch Role Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container">
            <span className="material-symbols-outlined text-[15px]">school</span>
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Faculty Portal · CS Dept
            </span>
          </div>
          <button
            type="button"
            onClick={onSwitchToStudentView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">sync_alt</span>
            <span className="text-[11px] font-semibold">Switch View</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-[22px] lg:text-[26px] font-bold text-on-surface tracking-tight">
              Dr. Sarah Vance
            </h1>
            <p className="text-xs font-medium text-on-surface-variant">
              Associate Professor · Distributed Systems
            </p>
          </div>
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
            <ResilientImage
              src={ASSETS.facultyAvatar}
              alt="Dr. Sarah Vance"
              fallbackText="SV"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Responsive Desktop 2-Col Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Alert + KPIs + Quick Actions */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {!alertDismissed && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary-fixed to-surface-container-lowest shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined material-symbols-filled text-[20px]">
                    auto_awesome
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-wider">
                    AI Teaching Assistant Alert
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary font-semibold shadow-xs">
                  High Signal
                </span>
              </div>
              <p className="text-sm text-on-surface font-medium leading-snug">
                18 students spent &gt;4 hours on Raft heartbeat timeout simulation. Consider hosting
                a quick drop-in office hour before tomorrow&apos;s cutoff.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOfficeHourModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">video_call</span>
                  <span>Schedule Office Hour</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlertDismissed(true)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-medium transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Overview KPI Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase text-outline font-semibold tracking-wider">
                  Enrolled
                </span>
                <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[32px] leading-none font-bold text-on-surface tabular-nums">
                  148
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">Across 3 courses</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGradingTask(facultyTasks[1])}
              className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between text-left hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] uppercase text-outline font-semibold tracking-wider">
                  Awaiting Grade
                </span>
                <div className="w-7 h-7 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[18px]">rate_review</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[32px] leading-none font-bold text-error flex items-center gap-1.5 tabular-nums">
                  {totalAwaitingGrade}
                  <span className="w-2.5 h-2.5 rounded-full bg-error" />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">Needs review</p>
              </div>
            </button>

            <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase text-outline font-semibold tracking-wider">
                  Active Tasks
                </span>
                <div className="w-7 h-7 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">assignment</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[32px] leading-none font-bold text-on-surface tabular-nums">
                  {facultyTasks.length}
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">Live submissions</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase text-outline font-semibold tracking-wider">
                  Class Avg
                </span>
                <div className="w-7 h-7 rounded-lg bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[32px] leading-none font-bold text-on-surface tabular-nums">
                  84.6%
                </div>
                <div className="flex items-center gap-1 mt-1 text-tertiary text-[11px] font-semibold">
                  <span>+3.2%</span>
                  <span className="text-on-surface-variant font-normal">vs last term</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Launchpad */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase text-outline tracking-wider font-semibold">
              Quick Actions
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNewTaskOpen(true)}
                className="h-12 px-3 rounded-xl bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[19px]">add_circle</span>
                <span>New Assignment</span>
              </button>
              <button
                type="button"
                onClick={() => setAnnounceOpen(true)}
                className="h-12 px-3 rounded-xl bg-secondary-container text-on-secondary-fixed text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[19px]">campaign</span>
                <span>Announce</span>
              </button>
              <button
                type="button"
                onClick={() => setGradingTask(facultyTasks[1])}
                className="h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-semibold flex items-center justify-between shadow-sm hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    checklist
                  </span>
                  <span>Grade Batch</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold tabular-nums">
                  {totalAwaitingGrade}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleOpenAnalytics()}
                className="h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-semibold flex items-center justify-between shadow-sm hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    insights
                  </span>
                  <span>AI Analytics</span>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Submissions & Department Notices */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-outline tracking-wider font-semibold">
                Live Submissions Tracker
              </span>
              <button
                type="button"
                onClick={() => setShowAllTasks((s) => !s)}
                className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
              >
                {showAllTasks ? 'Show Top 2' : `View All (${facultyTasks.length})`}
              </button>
            </div>

            {displayedTasks.map((ft) => {
              const pct = ft.submissionsClosed
                ? Math.round((ft.gradedCount / Math.max(1, ft.submittedCount)) * 100)
                : Math.round((ft.submittedCount / Math.max(1, ft.totalStudents)) * 100);
              return (
                <div
                  key={ft.id}
                  className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px] font-bold">
                          {ft.courseCode}
                        </span>
                        <span
                          className={`text-[11px] font-semibold flex items-center gap-1 ${
                            ft.submissionsClosed ? 'text-tertiary' : 'text-error'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ft.submissionsClosed ? 'bg-tertiary' : 'bg-error'
                            }`}
                          />
                          {ft.dueLabel}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-on-surface mt-1 leading-snug">
                        {ft.title}
                      </h2>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                        ft.submissionsClosed
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {ft.batchLabel}
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant">
                        {ft.submissionsClosed ? 'Grading Status' : 'Turn-in Velocity'}
                      </span>
                      <span className="text-on-surface font-semibold tabular-nums">
                        {ft.submissionsClosed
                          ? `${ft.gradedCount} of ${ft.submittedCount} graded (${pct}%)`
                          : `${ft.submittedCount} / ${ft.totalStudents} submitted (${pct}%)`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ft.submissionsClosed ? 'bg-tertiary' : 'bg-primary'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Similarity Flag Pill */}
                  {ft.similarityFlags > 0 && (
                    <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-on-surface-variant min-w-0">
                        <span className="material-symbols-outlined text-[18px] text-error shrink-0">
                          flag
                        </span>
                        <span className="text-xs truncate">
                          {ft.similarityFlags} flags: anomalous code similarity detected
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFlagsTask(ft)}
                        className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-[11px] font-bold shrink-0 hover:opacity-90 cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    {ft.submissionsClosed ? (
                      <span className="text-xs text-on-surface-variant tabular-nums">
                        {Math.max(0, ft.submittedCount - ft.gradedCount)} submissions remaining
                      </span>
                    ) : (
                      <div className="flex items-center -space-x-2">
                        {['TL', 'MK', 'RJ'].map((init, idx) => (
                          <div
                            key={init}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ring-2 ring-surface-container-lowest ${
                              idx === 0
                                ? 'bg-secondary-container text-on-secondary-fixed'
                                : idx === 1
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                : 'bg-primary-fixed text-on-primary-fixed'
                            }`}
                          >
                            {init}
                          </div>
                        ))}
                        <div className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[11px] font-semibold ring-2 ring-surface-container-lowest tabular-nums">
                          +{Math.max(0, ft.submittedCount - 3)}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setGradingTask(ft)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-all cursor-pointer ${
                        ft.submissionsClosed
                          ? 'bg-secondary-container text-on-secondary-fixed'
                          : 'bg-primary text-on-primary shadow-xs'
                      }`}
                    >
                      {ft.submissionsClosed ? 'Resume Grading' : 'Review Submissions'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department Notices */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-outline tracking-wider font-semibold">
                Department Notices
              </span>
              <button
                type="button"
                onClick={() => setAnnounceOpen(true)}
                className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
              >
                + New Notice
              </button>
            </div>
            {deptNotice && (
              <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">room_preferences</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-on-surface truncate">
                      {deptNotice.title}
                    </h3>
                    <span className="text-[11px] text-on-surface-variant shrink-0">
                      {deptNotice.timeAgo}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                    {deptNotice.body}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] font-medium">
                    <span className="text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">groups</span>
                      {deptNotice.audience}
                    </span>
                    <span className="text-secondary flex items-center gap-1 tabular-nums">
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      {deptNotice.views} views
                    </span>
                    <span className="text-tertiary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Delivered
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Office Hour Modal */}
      <ModalSheet
        open={officeHourModalOpen}
        onClose={() => setOfficeHourModalOpen(false)}
        title="Schedule Drop-In Office Hour"
        subtitle="Broadcasts an instant department notice to CS-402"
      >
        <form onSubmit={handleCreateOfficeHour} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">
              Session Window &amp; Location
            </span>
            <input
              type="text"
              value={officeHourSlot}
              onChange={(e) => setOfficeHourSlot(e.target.value)}
              className="h-11 px-3 rounded-xl bg-surface-container-low text-sm border border-outline-variant/40"
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOfficeHourModalOpen(false)}
              className="h-10 px-4 rounded-lg bg-surface-container text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
            >
              Publish Session Notice
            </button>
          </div>
        </form>
      </ModalSheet>

      {/* New Assignment Modal */}
      <ModalSheet
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        title="Publish Course Assignment"
        subtitle="Syncs directly to enrolled students' task feeds"
      >
        <form onSubmit={handlePublishNewTask} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Course</span>
              <input
                type="text"
                value={taskCourse}
                onChange={(e) => setTaskCourse(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Priority</span>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as PriorityLevel)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-on-surface-variant">Assignment Title</span>
            <input
              type="text"
              placeholder="e.g. Lab 5: Snapshot Compaction"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewTaskOpen(false)}
              className="h-10 px-4 rounded-lg bg-surface-container text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
            >
              Publish to Students
            </button>
          </div>
        </form>
      </ModalSheet>

      {/* Announce Notice Modal */}
      <ModalSheet
        open={announceOpen}
        onClose={() => setAnnounceOpen(false)}
        title="New Department Notice"
        subtitle="Broadcast announcement to student Notices feed"
      >
        <form onSubmit={handlePublishNotice} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-on-surface-variant">Headline</span>
            <input
              type="text"
              placeholder="e.g. Lab 4 Autograder Maintenance Window"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-on-surface-variant">Message</span>
            <textarea
              rows={3}
              placeholder="Details for all enrolled sections..."
              value={noticeBody}
              onChange={(e) => setNoticeBody(e.target.value)}
              className="p-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAnnounceOpen(false)}
              className="h-10 px-4 rounded-lg bg-surface-container text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
            >
              Broadcast Notice
            </button>
          </div>
        </form>
      </ModalSheet>

      {/* Similarity Flags Modal */}
      <ModalSheet
        open={Boolean(flagsTask)}
        onClose={() => setFlagsTask(null)}
        title="Code Similarity Review"
        subtitle={flagsTask ? `${flagsTask.courseCode} · ${flagsTask.title}` : ''}
      >
        {flagsTask && (
          <div className="flex flex-col gap-3">
            {flagsTask.submissions
              .filter((s) => s.status === 'Flagged')
              .map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-error-container/30 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-on-surface">{sub.studentName}</span>
                    <span className="text-xs font-bold text-error tabular-nums">
                      {sub.similarityScore}% AST Match
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{sub.notes}</p>
                </div>
              ))}
          </div>
        )}
      </ModalSheet>

      {/* Submissions & Batch Grading Modal */}
      <ModalSheet
        open={Boolean(gradingTask)}
        onClose={() => setGradingTask(null)}
        title={gradingTask ? `Submissions · ${gradingTask.courseCode}` : ''}
        subtitle={gradingTask?.title}
      >
        {gradingTask && (
          <div className="flex flex-col gap-3">
            {gradingTask.submissions.length === 0 ? (
              <p className="text-sm text-secondary py-4 text-center">
                All queue items for this batch are synchronized and ready for bulk rubric export.
              </p>
            ) : (
              gradingTask.submissions.map((sub) => {
                const scoreVal = draftScores[sub.id] ?? sub.score ?? 92;
                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold flex items-center justify-center">
                          {sub.initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-on-surface">
                            {sub.studentName}
                          </div>
                          <div className="text-[11px] text-outline">{sub.submittedAt}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          sub.status === 'Graded'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : sub.status === 'Flagged'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-secondary-container text-on-secondary-fixed'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{sub.notes}</p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-secondary">Score:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scoreVal}
                          onChange={(e) =>
                            setDraftScores((prev) => ({
                              ...prev,
                              [sub.id]: Number(e.target.value),
                            }))
                          }
                          className="w-16 h-8 px-2 rounded-lg bg-surface-container-lowest text-xs font-semibold tabular-nums border border-outline-variant/40"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onGradeSubmission(gradingTask.id, sub.id, scoreVal);
                          setGradingTask((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  gradedCount:
                                    sub.status === 'Graded'
                                      ? prev.gradedCount
                                      : prev.gradedCount + 1,
                                  submissions: prev.submissions.map((item) =>
                                    item.id === sub.id
                                      ? { ...item, status: 'Graded', score: scoreVal }
                                      : item
                                  ),
                                }
                              : null
                          );
                        }}
                        className="h-8 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                      >
                        {sub.status === 'Graded' ? 'Update Grade' : 'Approve Grade'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ModalSheet>

      {/* AI Analytics Modal */}
      <ModalSheet
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        title="AI Cohort Analytics"
        subtitle="Powered by Gemini Teaching Advisor"
      >
        {analyticsLoading ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-secondary">Analyzing cohort submission telemetry...</p>
          </div>
        ) : analyticsData ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-primary-fixed/40">
              <h3 className="text-sm font-bold text-on-primary-fixed">{analyticsData.headline}</h3>
              <p className="text-xs text-on-surface mt-1.5 leading-relaxed">
                {analyticsData.bottleneckAnalysis}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-outline tracking-wider">
                Recommended Interventions
              </span>
              {analyticsData.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface flex items-start gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ModalSheet>
    </div>
  );
}
