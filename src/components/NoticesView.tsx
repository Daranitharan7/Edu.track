import React, { useMemo, useState } from 'react';
import type { Notice } from '../types';
import { ModalSheet } from './SharedUI';

interface NoticesViewProps {
  notices: Notice[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onAddNoticeToPlanner: (notice: Notice) => void;
}

type NoticeFilter = 'ALL' | 'IMPORTANT' | 'ACADEMIC' | 'DEPT' | 'CAMPUS';

export function NoticesView({
  notices,
  onMarkRead,
  onMarkAllRead,
  onAddNoticeToPlanner,
}: NoticesViewProps) {
  const [filter, setFilter] = useState<NoticeFilter>('ALL');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return notices;
    return notices.filter((n) => n.tag === filter);
  }, [notices, filter]);

  const unreadCount = notices.filter((n) => n.unread).length;

  return (
    <div className="px-4 lg:px-6 pt-4 pb-8 flex flex-col gap-4 lg:max-w-5xl lg:mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[28px] leading-[36px] font-bold text-on-surface tracking-tight">
            Campus Notices
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="h-9 px-3.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold cursor-pointer"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Segmented Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {(['ALL', 'IMPORTANT', 'DEPT', 'ACADEMIC', 'CAMPUS'] as NoticeFilter[]).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setFilter(tag)}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              filter === tag
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {tag === 'ALL'
              ? 'All Notices'
              : tag === 'DEPT'
              ? 'Department'
              : tag.charAt(0) + tag.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Notices Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((notice) => (
          <button
            key={notice.id}
            type="button"
            onClick={() => {
              onMarkRead(notice.id);
              setSelectedNotice(notice);
            }}
            className={`p-4 rounded-xl shadow-sm flex items-start gap-3 text-left transition-all cursor-pointer ${
              notice.unread
                ? 'bg-surface-container-lowest ring-1 ring-primary/15 hover:shadow-md'
                : 'bg-surface-container-low hover:bg-surface-container-lowest'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                notice.tag === 'IMPORTANT'
                  ? 'bg-error-container text-error'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {notice.tag === 'IMPORTANT'
                  ? 'priority_high'
                  : notice.tag === 'DEPT'
                  ? 'room_preferences'
                  : 'campaign'}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      notice.tag === 'IMPORTANT'
                        ? 'bg-error-container text-error'
                        : 'bg-secondary-container text-on-secondary-fixed'
                    }`}
                  >
                    {notice.tag}
                  </span>
                  {notice.unread && (
                    <span className="text-[10px] font-semibold text-primary">New</span>
                  )}
                </div>
                <span className="text-xs text-outline">{notice.timeAgo}</span>
              </div>
              <h2 className="text-base font-semibold text-on-surface leading-snug">
                {notice.title}
              </h2>
              <p className="text-xs text-secondary mt-1 line-clamp-2">{notice.body}</p>
              <div className="flex items-center gap-3 mt-2.5 text-[11px] text-outline">
                <span className="truncate">{notice.author}</span>
                <span>·</span>
                <span className="tabular-nums shrink-0">{notice.views} views</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <ModalSheet
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || ''}
        subtitle={
          selectedNotice ? `${selectedNotice.author} · ${selectedNotice.timeAgo}` : ''
        }
      >
        {selectedNotice && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="font-semibold text-primary">{selectedNotice.tag}</span>
              <span>·</span>
              <span>Audience: {selectedNotice.audience}</span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{selectedNotice.body}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="h-10 px-4 rounded-lg bg-surface-container text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddNoticeToPlanner(selectedNotice);
                  setSelectedNotice(null);
                }}
                className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">event_available</span>
                <span>Add to Planner</span>
              </button>
            </div>
          </div>
        )}
      </ModalSheet>
    </div>
  );
}
