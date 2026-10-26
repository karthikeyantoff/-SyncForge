import { useState } from 'react';
import { X, Calendar, User, Tag, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { priorityConfig, labelColors } from '../theme.js';

export default function CardModal({
  card,
  boardMembers = [],
  onClose,
  onSave,
  onDelete,
  isViewer = false,
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [assignee, setAssignee] = useState(card.assignee?._id || card.assignee || '');
  const [dueDate, setDueDate] = useState(
    card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''
  );
  const [labels, setLabels] = useState(card.labels || []);
  const [newTagText, setNewTagText] = useState('');
  const [newTagColor, setNewTagColor] = useState('indigo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddLabel = () => {
    if (!newTagText.trim()) return;
    if (labels.some((l) => l.text.toLowerCase() === newTagText.trim().toLowerCase())) return;
    setLabels([...labels, { text: newTagText.trim(), color: newTagColor }]);
    setNewTagText('');
  };

  const handleRemoveLabel = (idx) => {
    setLabels(labels.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError('');

    try {
      await onSave({
        _id: card._id,
        title: title.trim(),
        description,
        priority,
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels,
        version: card.version, // Send OCC version
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500">
                Card ID: {card._id?.slice(-6)} • v{card.version}
              </span>
              {card.createdBy && (
                <span className="text-xs text-slate-500">
                  created by {card.createdBy.name}
                </span>
              )}
            </div>

            {isViewer ? (
              <h2 className="text-xl font-bold text-white">{card.title}</h2>
            ) : (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Card title..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-lg font-bold text-white focus:border-indigo-500 focus:outline-none"
              />
            )}
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
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Metadata Grid: Priority, Assignee, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Priority
              </label>
              {isViewer ? (
                <div className="text-sm font-medium text-slate-300 capitalize">{priority}</div>
              ) : (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Assignee
              </label>
              {isViewer ? (
                <div className="text-sm font-medium text-slate-300">
                  {card.assignee?.name || 'Unassigned'}
                </div>
              ) : (
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {boardMembers.map((m) => {
                    const u = m.user;
                    if (!u) return null;
                    return (
                      <option key={u._id} value={u._id}>
                        {u.name} ({m.role})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Due Date
              </label>
              {isViewer ? (
                <div className="text-sm font-medium text-slate-300">
                  {dueDate || 'No due date'}
                </div>
              ) : (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            {isViewer ? (
              <div className="min-h-[90px] rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                {description || <span className="text-slate-600 italic">No description provided</span>}
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details, checklists, acceptance criteria..."
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            )}
          </div>

          {/* Labels / Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Labels
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {labels.map((lbl, idx) => {
                const colorClass = labelColors[lbl.color] || labelColors.indigo;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium ${colorClass}`}
                  >
                    {lbl.text}
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(idx)}
                        className="hover:opacity-80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
              {labels.length === 0 && (
                <span className="text-xs text-slate-600 italic">No labels added</span>
              )}
            </div>

            {!isViewer && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="New label tag..."
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                />
                <select
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="indigo">Indigo</option>
                  <option value="blue">Blue</option>
                  <option value="emerald">Emerald</option>
                  <option value="amber">Amber</option>
                  <option value="rose">Rose</option>
                  <option value="purple">Purple</option>
                  <option value="slate">Slate</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  Add Tag
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            {!isViewer ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete card "${card.title}"?`)) {
                    onDelete(card._id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Card
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                {isViewer ? 'Close' : 'Cancel'}
              </button>
              {!isViewer && (
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
