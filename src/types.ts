export type AppRoute =
  | 'dashboard'
  | 'assignments'
  | 'ai-assistant'
  | 'announcements'
  | 'faculty-portal'
  | 'calendar-and-planner'
  | 'academic-documents'
  | 'settings';

export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type AssignmentStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Assignment {
  id: string;
  courseCode: string;
  title: string;
  subtitle: string;
  professor: string;
  assignedDate: string;
  dueLabel: string;
  dueDateIso: string;
  priority: PriorityLevel;
  status: AssignmentStatus;
  progress: number;
  estimatedHours?: number;
  wordProgress?: string;
  aiMilestone?: string;
  gradeScore?: number;
  gradeFeedback?: string;
  thumbnailUrl?: string;
  isUrgent?: boolean;
  aiVelocityScore: number;
}

export interface StudyDay {
  dayShort: string;
  dayFull: string;
  hours: number;
  completed: boolean;
  isCurrent?: boolean;
}

export interface ChatStep {
  label: string;
  detail: string;
}

export interface StructuredAiReply {
  title: string;
  intro: string;
  steps: ChatStep[];
  calloutTitle: string;
  calloutBody: string;
  referencedSource: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  senderLabel: string;
  timestamp: string;
  text?: string;
  structured?: StructuredAiReply;
  savedToNotes?: boolean;
  liked?: boolean;
}

export interface AcademicDocument {
  id: string;
  name: string;
  courseCode: string;
  sizeLabel: string;
  slidesLabel: string;
  uploadedAt: string;
  summary: string;
  isSavedNote?: boolean;
}

export interface Notice {
  id: string;
  tag: 'IMPORTANT' | 'ACADEMIC' | 'CAMPUS' | 'DEPT';
  title: string;
  body: string;
  author: string;
  audience: string;
  timeAgo: string;
  views: number;
  unread: boolean;
  delivered?: boolean;
}

export interface StudentSubmission {
  id: string;
  initials: string;
  studentName: string;
  submittedAt: string;
  status: 'Needs Review' | 'Graded' | 'Flagged';
  score?: number;
  similarityScore?: number;
  notes: string;
}

export interface FacultyTask {
  id: string;
  courseCode: string;
  title: string;
  dueLabel: string;
  batchLabel: string;
  submittedCount: number;
  totalStudents: number;
  gradedCount: number;
  similarityFlags: number;
  submissionsClosed: boolean;
  submissions: StudentSubmission[];
}

export interface Flashcard {
  front: string;
  back: string;
  hint: string;
}

export interface PlannerEvent {
  id: string;
  dayLabel: string;
  timeRange: string;
  title: string;
  courseCode: string;
  type: 'Study Block' | 'Deadline' | 'Office Hour' | 'Lecture';
}
