import { useState } from 'react';
import { X, FolderPlus, Sparkles, AlertCircle } from 'lucide-react';

export default function CreateBoardModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isTitleValid = title.trim().length >= 3 && title.trim().length <= 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTitleValid) {
      setError('Board title must be between 3 and 100 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        template,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Board</h2>
              <p className="text-xs text-slate-400">Set up a shared collaborative workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Board Title <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[10px] font-mono ${title.length > 100 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                {title.length}/100
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Q4 Sprint Roadmap"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            {title && title.trim().length < 3 && (
              <p className="mt-1 text-[11px] text-rose-400">Title must be at least 3 characters long</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description (Optional)
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {description.length}/500
              </span>
            </div>
            <textarea
              placeholder="What is this workspace focused on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Template checkbox */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={template}
                onChange={(e) => setTemplate(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  Auto-create standard Kanban workflow
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generates Backlog, To Do, In Progress, In Review, and Done columns automatically.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isTitleValid}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
