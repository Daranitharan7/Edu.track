import React, { useEffect, useRef, useState } from 'react';
import type {
  AcademicDocument,
  Assignment,
  ChatMessage,
  Flashcard,
} from '../types';
import { ModalSheet } from './SharedUI';

interface AiAssistantViewProps {
  messages: ChatMessage[];
  documents: AcademicDocument[];
  activeDocId: string;
  assignments: Assignment[];
  pendingPrompt: string | null;
  onClearPendingPrompt: () => void;
  onSelectDoc: (docId: string) => void;
  onAppendMessage: (msg: ChatMessage) => void;
  onToggleMessageLike: (msgId: string) => void;
  onSaveMessageToNotes: (msg: ChatMessage) => void;
  onShowToast: (msg: string) => void;
}

const MODES = ['Reasoning', 'Fast', 'Study Coach'] as const;
type CopilotMode = (typeof MODES)[number];

export function AiAssistantView({
  messages,
  documents,
  activeDocId,
  assignments,
  pendingPrompt,
  onClearPendingPrompt,
  onSelectDoc,
  onAppendMessage,
  onToggleMessageLike,
  onSaveMessageToNotes,
  onShowToast,
}: AiAssistantViewProps) {
  const [mode, setMode] = useState<CopilotMode>('Reasoning');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Flashcards modal state
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isGenerating]);

  const sendQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isGenerating) return;

    setErrorBanner(null);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      senderLabel: 'Alex (You)',
      timestamp: nowTime,
      text: trimmed,
    };
    onAppendMessage(userMsg);
    setInputText('');
    setIsGenerating(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.structured
          ? `${m.structured.title}: ${m.structured.intro} ${m.structured.calloutBody}`
          : m.text || '',
      }));

      const assignmentsSummary = assignments
        .filter((a) => a.status !== 'Completed')
        .slice(0, 5)
        .map((a) => `${a.courseCode} ${a.title} (${a.dueLabel}, ${a.progress}% done)`)
        .join('; ');

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          mode,
          activeDocument: activeDoc
            ? {
                name: activeDoc.name,
                courseCode: activeDoc.courseCode,
                summary: activeDoc.summary,
              }
            : undefined,
          history: historyPayload,
          assignmentsSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.structured) {
        throw new Error(data.error || 'Unable to reach Academic Copilot.');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        senderLabel: 'EduTrack AI Copilot',
        timestamp: 'Just now',
        structured: data.structured,
      };
      onAppendMessage(aiMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed.';
      setErrorBanner(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (pendingPrompt) {
      const q = pendingPrompt;
      onClearPendingPrompt();
      void sendQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  const handleOpenFlashcards = async (msg: ChatMessage) => {
    setFlashcardsOpen(true);
    setFlashcardsLoading(true);
    setActiveCardIdx(0);
    setCardFlipped(false);

    const topic = msg.structured?.title || activeDoc?.name || 'Raft Consensus';
    const contextText = msg.structured
      ? `${msg.structured.intro} ${msg.structured.steps.map((s) => `${s.label}: ${s.detail}`).join(' ')}`
      : msg.text || '';

    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          contextText,
          courseCode: activeDoc?.courseCode || 'CS-402',
        }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.flashcards)) {
        throw new Error(data.error || 'Could not generate flashcards.');
      }
      setFlashcards(data.flashcards);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Flashcard generation failed.';
      onShowToast(message);
      setFlashcardsOpen(false);
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const handleCopy = async (msg: ChatMessage) => {
    const plain = msg.structured
      ? `${msg.structured.title}\n\n${msg.structured.intro}\n${msg.structured.steps
          .map((s, i) => `${i + 1}. ${s.label}: ${s.detail}`)
          .join('\n')}\n\n${msg.structured.calloutTitle}: ${msg.structured.calloutBody}`
      : msg.text || '';
    try {
      await navigator.clipboard.writeText(plain);
      onShowToast('Copied explanation to clipboard');
    } catch {
      onShowToast('Copied to study clipboard');
    }
  };

  return (
    <div className="flex flex-col w-full pb-4 lg:max-w-4xl lg:mx-auto">
      {/* Assistant Context Header Card */}
      <section className="px-4 py-2">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined material-symbols-filled text-[22px]">
                  auto_awesome
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base font-semibold text-on-surface truncate">
                    Academic Copilot
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold">
                    Gemini
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-tertiary-container" />
                  <span className="text-xs text-on-surface-variant truncate">
                    Online · Course-Grounded Academic Model
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setModeMenuOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface-variant text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">
                  psychology
                </span>
                <span>{mode}</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {modeMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-surface-container-lowest shadow-lg border border-surface-container z-20 p-1">
                  {MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setModeMenuOpen(false);
                        onShowToast(`Switched Copilot to ${m} mode`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                        mode === m
                          ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Document Context Attachment Indicator */}
          {activeDoc && (
            <button
              type="button"
              onClick={() => setDocPickerOpen(true)}
              className="flex items-center justify-between bg-surface-container-low hover:bg-surface-container px-3 py-2 rounded-lg text-on-surface transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                  description
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-on-surface truncate">
                    {activeDoc.name}
                  </span>
                  <span className="text-[11px] text-on-surface-variant truncate">
                    {activeDoc.sizeLabel} · {activeDoc.slidesLabel}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-tertiary text-[11px] font-semibold shrink-0 bg-tertiary-fixed/40 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined material-symbols-filled text-[12px]">
                  check_circle
                </span>
                Active
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Suggested Action Pills */}
      <section className="w-full overflow-x-auto no-scrollbar px-4 py-1 flex items-center gap-2">
        {[
          {
            icon: 'bolt',
            color: 'text-primary',
            label: 'Summarize uploaded notes',
            query: `Summarize the key concepts from ${activeDoc?.name || 'my lecture notes'} for quick exam review.`,
          },
          {
            icon: 'calendar_month',
            color: 'text-secondary',
            label: 'Plan study schedule',
            query: 'Build an optimal 3-day study schedule prioritizing my upcoming CS-402 and AI-301 deadlines.',
          },
          {
            icon: 'quiz',
            color: 'text-tertiary',
            label: 'Practice quiz (CS-402)',
            query: 'Give me 3 conceptual checkpoint questions on Raft Leader Election and Log Replication.',
          },
          {
            icon: 'compare_arrows',
            color: 'text-outline',
            label: 'Paxos vs Raft',
            query: 'Compare Multi-Paxos and Raft consensus algorithms in simple terms.',
          },
        ].map((pill) => (
          <button
            key={pill.label}
            type="button"
            disabled={isGenerating}
            onClick={() => void sendQuery(pill.query)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container transition-colors text-xs font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${pill.color}`}>
              {pill.icon}
            </span>
            <span>{pill.label}</span>
          </button>
        ))}
      </section>

      {/* Chat Message Stream */}
      <section className="flex flex-col gap-4 px-4 pt-3 pb-4">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex items-start justify-end gap-2 max-w-[92%] self-end">
                <div className="bg-primary text-on-primary p-3.5 rounded-2xl rounded-tr-sm shadow-sm flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-semibold text-on-primary-container">
                      {msg.senderLabel}
                    </span>
                    <span className="text-[11px] text-on-primary-container">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-on-primary leading-relaxed">{msg.text}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                </div>
              </div>
            );
          }

          if (msg.structured) {
            return (
              <div key={msg.id} className="flex items-start gap-2 w-full">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 mt-0.5 shadow-sm">
                  <span className="material-symbols-outlined material-symbols-filled text-[15px]">
                    auto_awesome
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col gap-3 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                        psychology_alt
                      </span>
                      <span className="text-[17px] font-semibold text-on-surface leading-snug">
                        {msg.structured.title}
                      </span>
                    </div>
                    <span className="text-xs text-outline shrink-0">{msg.timestamp}</span>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {msg.structured.intro}
                  </p>

                  <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-lg">
                    {msg.structured.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {index + 1}
                        </span>
                        <p className="text-sm text-on-surface leading-relaxed">
                          <strong>{step.label}:</strong> {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 bg-secondary-container/40 p-3 rounded-lg text-on-secondary-fixed-variant">
                    <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                      assignment_turned_in
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] uppercase font-semibold text-primary tracking-wide">
                        {msg.structured.calloutTitle}
                      </span>
                      <span className="text-sm text-on-surface leading-relaxed mt-0.5">
                        {msg.structured.calloutBody}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5 text-on-surface-variant text-xs">
                    <span className="material-symbols-outlined text-outline text-[15px]">
                      bookmark
                    </span>
                    <span>
                      Referenced:{' '}
                      <span className="font-medium text-on-surface">
                        {msg.structured.referencedSource}
                      </span>
                    </span>
                  </div>

                  {/* Quick AI Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Copy Response"
                        onClick={() => void handleCopy(msg)}
                        className="w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Save to Notes"
                        onClick={() => onSaveMessageToNotes(msg)}
                        className={`w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer ${
                          msg.savedToNotes ? 'text-primary' : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {msg.savedToNotes ? 'bookmark_added' : 'bookmark_add'}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Helpful"
                        onClick={() => onToggleMessageLike(msg.id)}
                        className={`w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer ${
                          msg.liked ? 'text-primary' : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleOpenFlashcards(msg)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">
                          style
                        </span>
                        <span>Flashcards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputText(`Follow-up on ${msg.structured?.title}: `);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">add_comment</span>
                        <span>Follow-up</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-start gap-2 max-w-[90%]">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 mt-0.5 shadow-sm">
                <span className="material-symbols-outlined material-symbols-filled text-[15px]">
                  school
                </span>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-primary font-semibold">{msg.senderLabel}</span>
                  <span className="text-xs text-outline">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {/* Active Synthesis Indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 pl-9">
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3.5 py-2 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-xs text-on-surface-variant">
                Synthesizing answer from {activeDoc?.name || 'course materials'}...
              </span>
            </div>
          </div>
        )}

        {errorBanner && (
          <div className="ml-9 p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center justify-between gap-2">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="font-semibold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
        <div ref={endRef} />
      </section>

      {/* Sticky Bottom Query Bar */}
      <section className="sticky bottom-16 lg:bottom-2 w-full px-4 pb-1 pt-1 bg-gradient-to-t from-surface via-surface/95 to-transparent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendQuery(inputText);
          }}
          className="bg-surface-container-lowest rounded-2xl shadow-lg p-2 flex items-center gap-1.5"
        >
          <button
            type="button"
            aria-label="Attach Course Material"
            onClick={() => setDocPickerOpen(true)}
            title="Switch active course document"
            className="w-10 h-10 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">attach_file</span>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything about your courses or notes..."
            className="w-full bg-transparent border-0 outline-none text-on-surface placeholder:text-outline text-sm px-1"
          />
          <button
            type="button"
            aria-label="Insert sample prompt"
            onClick={() => {
              setInputText('How should I test HandleRequestVote() edge cases in Lab 4?');
              inputRef.current?.focus();
            }}
            className="w-10 h-10 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            aria-label="Send Query"
            className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shrink-0 shadow-sm disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </form>
        <div className="flex items-center justify-center gap-1.5 pt-1.5 text-on-surface-variant text-[11px] font-medium">
          <span className="material-symbols-outlined text-[13px] text-outline">verified_user</span>
          <span>Answers grounded in official course syllabus &amp; lecture documents</span>
        </div>
      </section>

      {/* Switch Course Document Modal */}
      <ModalSheet
        open={docPickerOpen}
        onClose={() => setDocPickerOpen(false)}
        title="Select Grounding Document"
        subtitle="Copilot cites slides and notes from your active file"
      >
        <div className="flex flex-col gap-2">
          {documents.map((doc) => {
            const isSelected = doc.id === activeDoc?.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  onSelectDoc(doc.id);
                  setDocPickerOpen(false);
                  onShowToast(`Active context: ${doc.name}`);
                }}
                className={`p-3 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary-fixed/50 border border-primary/30'
                    : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary">{doc.courseCode}</span>
                    <span className="text-sm font-semibold text-on-surface truncate">
                      {doc.name}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-0.5 truncate">{doc.slidesLabel}</p>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ModalSheet>

      {/* Interactive Flashcards Modal */}
      <ModalSheet
        open={flashcardsOpen}
        onClose={() => setFlashcardsOpen(false)}
        title="Active Recall Flashcards"
        subtitle={activeDoc?.courseCode || 'CS-402'}
      >
        {flashcardsLoading ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-secondary">Generating study deck with Gemini...</p>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-secondary tabular-nums">
              <span>
                Card {activeCardIdx + 1} of {flashcards.length}
              </span>
              <span>Tap card to flip</span>
            </div>
            <button
              type="button"
              onClick={() => setCardFlipped((f) => !f)}
              className="min-h-[180px] p-5 rounded-2xl bg-gradient-to-br from-primary-fixed/60 to-surface-container-low flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-transform active:scale-[0.99]"
            >
              <span className="text-[11px] uppercase tracking-wider font-bold text-primary">
                {cardFlipped ? 'Answer' : 'Question'}
              </span>
              <p className="text-base font-semibold text-on-surface leading-relaxed">
                {cardFlipped ? flashcards[activeCardIdx].back : flashcards[activeCardIdx].front}
              </p>
              {!cardFlipped && flashcards[activeCardIdx].hint && (
                <span className="text-xs text-secondary">
                  Hint: {flashcards[activeCardIdx].hint}
                </span>
              )}
            </button>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={activeCardIdx === 0}
                onClick={() => {
                  setActiveCardIdx((i) => Math.max(0, i - 1));
                  setCardFlipped(false);
                }}
                className="h-10 px-4 rounded-lg bg-surface-container text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCardFlipped((f) => !f)}
                className="h-10 px-4 rounded-lg bg-primary-fixed text-on-primary-fixed text-xs font-semibold cursor-pointer"
              >
                {cardFlipped ? 'Show Question' : 'Reveal Answer'}
              </button>
              <button
                type="button"
                disabled={activeCardIdx === flashcards.length - 1}
                onClick={() => {
                  setActiveCardIdx((i) => Math.min(flashcards.length - 1, i + 1));
                  setCardFlipped(false);
                }}
                className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </ModalSheet>
    </div>
  );
}
