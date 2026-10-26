import { X, History, Sparkles } from 'lucide-react';
import { timeAgo } from '../utils/timeago.js';

export default function ActivityPanel({
  activities = [],
  onClose,
  onLoadMore,
  hasMore = false,
  loading = false,
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-400" />
          <h2 className="text-sm font-bold tracking-wide text-white">Board Activity History</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-xs text-slate-500">
            <History className="h-8 w-8 text-slate-700 mb-2" />
            <p>No activity recorded on this board yet.</p>
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act._id}
              className="relative flex gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 hover:border-slate-700 transition-colors"
            >
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 text-[10px] font-bold">
                {act.actorName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-300 leading-snug">
                  <span className="font-semibold text-slate-100">{act.actorName}</span>{' '}
                  {act.text}
                </p>
                <span className="mt-1 block text-[10px] text-slate-500 font-mono">
                  {timeAgo(act.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading older activity...' : 'Load more history'}
          </button>
        )}
      </div>
    </div>
  );
}
