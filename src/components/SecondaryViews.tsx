import React, { useState } from 'react';
import type { AcademicDocument, AppRoute, PlannerEvent } from '../types';
import { ASSETS } from '../data/initialData';
import { ModalSheet, ResilientImage } from './SharedUI';

/* ---------------- Calendar & Planner ---------------- */
interface PlannerViewProps {
  events: PlannerEvent[];
  onAddEvent: (ev: Omit<PlannerEvent, 'id'>) => void;
  onNavigate: (route: AppRoute) => void;
}

export function CalendarPlannerView({ events, onAddEvent, onNavigate }: PlannerViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dayLabel, setDayLabel] = useState('Thu, Oct 25');
  const [timeRange, setTimeRange] = useState('4:00 PM – 5:30 PM');
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('CS-402');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent({
      dayLabel,
      timeRange,
      title: title.trim(),
      courseCode,
      type: 'Study Block',
    });
    setTitle('');
    setModalOpen(false);
  };

  return (
    <div className="px-4 lg:px-6 pt-4 pb-8 flex flex-col gap-4 lg:max-w-5xl lg:mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[28px] leading-[36px] font-bold text-on-surface tracking-tight">
            Calendar &amp; Planner
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            AI-prioritized study blocks &amp; submission deadlines
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Block</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-start justify-between gap-3"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed">
                  {ev.courseCode}
                </span>
                <span
                  className={
                    ev.type === 'Deadline' ? 'text-error' : 'text-primary'
                  }
                >
                  {ev.type}
                </span>
              </div>
              <h2 className="text-base font-semibold text-on-surface">{ev.title}</h2>
              <p className="text-xs text-secondary">
                {ev.dayLabel} · {ev.timeRange}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ai-assistant')}
              className="w-9 h-9 rounded-lg bg-surface-container hover:bg-primary-fixed text-primary flex items-center justify-center shrink-0 cursor-pointer"
              title="Open in AI Copilot"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </button>
          </div>
        ))}
      </div>

      <ModalSheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Study Block"
        subtitle="Add focused study time to your weekly planner"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Day</span>
              <input
                type="text"
                value={dayLabel}
                onChange={(e) => setDayLabel(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Course</span>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-on-surface-variant">Time Range</span>
            <input
              type="text"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-on-surface-variant">Focus Topic</span>
            <input
              type="text"
              placeholder="e.g. Raft Log Replication Unit Tests"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="h-10 px-4 rounded-lg bg-surface-container text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
            >
              Save Block
            </button>
          </div>
        </form>
      </ModalSheet>
    </div>
  );
}

/* ---------------- Academic Documents ---------------- */
interface DocumentsViewProps {
  documents: AcademicDocument[];
  activeDocId: string;
  onSelectForCopilot: (docId: string) => void;
  onAddDocument: (doc: Omit<AcademicDocument, 'id'>) => void;
}

