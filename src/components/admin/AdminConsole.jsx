import React from 'react';
import SafeSection from '../SafeSection';
import { X } from 'lucide-react';

/**
 * Wrapper component to isolate admin UI crashes.
 * For now it renders children passed from App (we'll extract the full admin UI in follow-up edits).
 */
export default function AdminConsole({ theme, styles, title = 'Admin console', onClose, children }) {
  const t = styles;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${t.card} rounded-lg shadow-xl w-[min(1400px,96vw)] h-[min(780px,92vh)] mx-2 border ${t.border} overflow-hidden`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
          <div>
            <div className={`text-lg font-bold ${t.text}`}>{title}</div>
            <div className={`text-xs ${t.textSecondary}`}>Beheer per programma</div>
          </div>
          <button
            onClick={onClose}
            className={`${t.buttonSecondary} px-3 py-2 rounded text-sm`}
            title="Sluiten"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-full">
          <SafeSection name="admin-console" title="Admin console crashte" className="h-full">
            {children}
          </SafeSection>
        </div>
      </div>
    </div>
  );
}
