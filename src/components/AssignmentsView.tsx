import React, { useMemo, useState } from 'react';
import type { Assignment, AssignmentStatus, PriorityLevel } from '../types';
import { ModalSheet } from './SharedUI';

interface AssignmentsViewProps {
  assignments: Assignment[];
  onToggleComplete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onAddAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  onAskAi: (assignment: Assignment) => void;
  onShowToast: (msg: string) => void;
}

type FilterTab = 'All' | AssignmentStatus;
type SortMode = 'due' | 'velocity' | 'priority';

export function AssignmentsView({
  assignments,
  onToggleComplete,
  onUpdateProgress,
  onAddAssignment,
  onAskAi,
  onShowToast,
}: AssignmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [sortMode, setSortMode] = useState<SortMode>('due');
  const [courseFilterOpen, setCourseFilterOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');

  const [detailTask, setDetailTask] = useState<Assignment | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);

  // New assignment form state
  const [newCourse, setNewCourse] = useState('CS-402');
  const [newTitle, setNewTitle] = useState('');
  const [newProfessor, setNewProfessor] = useState('Dr. Sarah Vance');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('High');
  const [newDue, setNewDue] = useState('Due Nov 05');

  const counts = useMemo(
    () => ({
      All: assignments.length,
      Pending: assignments.filter((a) => a.status === 'Pending').length,
      'In Progress': assignments.filter((a) => a.status === 'In Progress').length,
      Completed: assignments.filter((a) => a.status === 'Completed').length,
    }),
    [assignments]
  );

  const urgentCount = assignments.filter(
    (a) => a.status !== 'Completed' && (a.isUrgent || a.priority === 'High')
  ).length;

  const courses = useMemo(
    () => ['ALL', ...Array.from(new Set(assignments.map((a) => a.courseCode)))],
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = assignments.filter((a) => {
      if (activeTab !== 'All' && a.status !== activeTab) return false;
      if (selectedCourse !== 'ALL' && a.courseCode !== selectedCourse) return false;
      if (
        q &&
        !a.title.toLowerCase().includes(q) &&
        !a.courseCode.toLowerCase().includes(q) &&
        !a.professor.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      // Keep completed at bottom unless filtering specifically Completed
      if (activeTab === 'All') {
        if (a.status === 'Completed' && b.status !== 'Completed') return 1;
        if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      }
      if (sortMode === 'velocity') {
        return b.aiVelocityScore - a.aiVelocityScore;
      }
      if (sortMode === 'priority') {
        const rank: Record<PriorityLevel, number> = { High: 0, Medium: 1, Low: 2 };
        return rank[a.priority] - rank[b.priority];
      }
      return a.dueDateIso.localeCompare(b.dueDateIso);
    });
  }, [assignments, activeTab, selectedCourse, searchQuery, sortMode]);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddAssignment({
      courseCode: newCourse.trim().toUpperCase() || 'CS-400',
      title: newTitle.trim(),
      subtitle: 'Added via My Assignments',
      professor: newProfessor.trim() || 'Faculty Staff',
      assignedDate: 'Assigned Today',
      dueLabel: newDue.trim() || 'Due Soon',
      dueDateIso: '2024-11-05T23:59:00',
      priority: newPriority,
      status: 'Pending',
      progress: 0,
      estimatedHours: 3.0,
      aiVelocityScore: newPriority === 'High' ? 92 : 70,
    });
    setNewTitle('');
    setNewModalOpen(false);
  };

  const handleExportSchedule = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EduTrack AI//Academic Schedule//EN',
      ...assignments
        .filter((a) => a.status !== 'Completed')
        .map((a) =>
          [
            'BEGIN:VEVENT',
            `SUMMARY:${a.courseCode} - ${a.title}`,
            `DESCRIPTION:Instructor: ${a.professor} | Status: ${a.status} (${a.progress}%)`,
            `DTSTART:${a.dueDateIso.replace(/[-:]/g, '')}`,
            'END:VEVENT',
          ].join('\n')
        ),
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'edutrack-assignments.ics';
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Exported assignment deadlines (.ics)');
  };

  const sortLabel =
    sortMode === 'due'
      ? 'Due Date (Earliest First)'
      : sortMode === 'velocity'
      ? 'AI Velocity (Optimal Flow)'
      : 'Priority (Highest First)';

  return (
    <div className="px-4 lg:px-6 pb-8 flex flex-col">
      {/* Screen Header */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <div className="flex flex-col">
          <h1 className="text-[28px] leading-[36px] font-bold text-on-surface tracking-tight">
            My Assignments
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span className="text-on-surface-variant tabular-nums">{counts.All} Total Tasks</span>
            <span className="text-outline-variant">·</span>
            <span className="text-error tabular-nums">{urgentCount} Urgent</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-1 h-10 px-4 rounded-lg bg-primary-container text-on-primary text-sm font-medium shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New</span>
        </button>
      </div>

      {/* AI Smart Optimization Prompt Card */}
      <div className="relative overflow-hidden my-2 rounded-xl p-4 bg-gradient-to-r from-primary-fixed to-secondary-fixed shadow-sm">
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-on-primary-fixed font-bold uppercase tracking-wider">
                AI Study Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest/80 text-on-primary-fixed text-[10px] font-semibold">
                Optimal Flow
              </span>
            </div>
            <p className="text-sm text-on-secondary-fixed mt-1 leading-snug">
              You tackle technical problem sets{' '}
              <span className="font-semibold text-primary">40% faster</span> before 2 PM. We
              recommend starting with{' '}
              <strong className="text-on-secondary-fixed font-semibold">CS-402</strong> today.
            </p>
            <button
              type="button"
              onClick={() => {
                setSortMode('velocity');
                onShowToast('Sorted assignments by AI Velocity');
              }}
              className="mt-2 self-start flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <span>Sort by AI Velocity</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2.5 mt-2">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3.5 text-secondary text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, course, or professor..."
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
          <button
            type="button"
            aria-label="Voice or Quick Search"
            onClick={() => {
              setSearchQuery(searchQuery ? '' : 'Raft');
              onShowToast(searchQuery ? 'Search cleared' : 'Filtered by "Raft"');
            }}
            className="absolute right-2.5 w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {searchQuery ? 'close' : 'mic'}
            </span>
          </button>
        </div>

        {/* Filter Pills Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {(['All', 'Pending', 'In Progress', 'Completed'] as FilterTab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 shadow-sm transition-all cursor-pointer tabular-nums ${
                  active
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab} ({counts[tab]})
              </button>
            );
          })}
        </div>

        {/* Sorter & Course Filter Toggle */}
        <div className="flex items-center justify-between pt-1 text-xs text-on-surface-variant">
          <button
            type="button"
            onClick={() =>
              setSortMode((prev) =>
                prev === 'due' ? 'velocity' : prev === 'velocity' ? 'priority' : 'due'
              )
            }
            className="flex items-center gap-1.5 cursor-pointer hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">swap_vert</span>
            <span className="font-semibold text-on-surface">Sort:</span>
            <span className="text-secondary font-medium">{sortLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setCourseFilterOpen((o) => !o)}
            className="flex items-center gap-1 text-primary font-medium hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>{selectedCourse === 'ALL' ? 'Filter' : selectedCourse}</span>
          </button>
        </div>

        {courseFilterOpen && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {courses.map((course) => (
              <button
                key={course}
                type="button"
                onClick={() => setSelectedCourse(course)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedCourse === course
                    ? 'bg-secondary-container text-on-secondary-fixed font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                {course === 'ALL' ? 'All Courses' : course}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Cards Grid (1 col mobile, 2 cols lg) */}
      {filteredAssignments.length === 0 ? (
        <div className="mt-6 p-8 rounded-xl bg-surface-container-lowest text-center shadow-sm">
          <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
          <p className="text-sm font-semibold text-on-surface mt-2">No matching assignments</p>
          <p className="text-xs text-secondary mt-1">
            Try clearing your search or switching status filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {filteredAssignments.map((task) => {
            const isCompleted = task.status === 'Completed';
            return (
              <div
                key={task.id}
                className={`relative flex flex-col justify-between rounded-xl p-4 shadow-sm transition-all ${
                  isCompleted
                    ? 'bg-surface-container-low opacity-95'
                    : 'bg-surface-container-lowest hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Meta Tags */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="h-6 px-2.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-semibold flex items-center">
                        {task.courseCode}
                      </span>
                      {isCompleted ? (
                        <span className="h-6 px-2.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          Completed
                        </span>
                      ) : task.priority === 'High' ? (
                        <span className="h-6 px-2.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" />
                          High Priority
                        </span>
                      ) : task.priority === 'Medium' ? (
                        <span className="h-6 px-2.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          Medium Priority
                        </span>
                      ) : (
                        <span className="h-6 px-2.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                          Low Priority
                        </span>
                      )}
                    </div>

                    {isCompleted && task.gradeScore !== undefined ? (
                      <div className="h-6 px-2.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold flex items-center gap-1 tabular-nums">
                        <span className="material-symbols-outlined text-[13px]">grade</span>
                        <span>{task.gradeScore} / 100</span>
                      </div>
                    ) : (
                      <span
                        className={`h-6 px-2.5 rounded-full text-[11px] flex items-center gap-1 shrink-0 ${
                          task.isUrgent
                            ? 'bg-error-container/60 text-error font-bold'
                            : 'bg-surface-container text-on-surface-variant font-medium'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {task.isUrgent ? 'timer' : 'event'}
                        </span>
                        {task.dueLabel}
                      </span>
                    )}
                  </div>

                  {/* Title & Professor */}
                  <div className="mt-2.5">
                    <h2
                      className={`text-[18px] leading-[24px] font-semibold text-on-surface tracking-tight ${
                        isCompleted ? 'line-through opacity-80' : ''
                      }`}
                    >
                      {task.title}
                    </h2>
                    <p className="text-xs text-secondary mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="material-symbols-outlined text-[15px] text-outline">
                        school
                      </span>
                      <span>{task.professor}</span>
                      <span className="text-outline-variant">·</span>
                      <span className={isCompleted ? 'text-tertiary font-medium' : ''}>
                        {task.assignedDate}
                      </span>
                    </p>
                  </div>

                  {/* Progress Section */}
                  {!isCompleted && (
                    <div className="mt-4 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-on-surface-variant">Status: {task.status}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            task.progress > 0 ? 'text-primary' : 'text-secondary font-semibold'
                          }`}
                        >
                          {task.progress > 0 ? `${task.progress}%` : '0% Started'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-container transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick AI Milestone Highlight */}
                  {task.aiMilestone && !isCompleted && (
                    <div className="mt-3 p-2 rounded-lg bg-surface-container-low flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                          psychology
                        </span>
                        <span className="truncate">{task.aiMilestone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailTask(task)}
                        className="text-primary text-[11px] font-semibold shrink-0 hover:underline cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                {isCompleted ? (
                  <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-tertiary font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Feedback &amp; Rubric Available
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailTask(task)}
                      className="h-8 px-3 rounded-lg bg-surface-container-highest text-on-surface-variant text-xs font-medium hover:text-on-surface transition-colors cursor-pointer"
                    >
                      View Grade
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      {task.status === 'In Progress' && task.priority === 'High' ? (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => onToggleComplete(task.id)}
                            className="w-5 h-5 rounded text-primary-container accent-primary-container cursor-pointer"
                          />
                          <span className="text-xs font-medium text-on-surface">Complete</span>
                        </label>
                      ) : task.wordProgress ? (
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          <span>{task.wordProgress}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          <span>Est. {task.estimatedHours || 2.5} hrs</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailTask(task)}
                        className="h-9 px-3 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium hover:bg-surface-variant active:scale-95 transition-all cursor-pointer"
                      >
                        Details
                      </button>
                      {task.status === 'Pending' ? (
                        <button
                          type="button"
                          onClick={() => onUpdateProgress(task.id, 15)}
                          className="h-9 px-3.5 rounded-lg bg-primary-container text-on-primary text-xs font-medium flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          <span>Start Task</span>
                        </button>
                      ) : task.priority === 'Low' ? (
                        <button
                          type="button"
                          onClick={() => setDetailTask(task)}
                          className="h-9 px-3.5 rounded-lg bg-secondary-container text-on-secondary-fixed text-xs font-medium flex items-center gap-1 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAskAi(task)}
                          className="h-9 px-3.5 rounded-lg bg-primary text-on-primary text-xs font-medium flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            auto_awesome
                          </span>
                          <span>Ask AI</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Study Habit & Motivational Micro-Card */}
      <button
        type="button"
        onClick={() => setStreakModalOpen(true)}
        className="mt-5 p-4 rounded-xl bg-surface-container flex items-center justify-between gap-3 text-left hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">emoji_events</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-on-surface leading-tight">
              Semester Streak: 6 Days
            </span>
            <span className="text-xs text-secondary mt-0.5">
              Submit 1 more task to unlock Early Bird Badge.
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline">chevron_right</span>
      </button>

      {/* Bottom Workspace Utility Actions */}
      <div className="mt-4 flex items-center justify-center gap-4 py-2 text-secondary text-xs font-medium">
        <button
          type="button"
          onClick={handleExportSchedule}
          className="flex items-center gap-1 hover:text-on-surface transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>Export Schedule</span>
        </button>
        <span className="text-outline-variant">·</span>
        <button
          type="button"
          onClick={() => onShowToast('Synced 12 tasks with Canvas LMS')}
          className="flex items-center gap-1 hover:text-on-surface transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">sync</span>
          <span>Sync Canvas LMS</span>
        </button>
      </div>

      {/* Assignment Detail / Progress / Grade Modal */}
      <ModalSheet
        open={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        title={detailTask ? `${detailTask.courseCode}: ${detailTask.title}` : ''}
        subtitle={detailTask ? `${detailTask.professor} · ${detailTask.dueLabel}` : ''}
      >
        {detailTask && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant">{detailTask.subtitle}</p>
            {detailTask.status === 'Completed' ? (
              <div className="p-4 rounded-xl bg-tertiary-fixed/25 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
                    Verified Score
                  </span>
                  <span className="text-lg font-bold text-tertiary tabular-nums">
                    {detailTask.gradeScore ?? 95} / 100
                  </span>
                </div>
                <p className="text-sm text-on-surface">
                  {detailTask.gradeFeedback ||
                    'All test cases and rubric criteria satisfied ahead of deadline.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-on-surface-variant">Completion Progress</span>
                  <span className="text-primary tabular-nums">{detailTask.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={detailTask.progress}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value);
                    onUpdateProgress(detailTask.id, nextVal);
                    setDetailTask({
                      ...detailTask,
                      progress: nextVal,
                      status: nextVal === 100 ? 'Completed' : nextVal > 0 ? 'In Progress' : 'Pending',
                    });
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onToggleComplete(detailTask.id);
                  setDetailTask(null);
                }}
                className="h-10 px-4 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-variant cursor-pointer"
              >
                {detailTask.status === 'Completed' ? 'Reopen Task' : 'Mark Completed'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = detailTask;
                  setDetailTask(null);
                  onAskAi(t);
                }}
                className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>Ask AI Copilot</span>
              </button>
            </div>
          </div>
        )}
      </ModalSheet>

      {/* New Assignment Modal */}
      <ModalSheet
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Add New Assignment"
        subtitle="Create a personal or syllabus task"
      >
        <form onSubmit={handleCreateAssignment} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Course Code</span>
              <input
                type="text"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Priority</span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
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
              placeholder="e.g. Paxos Multi-Decree Proof"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Instructor</span>
              <input
                type="text"
                value={newProfessor}
                onChange={(e) => setNewProfessor(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Due Label</span>
              <input
                type="text"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewModalOpen(false)}
              className="h-10 px-4 rounded-lg bg-surface-container text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </ModalSheet>

      {/* Streak Modal */}
      <ModalSheet
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        title="Semester Streak: 6 Days"
        subtitle="Early Bird Badge Progress"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-on-surface-variant">
            You have logged study activity or submitted milestones for 6 consecutive days. Complete
            any pending task before its deadline to unlock the Early Bird Badge.
          </p>
          <div className="grid grid-cols-7 gap-2 text-center pt-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div
                key={i}
                className={`py-2 rounded-lg text-xs font-bold ${
                  i < 6
                    ? 'bg-tertiary-fixed/40 text-tertiary'
                    : 'bg-surface-container text-outline'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      </ModalSheet>
    </div>
  );
}
