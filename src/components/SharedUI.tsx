import React, { useState } from 'react';
import { ASSETS } from '../data/initialData';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackIcon?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackText,
  fallbackIcon = 'image',
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary-fixed to-secondary-container text-primary font-semibold select-none ${className}`}
        aria-label={alt}
      >
        {fallbackText ? (
          <span className="text-xs font-bold tracking-tight">{fallbackText}</span>
        ) : (
          <span className="material-symbols-outlined text-[18px]">{fallbackIcon}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function BrandLogo({ className = 'h-8 w-8' }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-xs shrink-0`}
        aria-label="EduTrack AI Logo"
      >
        <span className="material-symbols-outlined text-[18px]">school</span>
      </div>
    );
  }

  return (
    <img
      src={ASSETS.logo}
      alt="EduTrack AI Logo"
      referrerPolicy="no-referrer"
      className={`${className} object-contain shrink-0 rounded-lg`}
      onError={() => setFailed(true)}
    />
  );
}

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ModalSheet({ open, onClose, title, subtitle, children }: ModalSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-on-surface/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[88vh] flex flex-col bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-surface-container">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-on-surface truncate">{title}</h2>
            {subtitle && <p className="text-xs text-secondary mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
