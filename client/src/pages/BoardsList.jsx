import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import CreateBoardModal from '../components/CreateBoardModal.jsx';
import { Plus, FolderKanban, Users, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { timeAgo } from '../utils/timeago.js';

export default function BoardsList() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/boards');
      setBoards(data.boards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (newBoardData) => {
    const { data } = await api.post('/boards', newBoardData);
    setBoards([data.board, ...boards]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Workspaces & Boards
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Welcome back, <span className="font-semibold text-indigo-400">{user?.name}</span>. Select a board or start a new sprint.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Workspace
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-500">Loading your collaborative boards...</p>
          </div>
        ) : boards.length === 0 ? (
          /* Empty State */
          <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 mb-4">
              <FolderKanban className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No active workspaces</h3>
            <p className="mt-1 max-w-md text-xs text-slate-400">
              You aren't a member of any project boards yet. Create your first workspace with standard Kanban columns in seconds.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              Create First Board
            </button>
          </div>
        ) : (
          /* Boards Grid */
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((b) => {
              const isOwner = String(b.owner?._id || b.owner) === String(user?._id);
              const myMembership = b.members?.find(
                (m) => String(m.user?._id || m.user) === String(user?._id)
              );

              return (
                <Link
                  key={b._id}
                  to={`/boards/${b._id}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-indigo-500/10 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {b.title}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {isOwner ? (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            Owner
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 capitalize">
                            {myMembership?.role || 'Member'}
                          </span>
                        )}
                        <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                      {b.description || 'Collaborative Kanban workspace.'}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{b.members?.length || 1} {b.members?.length === 1 ? 'member' : 'members'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      <span>Updated {timeAgo(b.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateBoard}
        />
      )}
    </div>
  );
}
