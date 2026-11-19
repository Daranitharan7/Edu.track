import React, { useState } from 'react';
import type { AppRoute } from '../types';
import { ASSETS } from '../data/initialData';
import { BrandLogo, ResilientImage } from './SharedUI';

interface AppShellProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  unreadNoticesCount: number;
  userRole: 'student' | 'faculty';
  onToggleRole: () => void;
  toastMessage: string | null;
  children: React.ReactNode;
}

const ROUTE_SUBTITLES: Record<AppRoute, string> = {
  dashboard: 'Dashboard',
  assignments: 'Assignments',
  'ai-assistant': 'AI Assistant',
  announcements: 'Notices',
  'faculty-portal': 'Faculty Portal',
  'calendar-and-planner': 'Planner',
  'academic-documents': 'Documents',
  settings: 'Settings',
};

const PRIMARY_TABS: Array<{ route: AppRoute; label: string; icon: string }> = [
  { route: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { route: 'assignments', label: 'Assignments', icon: 'assignment' },
  { route: 'ai-assistant', label: 'AI Assistant', icon: 'auto_awesome' },
  { route: 'announcements', label: 'Notices', icon: 'campaign' },
  { route: 'faculty-portal', label: 'Faculty', icon: 'shield_person' },
];

export function AppShell({
  activeRoute,
  onNavigate,
  unreadNoticesCount,
  userRole,
  onToggleRole,
  toastMessage,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top Fixed App Bar */}
      <header className="fixed top-0 inset-x-0 z-40 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Open Menu"
              onClick={() => setDrawerOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <BrandLogo className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-[16px] font-semibold leading-none text-on-surface tracking-tight whitespace-nowrap">
                  EduTrack AI
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant leading-none pt-1 whitespace-nowrap">
                  {ROUTE_SUBTITLES[activeRoute]}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary Navigation">
            {PRIMARY_TABS.map((tab) => {
              const isActive = activeRoute === tab.route;
              return (
                <button
                  key={tab.route}
                  type="button"
                  onClick={() => handleNav(tab.route)}
                  className={`flex items-center gap-1.5 px-2 py-2 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      tab.route === 'ai-assistant' && !isActive ? 'text-primary' : ''
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => handleNav('announcements')}
              className="w-11 h-11 relative flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadNoticesCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface" />
              )}
            </button>
            <button
              type="button"
              aria-label="Profile & Settings"
              onClick={() => handleNav('settings')}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors cursor-pointer"
            >
              <ResilientImage
                src={userRole === 'faculty' ? ASSETS.facultyAvatar : ASSETS.studentHeaderAvatar}
                alt="User Profile"
                fallbackText={userRole === 'faculty' ? 'SV' : 'AR'}
                className="w-8 h-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/30 backdrop-blur-xs transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[82vw] bg-surface-container-lowest shadow-[0_20px_25px_-5px_rgba(15,23,42,0.14)] z-50 transform transition-transform duration-300 ease-out flex flex-col justify-between pt-safe pb-safe ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Academic Hub Drawer"
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandLogo className="h-8 w-8" />
              <span className="text-base font-semibold text-on-surface">EduTrack AI</span>
            </div>
            <button
              type="button"
              aria-label="Close Drawer"
              onClick={() => setDrawerOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase text-outline tracking-wider px-3 pb-1">
              Academic Hub
            </span>
            <button
              type="button"
              onClick={() => handleNav('dashboard')}
              className={`flex items-center gap-3 h-12 px-3 rounded-lg transition-colors cursor-pointer ${
                activeRoute === 'dashboard'
                  ? 'bg-primary-fixed/50 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span className="text-sm font-medium">Student Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('calendar-and-planner')}
              className={`flex items-center gap-3 h-12 px-3 rounded-lg transition-colors cursor-pointer ${
                activeRoute === 'calendar-and-planner'
                  ? 'bg-primary-fixed/50 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span className="text-sm font-medium">Calendar &amp; Planner</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('academic-documents')}
              className={`flex items-center gap-3 h-12 px-3 rounded-lg transition-colors cursor-pointer ${
                activeRoute === 'academic-documents'
                  ? 'bg-primary-fixed/50 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              <span className="text-sm font-medium">Academic Documents</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('settings')}
              className={`flex items-center gap-3 h-12 px-3 rounded-lg transition-colors cursor-pointer ${
                activeRoute === 'settings'
                  ? 'bg-primary-fixed/50 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-2 border-t border-surface-container">
          <button
            type="button"
            onClick={() => {
              onToggleRole();
              setDrawerOpen(false);
            }}
            className="flex items-center gap-3 h-11 px-3 rounded-lg text-primary hover:bg-primary-fixed/30 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            <span className="text-sm font-medium">
              Switch to {userRole === 'student' ? 'Faculty View' : 'Student View'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleNav('settings')}
            className="flex items-center gap-3 h-11 px-3 rounded-lg text-error hover:bg-error-container/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">Account &amp; Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 pb-24 lg:pb-10">
        <div className="max-w-7xl mx-auto w-full">{children}</div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-inverse-surface text-inverse-on-surface text-xs font-medium shadow-lg flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile & Tablet Fixed Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.05)]"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="h-16 px-1 flex items-center justify-around">
          {PRIMARY_TABS.map((tab) => {
            const isActive = activeRoute === tab.route;
            return (
              <button
                key={tab.route}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNav(tab.route)}
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    tab.route === 'ai-assistant' || isActive ? 'text-primary' : ''
                  } ${isActive ? 'material-symbols-filled' : ''}`}
                >
                  {tab.icon}
                </span>
                <span className="text-[11px] leading-[14px] mt-0.5 tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
