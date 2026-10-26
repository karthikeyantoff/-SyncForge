import { useState } from 'react';
import { X, UserPlus, Shield, User, Trash2, LogOut, AlertCircle } from 'lucide-react';

export default function MemberModal({
  board,
  currentUserId,
  isOwner,
  onClose,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onAddMember(email.trim(), role);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Board Collaborators</h2>
              <p className="text-xs text-slate-400">Manage access and role permissions</p>
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

        {/* Invite Form (Owner Only) */}
        {isOwner && (
          <form onSubmit={handleInvite} className="mt-4 border-b border-slate-800 pb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="member">Member (Editor)</option>
                <option value="viewer">Viewer (Read-Only)</option>
              </select>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
          {board.members?.map((m) => {
            const u = m.user;
            if (!u) return null;
            const isMe = String(u._id) === String(currentUserId);
            const isBoardOwner = String(board.owner?._id || board.owner) === String(u._id);

            return (
              <div
                key={u._id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      u.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-200">{u.name}</span>
                      {isMe && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{u.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBoardOwner ? (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                      Owner
                    </span>
                  ) : isOwner ? (
                    <select
                      value={m.role}
                      onChange={(e) => onUpdateRole(u._id, e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-400 capitalize">
                      {m.role}
                    </span>
                  )}

                  {/* Remove or Leave Action */}
                  {!isBoardOwner && (isOwner || isMe) && (
                    <button
                      onClick={() => {
                        const msg = isMe
                          ? 'Are you sure you want to leave this board?'
                          : `Remove ${u.name} from this board?`;
                        if (confirm(msg)) {
                          onRemoveMember(u._id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      title={isMe ? 'Leave Board' : 'Remove Member'}
                    >
                      {isMe ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
