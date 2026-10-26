import { AlertTriangle, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { priorityConfig } from '../theme.js';

export default function ConflictDialog({ attempted, server, onOverwrite, onDiscard }) {
  const attemptedPriority = priorityConfig[attempted.priority] || priorityConfig.medium;
  const serverPriority = priorityConfig[server.priority] || priorityConfig.medium;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
        {/* Banner */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Concurrent Edit Conflict Detected (OCC)</h2>
            <p className="text-xs text-slate-400">
              Another collaborator saved a new version while you were editing this card. Choose how you want to resolve this state.
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Server Version */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Server Version (v{server.version})
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${serverPriority.bg} ${serverPriority.text} ${serverPriority.border}`}>
                {serverPriority.label}
              </span>
            </div>

            <div className="font-semibold text-white text-sm">{server.title}</div>
            <p className="mt-2 text-xs text-slate-400 whitespace-pre-wrap min-h-[60px]">
              {server.description || <span className="text-slate-600 italic">No description</span>}
            </p>
          </div>

          {/* Your Attempted Version */}
          <div className="rounded-xl border-2 border-indigo-500/40 bg-indigo-950/10 p-4">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Your Edit (Draft)
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${attemptedPriority.bg} ${attemptedPriority.text} ${attemptedPriority.border}`}>
                {attemptedPriority.label}
              </span>
            </div>

            <div className="font-semibold text-white text-sm">{attempted.title}</div>
            <p className="mt-2 text-xs text-slate-400 whitespace-pre-wrap min-h-[60px]">
              {attempted.description || <span className="text-slate-600 italic">No description</span>}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onDiscard}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Keep Collaborator's Version
          </button>
          <button
            onClick={onOverwrite}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Overwrite With My Changes
          </button>
        </div>
      </div>
    </div>
  );
}