export function AcademicDocumentsView({
  documents,
  activeDocId,
  onSelectForCopilot,
  onAddDocument,
}: DocumentsViewProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('CS-402');
  const [summary, setSummary] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddDocument({
      name: name.trim().endsWith('.pdf') ? name.trim() : `${name.trim()}.pdf`,
      courseCode: courseCode.trim().toUpperCase() || 'CS-402',
      sizeLabel: '1.4 MB',
      slidesLabel: '16 slides indexed',
      uploadedAt: 'Just now',
      summary: summary.trim() || 'Uploaded lecture notes indexed for Copilot Q&A.',
    });
    setName('');
    setSummary('');
    setUploadOpen(false);
  };

  return (
    <div className="px-4 lg:px-6 pt-4 pb-8 flex flex-col gap-4 lg:max-w-5xl lg:mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[28px] leading-[36px] font-bold text-on-surface tracking-tight">
            Academic Documents
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Indexed lecture slides, course readers, and saved AI summaries
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Index PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {documents.map((doc) => {
          const isActive = doc.id === activeDocId;
          return (
            <div
              key={doc.id}
              className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[11px] font-bold">
                    {doc.courseCode}
                  </span>
                  {doc.isSavedNote ? (
                    <span className="text-[11px] font-semibold text-tertiary">Saved AI Note</span>
                  ) : (
                    <span className="text-[11px] text-outline">{doc.uploadedAt}</span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-on-surface mt-2 truncate">
                  {doc.name}
                </h2>
                <p className="text-xs text-secondary mt-1 line-clamp-2">{doc.summary}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                <span className="text-[11px] text-outline">
                  {doc.sizeLabel} · {doc.slidesLabel}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectForCopilot(doc.id)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                      : 'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  <span>{isActive ? 'Active in Copilot' : 'Ask Copilot'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ModalSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Index Course Document"
        subtitle="Make lecture notes available to Academic Copilot"
      >
        <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Course Code</span>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Document Name</span>
              <input
                type="text"
                placeholder="Lec5_Paxos.pdf"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
                required
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-on-surface-variant">
              Key Topics / Syllabus Notes
            </span>
            <textarea
              rows={3}
              placeholder="Brief overview for Copilot grounding..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="p-3 rounded-lg bg-surface-container-low text-sm border border-outline-variant/40"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              className="h-10 px-4 rounded-lg bg-surface-container text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
            >
              Index Document
            </button>
          </div>
        </form>
      </ModalSheet>
    </div>
  );
}

/* ---------------- Settings ---------------- */
interface SettingsViewProps {
  userRole: 'student' | 'faculty';
  studyGoalHours: number;
  onChangeStudyGoal: (hours: number) => void;
  onToggleRole: () => void;
  onShowToast: (msg: string) => void;
}

export function SettingsView({
  userRole,
  studyGoalHours,
  onChangeStudyGoal,
  onToggleRole,
  onShowToast,
}: SettingsViewProps) {
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);

  return (
    <div className="px-4 lg:px-6 pt-4 pb-8 flex flex-col gap-5 lg:max-w-3xl lg:mx-auto">
      <h1 className="text-[28px] leading-[36px] font-bold text-on-surface tracking-tight">
        Account &amp; Preferences
      </h1>

      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ResilientImage
            src={userRole === 'faculty' ? ASSETS.facultyAvatar : ASSETS.studentHeroAvatar}
            alt="Profile"
            fallbackText={userRole === 'faculty' ? 'SV' : 'AR'}
            className="w-14 h-14 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-on-surface truncate">
              {userRole === 'faculty' ? 'Dr. Sarah Vance' : 'Alex Rivera'}
            </h2>
            <p className="text-xs text-secondary truncate">
              {userRole === 'faculty'
                ? 'Associate Professor · Distributed Systems'
                : 'CS Senior · Semester 7'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleRole}
          className="h-9 px-3.5 rounded-lg bg-primary-fixed text-on-primary-fixed text-xs font-semibold shrink-0 cursor-pointer"
        >
          Switch to {userRole === 'faculty' ? 'Student' : 'Faculty'}
        </button>
      </div>

      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-on-surface">Weekly Study Target</div>
            <div className="text-xs text-secondary">
              Used for Dashboard Study Habit progress ring
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeStudyGoal(Math.max(5, studyGoalHours - 1))}
              className="w-8 h-8 rounded-lg bg-surface-container text-sm font-bold cursor-pointer"
            >
              -
            </button>
            <span className="text-sm font-bold text-primary w-14 text-center tabular-nums">
              {studyGoalHours} hrs
            </span>
            <button
              type="button"
              onClick={() => onChangeStudyGoal(Math.min(50, studyGoalHours + 1))}
              className="w-8 h-8 rounded-lg bg-surface-container text-sm font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 pt-3 border-t border-surface-container cursor-pointer">
          <div>
            <div className="text-sm font-semibold text-on-surface">Urgent Deadline Alerts</div>
            <div className="text-xs text-secondary">Notify 24h before assignment cutoffs</div>
          </div>
          <input
            type="checkbox"
            checked={deadlineAlerts}
            onChange={(e) => {
              setDeadlineAlerts(e.target.checked);
              onShowToast(
                e.target.checked ? 'Deadline alerts enabled' : 'Deadline alerts muted'
              );
            }}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between gap-3 pt-3 border-t border-surface-container cursor-pointer">
          <div>
            <div className="text-sm font-semibold text-on-surface">AI Study Velocity Hints</div>
            <div className="text-xs text-secondary">
              Show optimal time-of-day study recommendations
            </div>
          </div>
          <input
            type="checkbox"
            checked={aiSuggestions}
            onChange={(e) => {
              setAiSuggestions(e.target.checked);
              onShowToast(
                e.target.checked ? 'AI velocity insights enabled' : 'AI velocity insights hidden'
              );
            }}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
