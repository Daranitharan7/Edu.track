import React, { useEffect, useState } from 'react';
import type { AppRoute, Assignment, Notice, StudyDay } from '../types';
import { ASSETS } from '../data/initialData';
import { ModalSheet, ResilientImage } from './SharedUI';

interface DashboardViewProps {
  assignments: Assignment[];
  studyDays: StudyDay[];
  studyGoalHours: number;
  notices: Notice[];
  onNavigate: (route: AppRoute) => void;
  onLogStudyHours: (dayIndex: number, delta: number) => void;
  onUpdateAssignmentProgress: (id: string, progress: number) => void;
  onAskAiAboutAssignment: (assignment: Assignment) => void;
}

export function DashboardView({
  assignments,
  studyDays,
  studyGoalHours,
  notices,
  onNavigate,
  onLogStudyHours,
  onUpdateAssignmentProgress,
  onAskAiAboutAssignment,
}: DashboardViewProps) {
  const [studySessionOpen, setStudySessionOpen] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState<string>(
    assignments.find((a) => a.status !== 'Completed')?.id || assignments[0]?.id || ''
  );
  const [uploadFileName, setUploadFileName] = useState('raft_election_v4.go');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(2);

  useEffect(() => {
    if (!sessionRunning) return;
    const timer = window.setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionRunning]);

  const totalTasks = assignments.length;
  const pendingTasks = assignments.filter((a) => a.status === 'Pending');
  const completedTasks = assignments.filter((a) => a.status === 'Completed');
  const urgentDeadlines = assignments.filter(
    (a) => a.status !== 'Completed' && (a.priority === 'High' || a.isUrgent)
  );
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const totalStudyHours = studyDays.reduce((acc, d) => acc + d.hours, 0);
  const upcomingAssignments = assignments
    .filter((a) => a.status !== 'Completed')
    .slice(0, 2);
  const featuredNotice = notices[0];

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleFinishSession = () => {
    const addedHours = Math.max(0.5, Number((secondsElapsed / 3600).toFixed(1)));
    onLogStudyHours(2, addedHours);
    setSessionRunning(false);
    setSecondsElapsed(0);
    setStudySessionOpen(false);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = assignments.find((a) => a.id === selectedUploadId);
    if (target) {
      const nextProgress = Math.min(100, Math.max(target.progress + 20, 85));
      onUpdateAssignmentProgress(target.id, nextProgress);
    }
    setUploadModalOpen(false);
  };

  return (
    <div className="px-4 lg:px-6 pt-3 pb-6 flex flex-col gap-5">
      {/* Greeting Header */}
      <section className="flex items-center justify-between gap-4 pt-1">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
            Wednesday, Oct 24, 2024
          </span>
          <h1 className="text-[26px] lg:text-[30px] font-bold text-on-surface tracking-tight leading-tight mt-0.5">
            Good Morning, Alex! 👋
          </h1>
          <span className="text-xs font-medium text-secondary mt-0.5">
            CS Senior · Semester 7
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-container shadow-sm shrink-0 cursor-pointer"
          aria-label="Open Student Profile"
        >
          <ResilientImage
            src={ASSETS.studentHeroAvatar}
            alt="Alex Rivera"
            fallbackText="AR"
            className="w-full h-full object-cover"
          />
        </button>
      </section>

      {/* Responsive Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Primary Column */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* AI Study Suggestion Spotlight Card */}
          <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-container via-primary to-surface-tint text-on-primary p-5 shadow-md">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-on-primary">
                  <span className="material-symbols-outlined material-symbols-filled text-[16px] text-tertiary-fixed">
                    auto_awesome
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide">AI Study Priority</span>
                </div>
                <span className="text-[11px] font-semibold text-on-primary/85 tabular-nums">
                  36h Remaining
                </span>
              </div>
              <p className="text-sm text-on-primary/95 leading-relaxed">
                <span className="text-[15px] text-white font-semibold">
                  CS-402 Distributed Systems
                </span>{' '}
                is nearing submission. Focus{' '}
                <strong className="text-white">2 hours tonight</strong> on the Raft Consensus
                protocol algorithm validation.
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStudySessionOpen(true);
                    setSessionRunning(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-11 px-4 bg-surface text-primary rounded-lg text-sm font-semibold shadow-sm hover:bg-surface-container transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined material-symbols-filled text-[18px]">
                    play_circle
                  </span>
                  <span>Start Study Session</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('calendar-and-planner')}
                  className="flex items-center justify-center h-11 px-4 bg-white/15 text-on-primary rounded-lg text-sm font-medium hover:bg-white/25 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>View Plan</span>
                </button>
              </div>
            </div>
          </section>

          {/* Key Metrics Summary 2x2 Grid */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-on-surface">Academic Overview</h2>
              <span className="text-[11px] font-semibold text-secondary">Term Week 8</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Total Tasks */}
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between gap-1.5 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                    Total Tasks
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    assignment
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] leading-[36px] font-bold text-on-surface tabular-nums">
                    {totalTasks}
                  </span>
                  <span className="text-xs text-outline">assigned</span>
                </div>
                <div className="flex items-center gap-1 text-tertiary">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span className="text-[11px] font-semibold">+3 this week</span>
                </div>
              </button>

              {/* Pending */}
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between gap-1.5 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                    Pending
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-amber-500">
                    pending_actions
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] leading-[36px] font-bold text-on-surface tabular-nums">
                    {pendingTasks.length}
                  </span>
                  <span className="text-xs text-outline">in queue</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full w-max">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-semibold">
                    {pendingTasks.filter((a) => a.priority === 'High').length || 2} High Priority
                  </span>
                </div>
              </button>

              {/* Completed */}
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between gap-1.5 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                    Completed
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-tertiary">
                    task_alt
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] leading-[36px] font-bold text-on-surface tabular-nums">
                    {completedTasks.length}
                  </span>
                  <span className="text-xs text-outline">finished</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-tertiary-fixed/35 text-tertiary px-2 py-0.5 rounded-full w-max">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  <span className="text-[11px] font-semibold tabular-nums">
                    {completionRate}% rate
                  </span>
                </div>
              </button>

              {/* Deadlines */}
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between gap-1.5 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                    Deadlines
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-error">
                    event_busy
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] leading-[36px] font-bold text-on-surface tabular-nums">
                    {urgentDeadlines.length}
                  </span>
                  <span className="text-xs text-outline">this week</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-error-container text-error px-2 py-0.5 rounded-full w-max">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  <span className="text-[11px] font-semibold">Urgent</span>
                </div>
              </button>
            </div>
          </section>

          {/* Weekly Study Habit Card */}
          <section className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-on-surface">Weekly Study Habit</span>
                <span className="text-xs text-secondary">
                  Logged focus time · Tap a day to log +0.5h
                </span>
              </div>
              <div className="text-right">
                <span className="text-[18px] font-bold text-primary tabular-nums">
                  {totalStudyHours.toFixed(1)} hrs
                </span>
                <span className="block text-[11px] font-semibold text-tertiary tabular-nums">
                  Goal: {studyGoalHours} hrs
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center items-end h-32 pt-2">
              {studyDays.map((day, idx) => {
                const fillPct = Math.min(100, Math.round((day.hours / 4.2) * 100));
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={`${day.dayFull}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedDayIndex(idx);
                      onLogStudyHours(idx, 0.5);
                    }}
                    title={`${day.dayFull}: ${day.hours.toFixed(1)}h (click to log +0.5h)`}
                    className={`flex flex-col items-center gap-1 h-full justify-end rounded-lg p-1 transition-colors cursor-pointer ${
                      isSelected ? 'bg-surface-container-low' : 'hover:bg-surface-container-low/60'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        day.isCurrent ? 'text-primary font-bold' : 'text-outline'
                      }`}
                    >
                      {day.hours.toFixed(1)}h
                    </span>
                    <div
                      className={`w-full rounded-lg flex flex-col justify-end overflow-hidden h-16 ${
                        day.completed || day.isCurrent ? 'bg-primary/20' : 'bg-surface-container'
                      }`}
                    >
                      <div
                        className={`w-full rounded-lg transition-all duration-300 ${
                          day.completed || day.isCurrent ? 'bg-primary' : 'bg-surface-variant'
                        }`}
                        style={{ height: `${fillPct}%` }}
                      />
                    </div>
                    {day.completed ? (
                      <div className="w-4 h-4 rounded-full bg-tertiary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-tertiary font-bold">
                          check
                        </span>
                      </div>
                    ) : day.isCurrent ? (
                      <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] font-bold">bolt</span>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-surface-variant flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                      </div>
                    )}
                    <span
                      className={`text-[11px] font-semibold ${
                        day.isCurrent ? 'text-primary' : 'text-secondary'
                      }`}
                    >
                      {day.dayShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Secondary Column */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Quick Floating Control Actions */}
          <section className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('ai-assistant')}
              className="h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 text-sm font-medium shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              <span>Ask AI Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="h-12 bg-surface-container-lowest text-on-surface rounded-xl flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:bg-surface-container active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">
                upload_file
              </span>
              <span>Upload Work</span>
            </button>
          </section>

          {/* Upcoming Deadlines Section */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-on-surface">Upcoming Deadlines</h2>
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                See All ({assignments.filter((a) => a.status !== 'Completed').length})
              </button>
            </div>

            {upcomingAssignments.map((task) => (
              <div
                key={task.id}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="bg-secondary-container text-on-secondary-fixed px-2 py-0.5 rounded text-[11px] font-semibold">
                        {task.courseCode}
                      </span>
                      {task.priority === 'High' ? (
                        <span className="bg-error-container text-error px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" /> High Priority
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Med Priority
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-on-surface truncate">
                      {task.title.replace(`${task.courseCode}: `, '').replace('Distributed Systems: ', 'Distributed Systems Lab 4').includes('Raft') ? 'Distributed Systems Lab 4' : task.title}
                    </h3>
                    <span className="text-xs text-secondary mt-0.5 truncate">{task.subtitle}</span>
                  </div>
                  {task.thumbnailUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                      <ResilientImage
                        src={task.thumbnailUrl}
                        alt={task.courseCode}
                        fallbackText={task.courseCode}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {task.progress > 0 ? (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] font-medium text-outline">{task.dueLabel}</span>
                      <span className="text-[11px] font-semibold text-primary tabular-nums">
                        {task.progress}% Complete
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      <span className="text-xs">{task.dueLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAskAiAboutAssignment(task)}
                      className="bg-surface-container hover:bg-surface-variant px-2.5 py-1 rounded text-outline hover:text-on-surface text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Pending Start · Ask AI
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Campus Notices Preview */}
          {featuredNotice && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-on-surface">Campus Notices</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('announcements')}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  View Feed
                </button>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('announcements')}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex gap-3 items-start text-left hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">campaign</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="bg-error-container text-error px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {featuredNotice.tag}
                    </span>
                    <span className="text-xs text-outline">{featuredNotice.timeAgo}</span>
                  </div>
                  <h4 className="text-[15px] font-semibold text-on-surface leading-snug">
                    {featuredNotice.title}
                  </h4>
                  <p className="text-xs text-secondary mt-1 line-clamp-2">{featuredNotice.body}</p>
                </div>
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Focus Study Session Modal */}
      <ModalSheet
        open={studySessionOpen}
        onClose={() => {
          setSessionRunning(false);
          setStudySessionOpen(false);
        }}
        title="Focused Study Session"
        subtitle="CS-402 Distributed Systems · Raft Consensus Validation"
      >
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="w-40 h-40 rounded-full bg-primary-fixed/40 flex flex-col items-center justify-center border-4 border-primary">
            <span className="text-3xl font-bold font-mono text-primary tabular-nums">
              {formatTimer(secondsElapsed)}
            </span>
            <span className="text-xs text-secondary mt-1">
              {sessionRunning ? 'Focus active' : 'Paused'}
            </span>
          </div>
          <p className="text-xs text-secondary text-center max-w-sm">
            Goal: Validate Section 5.2 State Transitions and election timeout randomization in{' '}
            <code className="font-mono bg-surface-container px-1 rounded">
              HandleRequestVote()
            </code>
            .
          </p>
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setSessionRunning((r) => !r)}
              className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-medium text-sm hover:bg-surface-variant cursor-pointer"
            >
              {sessionRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={handleFinishSession}
              className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-95 cursor-pointer"
            >
              Log &amp; Finish (+0.5h)
            </button>
          </div>
        </div>
      </ModalSheet>

      {/* Upload Work Modal */}
      <ModalSheet
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Deliverable"
        subtitle="Attach draft or final submission to update progress"
      >
        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">Target Assignment</span>
            <select
              value={selectedUploadId}
              onChange={(e) => setSelectedUploadId(e.target.value)}
              className="h-11 px-3 rounded-xl bg-surface-container-low text-sm text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {assignments
                .filter((a) => a.status !== 'Completed')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.courseCode} — {a.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-on-surface-variant">
              File / Repository Artifact
            </span>
            <input
              type="text"
              value={uploadFileName}
              onChange={(e) => setUploadFileName(e.target.value)}
              className="h-11 px-3 rounded-xl bg-surface-container-low text-sm text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="h-10 px-4 rounded-lg bg-surface-container text-on-surface-variant text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold cursor-pointer"
            >
              Submit Milestone
            </button>
          </div>
        </form>
      </ModalSheet>
    </div>
  );
}
